import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { getInsurancePlans, getSearchFilters, searchHospitals } from "@/lib/search";
import type { ChatIntent, InsurancePlan, SearchResult } from "@/lib/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  messages?: ChatMessage[];
  symptomAction?: {
    action?: "confirm" | "decline";
    surgeryType?: string;
  };
}

interface SymptomSuggestionPayload {
  specialty: string;
  suggestedSurgeries: string[];
  reasoning: string;
  disclaimer: string;
  confirmPrompt: string;
  confidence: number;
  reasonSignals: string[];
  requiresConfirmation: boolean;
}

type ChatKind = "direct" | "symptom" | "general" | "emergency";

interface ChatClassification {
  kind: ChatKind;
}

interface SymptomMatch {
  specialty: string;
  suggestedSurgeries: string[];
  reasoning: string;
  confidence?: number;
  reasonSignals?: string[];
}

interface SymptomRule {
  surgery: string;
  specialty: string;
  patterns: RegExp[];
  secondaryPatterns?: RegExp[];
  reasoning: string;
}

interface InsuranceMatch extends InsurancePlan {
  matchingHospitalIds: string[];
}

interface HospitalReason {
  hospitalId: string;
  reasons: string[];
}

const normalize = (value: string) => value.trim().toLowerCase();

const MAX_BODY_BYTES = 24_000;
const MAX_MESSAGES = 40;
const MAX_MESSAGE_CHARS = 900;
const MAX_TOTAL_CHARS = 9_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 35;

const rateLimitStore = new Map<string, { count: number; windowStart: number }>();

const extractIntentTool = {
  type: "function" as const,
  function: {
    name: "extract_search_intent",
    description:
      "Extract surgery search intent from the user's plain-language request for a healthcare marketplace in India.",
    parameters: {
      type: "object",
      properties: {
        surgeryType: {
          type: "string",
          description: "Surgery name, for example Knee Replacement or Cataract Surgery.",
        },
        city: {
          type: "string",
          description: "Indian city, for example Delhi, Bangalore, or Mumbai.",
        },
        maxBudget: {
          type: "number",
          description: "Maximum budget in INR as a number.",
        },
        minRating: {
          type: "number",
          description: "Minimum acceptable hospital rating from 1 to 5.",
        },
      },
      additionalProperties: false,
    },
  },
};

const classifyIntentTool = {
  type: "function" as const,
  function: {
    name: "classify_chat_intent",
    description: "Classify whether the user is requesting a known procedure, describing symptoms, making a general request, or describing a potential emergency.",
    parameters: {
      type: "object",
      properties: {
        kind: {
          type: "string",
          enum: ["direct", "symptom", "general", "emergency"],
          description: "direct for a named surgery/procedure; symptom for non-emergency symptoms without a named procedure; emergency for urgent warning signs.",
        },
      },
      required: ["kind"],
      additionalProperties: false,
    },
  },
};

const EMERGENCY_PATTERNS = [
  /chest pain|chest pressure|chest tightness|crushing chest/i,
  /difficulty breathing|trouble breathing|shortness of breath|cannot breathe|breathless at rest/i,
  /severe bleeding|bleeding won.t stop|coughing blood|vomiting blood|blood in vomit/i,
  /face droop|slurred speech|sudden weakness|one.side weakness|stroke|cannot move arm/i,
  /unconscious|passed out|fainted|seizure|convulsion/i,
  /heart attack|cardiac arrest|collapse/i,
  /sudden confusion|sudden vision loss|worst headache/i,
];

const GENERAL_CHAT_PATTERNS = /^(hi|hello|hey|thanks|thank you|ok|okay|help|what can you do)[!. ]*$/i;
const SYMPTOM_HINT_PATTERNS = /(pain|ache|swelling|stiffness|dizzy|discomfort|numb|vision|hearing|ear|ears|earache|ringing|tinnitus|breath|cough|wheeze|phlegm|fever|sore|weakness|nausea|vomit|headache|chronic|since|months|years|problem|issue)/i;

const EMERGENCY_REPLY =
  "Your symptoms may need urgent medical attention. Please seek immediate emergency care or call your local emergency services now. SurgiFind cannot assess or recommend treatment for a possible emergency.";

const SYMPTOM_DISCLAIMER =
  "This is not a medical diagnosis. Please consult a licensed doctor to confirm the right treatment for you.";

const SYMPTOM_RULES: SymptomRule[] = [
  {
    surgery: "Knee Replacement",
    specialty: "Orthopedic",
    patterns: [/knee pain/, /knee hurts?/, /knee hurting/, /stiff knee/, /climb(?:ing)? stairs/, /arthritis/],
    secondaryPatterns: [/joint pain/, /mobility/, /walking pain/, /knee swelling/],
    reasoning:
      "Persistent knee pain with stair-climbing or mobility limitation can be linked to joint degeneration patterns that may need orthopedic evaluation.",
  },
  {
    surgery: "Hip Replacement",
    specialty: "Orthopedic",
    patterns: [/hip pain/, /hip stiffness/, /groin pain while walking/, /difficulty walking/],
    secondaryPatterns: [/reduced range of motion/, /limping/, /joint pain/],
    reasoning:
      "Hip pain with stiffness or gait limitation can be associated with structural joint wear and is commonly assessed in orthopedic pathways.",
  },
  {
    surgery: "Spine Decompression",
    specialty: "Spine / Orthopedic",
    patterns: [/back pain/, /sciatica/, /radiating pain/, /leg numb/, /tingling in leg/, /nerve pain/],
    secondaryPatterns: [/slipped disc/, /disc/, /shooting pain/],
    reasoning:
      "Back pain with radiating numbness or tingling can indicate possible nerve compression and should be evaluated for spine-focused treatment options.",
  },
  {
    surgery: "Cataract Surgery",
    specialty: "Ophthalmology",
    patterns: [/blurred vision/, /cloudy vision/, /night glare/, /vision getting worse/, /difficulty seeing at night/],
    secondaryPatterns: [/eyesight/, /foggy vision/],
    reasoning:
      "Gradual cloudy or blurry vision, especially with glare, is often reviewed by eye specialists to assess lens-related causes and treatment options.",
  },
  {
    surgery: "Appendectomy",
    specialty: "General Surgery",
    patterns: [/right lower abdominal pain/, /right side abdominal pain/, /appendix pain/, /pain near navel moving right/],
    secondaryPatterns: [/abdominal pain/, /nausea/, /loss of appetite/],
    reasoning:
      "Localized abdominal pain with digestive discomfort can require prompt general-surgery evaluation to rule out appendiceal causes.",
  },
  {
    surgery: "Gallbladder Removal",
    specialty: "General Surgery",
    patterns: [/upper right abdominal pain/, /gallbladder pain/, /pain after fatty food/, /bloating after meals/],
    secondaryPatterns: [/nausea after meals/, /right side pain/],
    reasoning:
      "Recurring upper abdominal discomfort, especially meal-related episodes, can align with gallbladder conditions that need surgical review.",
  },
  {
    surgery: "Hernia Repair",
    specialty: "General Surgery",
    patterns: [/groin bulge/, /hernia/, /abdominal bulge/, /pain while lifting/, /strain-related groin pain/],
    secondaryPatterns: [/bulge gets worse on standing/, /cough strain pain/],
    reasoning:
      "A visible bulge with exertion-related pain can be consistent with hernia patterns typically assessed by general surgery.",
  },
  {
    surgery: "Cardiac Bypass",
    specialty: "Cardiac",
    patterns: [/chest discomfort on exertion/, /angina/, /blocked arteries/, /cardiac ischemia/],
    secondaryPatterns: [/palpitation/, /fatigue on walking/, /shortness of breath on exertion/],
    reasoning:
      "Exertional chest discomfort patterns can indicate cardiac risk and should be evaluated by a cardiologist to determine the right interventional path.",
  },
  {
    surgery: "Dental Implant",
    specialty: "Dental / Oral Surgery",
    patterns: [/missing tooth/, /tooth loss/, /difficulty chewing/, /dental gap/],
    secondaryPatterns: [/long-term tooth problem/, /oral function issue/],
    reasoning:
      "Tooth loss with chewing difficulty can require oral surgery assessment for implant-based restoration options.",
  },
  {
    surgery: "Cesarean Section",
    specialty: "Obstetrics",
    patterns: [/pregnan(?:t|cy).*(delivery|birth)/, /previous c[- ]?section/, /planned c[- ]?section/, /baby position breech/],
    secondaryPatterns: [/labor complications/, /delivery concern/],
    reasoning:
      "Pregnancy and delivery-context concerns can require obstetric evaluation to determine whether a cesarean pathway is appropriate.",
  },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function clampConfidence(value: number): number {
  return Math.max(0.35, Math.min(0.95, Number(value.toFixed(2))));
}

function getClientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  return forwarded || realIp || "anonymous";
}

function checkRateLimit(clientKey: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const current = rateLimitStore.get(clientKey);

  if (!current || now - current.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(clientKey, { count: 1, windowStart: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - current.windowStart);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  current.count += 1;
  rateLimitStore.set(clientKey, current);
  return { allowed: true, retryAfterSeconds: 0 };
}

function validateMessages(messages: ChatMessage[]): string | null {
  if (messages.length > MAX_MESSAGES) {
    return `Please keep the conversation under ${MAX_MESSAGES} messages per request.`;
  }

  let totalChars = 0;

  for (const message of messages) {
    if (message.role !== "user" && message.role !== "assistant") {
      return "Invalid message role detected in request.";
    }

    if (typeof message.content !== "string") {
      return "Invalid message content detected in request.";
    }

    if (message.content.length > MAX_MESSAGE_CHARS) {
      return `Each message must be below ${MAX_MESSAGE_CHARS} characters.`;
    }

    totalChars += message.content.length;
  }

  if (totalChars > MAX_TOTAL_CHARS) {
    return `Conversation payload is too large. Keep total text below ${MAX_TOTAL_CHARS} characters.`;
  }

  return null;
}

function inferSymptomSignals(message: string): string[] {
  const text = message.toLowerCase();
  const signals: string[] = [];

  const signalTests: Array<{ pattern: RegExp; label: string }> = [
    { pattern: /knee|hip|joint|stiff|arthritis|climb(?:ing)? stairs|mobility|walking pain/, label: "Joint and mobility symptoms" },
    { pattern: /vision|blur|cloudy|glare|eyesight/, label: "Vision-related symptoms" },
    { pattern: /stomach|abdominal|belly|right side|nausea/, label: "Abdominal and digestive symptoms" },
    { pattern: /back pain|leg numb|sciatica|tingling/, label: "Spine and nerve symptoms" },
    { pattern: /chest discomfort|palpitation|exertion|fatigue/, label: "Cardiac risk indicators" },
    { pattern: /cough|wheeze|breath|phlegm|chest congestion/, label: "Respiratory symptoms" },
    { pattern: /ear|ears|hearing|ringing|tinnitus/, label: "ENT and hearing symptoms" },
  ];

  for (const test of signalTests) {
    if (test.pattern.test(text)) {
      signals.push(test.label);
    }
  }

  if (/(since|months|years|chronic|ongoing|persistent)/.test(text)) {
    signals.push("Symptoms described as persistent");
  }

  return signals.slice(0, 4);
}

function inferCityFromText(message: string): string | undefined {
  const text = message.toLowerCase();

  if (text.includes("delhi")) {
    return "Delhi";
  }

  if (text.includes("bangalore") || text.includes("bengaluru")) {
    return "Bangalore";
  }

  if (text.includes("mumbai")) {
    return "Mumbai";
  }

  return undefined;
}

function buildNoMatchSymptomSuggestion(message: string): SymptomSuggestionPayload {
  const signals = inferSymptomSignals(message);
  const city = inferCityFromText(message);
  const looksRespiratory = /lung|lungs|chest|breath|breathing|cough|wheeze|phlegm/i.test(message);
  const looksOrthopedic = /knee|joint|hip|stiff|climb(?:ing)? stairs|walking|mobility/i.test(message);

  if (looksRespiratory && !signals.includes("Respiratory symptoms")) {
    signals.unshift("Respiratory symptoms");
  }

  if (city) {
    signals.push(`City preference detected: ${city}`);
  }

  return {
    specialty: looksRespiratory ? "Respiratory / Chest" : looksOrthopedic ? "Orthopedic" : "General",
    suggestedSurgeries: [],
    reasoning: looksRespiratory
      ? "I understand your concern. Your message sounds like respiratory or chest discomfort, but SurgiFind's current demo catalog does not include a dedicated lung surgery track, so I cannot safely suggest a specific procedure yet."
      : looksOrthopedic
        ? "I understand your concern. Your symptoms sound orthopedic, but I still need a clearer procedure target to safely map options from the current catalog."
      : "I understand your concern. I could not confidently map this symptom description to a specific procedure in the current catalog.",
    disclaimer: SYMPTOM_DISCLAIMER,
    confidence: looksOrthopedic ? 0.56 : 0.42,
    reasonSignals: signals.slice(0, 4),
    confirmPrompt: city
      ? `If you want, I can still help you search hospitals in ${city}. Please tell me a target procedure or use the Search filters.`
      : "If you want, I can still help you search hospitals. Please tell me a target procedure or use the Search filters.",
    requiresConfirmation: false,
  };
}

function coerceIntent(raw: unknown): ChatIntent {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const source = raw as Record<string, unknown>;

  const surgeryType = typeof source.surgeryType === "string" ? source.surgeryType.trim() : undefined;
  const city = typeof source.city === "string" ? source.city.trim() : undefined;
  const maxBudget = typeof source.maxBudget === "number" && Number.isFinite(source.maxBudget)
    ? source.maxBudget
    : undefined;
  const minRating = typeof source.minRating === "number" && Number.isFinite(source.minRating)
    ? Math.max(1, Math.min(5, source.minRating))
    : undefined;

  return {
    surgeryType: surgeryType || undefined,
    city: city || undefined,
    maxBudget,
    minRating,
  };
}

function coerceClassification(raw: unknown): ChatClassification {
  if (!raw || typeof raw !== "object") {
    return { kind: "general" };
  }

  const kind = (raw as Record<string, unknown>).kind;
  return kind === "direct" || kind === "symptom" || kind === "general" || kind === "emergency"
    ? { kind }
    : { kind: "general" };
}

function coerceSymptomMatch(raw: unknown, surgeryNames: string[]): SymptomMatch | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const source = raw as Record<string, unknown>;
  const specialty = typeof source.specialty === "string" ? source.specialty.trim() : "";
  const reasoning = typeof source.reasoning === "string" ? source.reasoning.trim() : "";
  const confidence = typeof source.confidence === "number" && Number.isFinite(source.confidence)
    ? clampConfidence(source.confidence)
    : undefined;
  const reasonSignals = Array.isArray(source.reasonSignals)
    ? source.reasonSignals
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 4)
    : undefined;
  const suggestedSurgeries = Array.isArray(source.suggestedSurgeries)
    ? source.suggestedSurgeries
        .filter((item): item is string => typeof item === "string")
        .map((item) => surgeryNames.find((surgery) => normalize(surgery) === normalize(item)))
        .filter((item): item is string => Boolean(item))
        .slice(0, 2)
    : [];

  return specialty && reasoning && suggestedSurgeries.length > 0
    ? { specialty, reasoning, suggestedSurgeries, confidence, reasonSignals }
    : null;
}

function hasEmergencySignals(message: string): boolean {
  return EMERGENCY_PATTERNS.some((pattern) => pattern.test(message));
}

function fallbackClassification(message: string): ChatClassification {
  const trimmed = message.trim();

  if (!trimmed || GENERAL_CHAT_PATTERNS.test(trimmed)) {
    return { kind: "general" };
  }

  if (hasEmergencySignals(message)) {
    return { kind: "emergency" };
  }

  if (extractIntentFallback(message).surgeryType) {
    return { kind: "direct" };
  }

  if (SYMPTOM_HINT_PATTERNS.test(message)) {
    return { kind: "symptom" };
  }

  return trimmed.split(/\s+/).length >= 3 ? { kind: "symptom" } : { kind: "general" };
}

function fallbackSymptomMatch(message: string, surgeryNames: string[]): SymptomMatch | null {
  const text = message.toLowerCase();
  const inferredSignals = inferSymptomSignals(message);
  const hasPersistence = /(since|months|years|chronic|ongoing|persistent)/i.test(message);

  const canonicalSurgery = (ruleSurgery: string) =>
    surgeryNames.find((surgery) => normalize(surgery) === normalize(ruleSurgery));

  const scored = SYMPTOM_RULES
    .map((rule) => {
      let score = 0;

      for (const pattern of rule.patterns) {
        if (pattern.test(text)) {
          score += 2;
        }
      }

      for (const pattern of rule.secondaryPatterns ?? []) {
        if (pattern.test(text)) {
          score += 1;
        }
      }

      if (hasPersistence) {
        score += 0.5;
      }

      return {
        rule,
        canonical: canonicalSurgery(rule.surgery),
        score,
      };
    })
    .filter((entry) => Boolean(entry.canonical) && entry.score >= 2)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return null;
  }

  const primary = scored[0];
  const secondary = scored.find((entry) => entry.rule.surgery !== primary.rule.surgery);
  const suggestedSurgeries = [primary.canonical, secondary?.canonical]
    .filter((item): item is string => Boolean(item))
    .slice(0, 2);

  const normalizedConfidence = clampConfidence(Math.min(0.9, 0.55 + primary.score * 0.08));

  return {
    specialty: primary.rule.specialty,
    suggestedSurgeries,
    reasoning: primary.rule.reasoning,
    confidence: normalizedConfidence,
    reasonSignals: inferredSignals,
  };
}

function insuranceRequested(messages: ChatMessage[]): boolean {
  if (messages.length === 0) {
    return false;
  }

  const latest = messages[messages.length - 1];
  const latestContent = latest.content.toLowerCase();

  if (/(insurance|coverage|cover|policy)/i.test(latestContent)) {
    return true;
  }

  const previousAssistant = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");

  if (
    previousAssistant &&
    /insurance/i.test(previousAssistant.content) &&
    /^(yes|yeah|yep|sure|ok|okay|please)/i.test(latestContent.trim())
  ) {
    return true;
  }

  return false;
}

function extractIntentFallback(message: string): ChatIntent {
  const text = message.toLowerCase();

  const knownSurgeries = [
    "knee replacement",
    "cataract surgery",
    "appendectomy",
    "cardiac bypass",
    "gallbladder removal",
    "hip replacement",
    "hernia repair",
    "cesarean section",
    "dental implant",
    "spine decompression",
  ];

  const surgeryType = knownSurgeries.find((surgery) => text.includes(surgery));

  let city: string | undefined;

  if (text.includes("delhi")) {
    city = "Delhi";
  } else if (text.includes("bangalore") || text.includes("bengaluru")) {
    city = "Bangalore";
  } else if (text.includes("mumbai")) {
    city = "Mumbai";
  }

  const lakhBudgetMatch = text.match(/(?:under|below|max|budget)?\s*(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?)\s*lakh/);
  const plainBudgetMatch = text.match(/(?:under|below|max|budget)\s*(?:rs\.?|inr|₹)?\s*(\d{5,7})/);

  let maxBudget: number | undefined;

  if (lakhBudgetMatch) {
    maxBudget = Math.round(Number(lakhBudgetMatch[1]) * 100000);
  } else if (plainBudgetMatch) {
    maxBudget = Number(plainBudgetMatch[1]);
  }

  const ratingMatch = text.match(/(?:rating\s*(?:above|over|at least|>=?)\s*|min(?:imum)?\s*rating\s*)(\d(?:\.\d)?)/);
  const minRating = ratingMatch ? Number(ratingMatch[1]) : undefined;

  return {
    surgeryType: surgeryType
      ? surgeryType
          .split(" ")
          .map((part) => part[0]?.toUpperCase() + part.slice(1))
          .join(" ")
      : undefined,
    city,
    maxBudget,
    minRating,
  };
}

function getInsuranceMatches(
  plans: InsurancePlan[],
  surgeryType: string | undefined,
  hospitals: SearchResult[],
): InsuranceMatch[] {
  if (!surgeryType || hospitals.length === 0) {
    return [];
  }

  const surgery = normalize(surgeryType);
  const hospitalIds = hospitals.map((hospital) => hospital.id);

  const matches = plans
    .map((plan) => {
      const coversSurgery = plan.coveredSurgeries.some(
        (covered) => normalize(covered) === surgery,
      );

      if (!coversSurgery) {
        return null;
      }

      const matchingHospitalIds = plan.networkHospitalIds.filter((id) => hospitalIds.includes(id));

      if (matchingHospitalIds.length === 0) {
        return null;
      }

      return {
        ...plan,
        matchingHospitalIds,
      } satisfies InsuranceMatch;
    })
    .filter((plan): plan is InsuranceMatch => plan !== null)
    .sort((a, b) => b.coverageCap - a.coverageCap)
    .slice(0, 3);

  return matches;
}

function buildHospitalReasons(intent: ChatIntent, hospitals: SearchResult[]): HospitalReason[] {
  return hospitals.map((hospital) => {
    const reasons: string[] = [];

    reasons.push(`Rated ${hospital.rating.toFixed(1)} with strong patient trust signals.`);

    if (intent.surgeryType && normalize(intent.surgeryType) === normalize(hospital.surgeryName)) {
      reasons.push(`Direct specialty match for ${hospital.surgeryName}.`);
    }

    if (intent.maxBudget) {
      if (hospital.minPrice <= intent.maxBudget) {
        reasons.push(`Starts within your budget (${formatCurrency(intent.maxBudget)}).`);
      } else {
        reasons.push(`Slightly above your budget, shown as a quality comparison option.`);
      }
    }

    if (intent.city && normalize(intent.city) === normalize(hospital.city)) {
      reasons.push(`Located in your preferred city (${hospital.city}).`);
    }

    return { hospitalId: hospital.id, reasons: reasons.slice(0, 3) };
  });
}

function buildInsuranceInsight(hospitals: SearchResult[], insuranceMatches: InsuranceMatch[]): string | undefined {
  if (hospitals.length === 0) {
    return undefined;
  }

  const avgCost = (hospital: SearchResult) => (hospital.minPrice + hospital.maxPrice) / 2;

  const cheapestOverall = hospitals.reduce((best, current) =>
    avgCost(current) < avgCost(best) ? current : best,
  );

  const inNetwork = hospitals
    .map((hospital) => {
      const plans = insuranceMatches.filter((plan) => plan.matchingHospitalIds.includes(hospital.id));
      if (plans.length === 0) {
        return null;
      }

      const bestPlan = plans.reduce((best, current) =>
        current.coverageCap > best.coverageCap ? current : best,
      );

      const expectedOutOfPocket = Math.max(0, avgCost(hospital) - bestPlan.coverageCap);

      return {
        hospital,
        bestPlan,
        expectedOutOfPocket,
      };
    })
    .filter((item): item is { hospital: SearchResult; bestPlan: InsuranceMatch; expectedOutOfPocket: number } => Boolean(item));

  if (inNetwork.length === 0) {
    return "Insurance insight: none of the shortlisted hospitals are in-network for the matched plans, so expected out-of-pocket remains close to full treatment cost.";
  }

  const bestInNetwork = inNetwork.reduce((best, current) =>
    current.expectedOutOfPocket < best.expectedOutOfPocket ? current : best,
  );

  const cheapestIsInNetwork = inNetwork.some((item) => item.hospital.id === cheapestOverall.id);

  if (!cheapestIsInNetwork && bestInNetwork.hospital.id !== cheapestOverall.id) {
    return `Insurance insight: ${cheapestOverall.name} looks cheaper upfront (${formatCurrency(avgCost(cheapestOverall))} avg), but it is out of network for matched plans. ${bestInNetwork.hospital.name} may result in lower out-of-pocket (estimated ${formatCurrency(bestInNetwork.expectedOutOfPocket)}) with ${bestInNetwork.bestPlan.planName}.`;
  }

  return `Insurance insight: ${bestInNetwork.hospital.name} appears strongest for coverage with ${bestInNetwork.bestPlan.planName}, with estimated out-of-pocket around ${formatCurrency(bestInNetwork.expectedOutOfPocket)}.`;
}

function fallbackReply(
  intent: ChatIntent,
  matches: SearchResult[],
  insuranceMatches: InsuranceMatch[],
  shouldCheckInsurance: boolean,
): string {
  if (matches.length === 0) {
    return "I could not find hospitals matching that request yet. Try a broader budget, a different city, or a lower minimum rating.";
  }

  const intro = intent.surgeryType
    ? `I found ${matches.length} strong ${intent.surgeryType} options for you.`
    : `I found ${matches.length} strong hospital options for you.`;

  if (shouldCheckInsurance) {
    if (insuranceMatches.length > 0) {
      return `${intro} I also matched insurance plans that cover this surgery in these hospitals.`;
    }

    return `${intro} I checked insurance too, but no matching plan was found for this surgery and shortlisted hospitals.`;
  }

  return `${intro} Do you want me to check insurance coverage for these options?`;
}

async function extractIntentWithLlm(apiKey: string, messages: ChatMessage[]): Promise<ChatIntent> {
  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You are an intent extraction assistant. Always call the tool with the most relevant structured values inferred from the conversation.",
      },
      ...messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    ],
    tools: [extractIntentTool],
    tool_choice: {
      type: "function",
      function: {
        name: "extract_search_intent",
      },
    },
  });

  const toolCall = completion.choices[0]?.message?.tool_calls?.[0];

  if (!toolCall || toolCall.type !== "function") {
    return {};
  }

  try {
    const parsed = JSON.parse(toolCall.function.arguments);
    return coerceIntent(parsed);
  } catch {
    return {};
  }
}

async function classifyIntentWithLlm(apiKey: string, messages: ChatMessage[]): Promise<ChatClassification> {
  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You are a safety-first healthcare chat classifier. System-level safety rule: if the user describes chest pain, breathing difficulty, severe bleeding, stroke-like symptoms, loss of consciousness, seizures, or another possible emergency, classify it as emergency. Do not classify emergencies as symptoms. Classify direct only when a procedure is explicitly named. Classify symptom when non-emergency symptoms are described without a named procedure.",
      },
      ...messages.map((message) => ({ role: message.role, content: message.content })),
    ],
    tools: [classifyIntentTool],
    tool_choice: { type: "function", function: { name: "classify_chat_intent" } },
  });

  const toolCall = completion.choices[0]?.message?.tool_calls?.[0];

  if (!toolCall || toolCall.type !== "function") {
    return { kind: "general" };
  }

  try {
    return coerceClassification(JSON.parse(toolCall.function.arguments));
  } catch {
    return { kind: "general" };
  }
}

async function reasonAboutSymptomsWithLlm(
  apiKey: string,
  message: string,
  surgeryNames: string[],
): Promise<SymptomMatch | null> {
  const symptomReasoningTool = {
    type: "function" as const,
    function: {
      name: "suggest_symptom_match",
      description: "Suggest up to two possible procedure matches for non-emergency symptoms. This is not a diagnosis.",
      parameters: {
        type: "object",
        properties: {
          specialty: { type: "string", description: "Likely medical specialty or category, such as orthopedic or ENT." },
          suggestedSurgeries: {
            type: "array",
            items: { type: "string", enum: surgeryNames },
            minItems: 1,
            maxItems: 2,
            description: "Only choose from the provided surgery names.",
          },
          reasoning: {
            type: "string",
            description: "A concise, plain-language explanation of why these procedures may be worth discussing with a licensed doctor. Do not diagnose or claim certainty.",
          },
          confidence: {
            type: "number",
            description: "Estimated confidence from 0 to 1 based on symptom clarity and surgery mapping confidence.",
          },
          reasonSignals: {
            type: "array",
            items: { type: "string" },
            maxItems: 4,
            description: "Key observed symptom signals behind the suggestion.",
          },
        },
        required: ["specialty", "suggestedSurgeries", "reasoning"],
        additionalProperties: false,
      },
    },
  };

  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You provide non-diagnostic symptom navigation for a healthcare marketplace. System-level safety rule: never map emergencies to procedures. If symptoms suggest an emergency, do not provide a procedure suggestion. Do not invent procedures; use only the provided tool enum. Use cautious language such as may or could and keep the explanation brief.",
      },
      { role: "user", content: message },
    ],
    tools: [symptomReasoningTool],
    tool_choice: { type: "function", function: { name: "suggest_symptom_match" } },
  });

  const toolCall = completion.choices[0]?.message?.tool_calls?.[0];

  if (!toolCall || toolCall.type !== "function") {
    return null;
  }

  try {
    return coerceSymptomMatch(JSON.parse(toolCall.function.arguments), surgeryNames);
  } catch {
    return null;
  }
}

async function generateConversationalReply(
  apiKey: string,
  userMessage: string,
  intent: ChatIntent,
  matches: SearchResult[],
  insuranceMatches: InsuranceMatch[],
  shouldCheckInsurance: boolean,
): Promise<string> {
  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.35,
    messages: [
      {
        role: "system",
        content:
          "You are SurgiFind Assistant. Be warm and concise. Mention that cards below show the best matches. If insurance has not been checked, ask the user if they want insurance coverage checks. If insurance has been checked, briefly summarize matched plans.",
      },
      {
        role: "user",
        content: JSON.stringify({
          userMessage,
          extractedIntent: intent,
          topMatches: matches.map((item) => ({
            hospital: item.name,
            city: item.city,
            rating: item.rating,
            surgery: item.surgeryName,
            minPrice: item.minPrice,
            maxPrice: item.maxPrice,
          })),
          insuranceChecked: shouldCheckInsurance,
          insuranceMatches: insuranceMatches.map((plan) => ({
            insurerName: plan.insurerName,
            planName: plan.planName,
            coverageCap: plan.coverageCap,
            premiumPerYear: plan.premiumPerYear,
          })),
        }),
      },
    ],
  });

  return completion.choices[0]?.message?.content?.trim() || "Here are your top matches from SurgiFind.";
}

function buildSymptomSuggestionPayload(match: SymptomMatch): SymptomSuggestionPayload {
  const [firstSuggestion] = match.suggestedSurgeries;
  const reasonSignals = (match.reasonSignals ?? []).slice(0, 4);
  const fallbackConfidence = clampConfidence(0.58 + Math.min(0.25, reasonSignals.length * 0.07));

  return {
    specialty: match.specialty,
    suggestedSurgeries: match.suggestedSurgeries,
    reasoning: match.reasoning,
    disclaimer: SYMPTOM_DISCLAIMER,
    confidence: match.confidence ? clampConfidence(match.confidence) : fallbackConfidence,
    reasonSignals,
    requiresConfirmation: true,
    confirmPrompt: firstSuggestion
      ? `Would you like me to show hospitals for ${firstSuggestion}?`
      : "Would you like me to show hospitals for one of these options?",
  };
}

async function runSearchFlow(params: {
  apiKey?: string;
  messages: ChatMessage[];
  latestUserContent: string;
  forcedSurgeryType?: string;
}) {
  const { apiKey, messages, latestUserContent, forcedSurgeryType } = params;

  let intent: ChatIntent = {};

  if (apiKey) {
    try {
      intent = await extractIntentWithLlm(apiKey, messages);
    } catch {
      intent = {};
    }
  }

  if (!intent.surgeryType && !intent.city && !intent.maxBudget && !intent.minRating) {
    const combinedUserContext = messages
      .filter((message) => message.role === "user")
      .map((message) => message.content)
      .join(" ");

    intent = extractIntentFallback(combinedUserContext);
  }

  if (forcedSurgeryType) {
    intent.surgeryType = forcedSurgeryType;
  }

  const hasSearchIntent = Boolean(
    intent.surgeryType || intent.city || intent.maxBudget || intent.minRating,
  );

  if (!hasSearchIntent) {
    return {
      reply:
        "Hello! I can help you find and compare hospitals for surgery. Tell me the surgery you need, your city, and any budget or rating preference.",
      intent,
      matches: [] as SearchResult[],
      hospitalReasons: [] as HospitalReason[],
      insuranceChecked: false,
      insurancePlans: [] as InsuranceMatch[],
      insuranceInsight: undefined as string | undefined,
    };
  }

  const results = await searchHospitals({
    surgery: intent.surgeryType,
    city: intent.city,
    maxPrice: intent.maxBudget,
    minRating: intent.minRating,
  });

  const topMatches = results.slice(0, 3);
  const shouldCheckInsurance = insuranceRequested(messages);

  let insuranceMatches: InsuranceMatch[] = [];
  let insuranceInsight: string | undefined;

  if (shouldCheckInsurance) {
    const plans = await getInsurancePlans();
    insuranceMatches = getInsuranceMatches(plans, intent.surgeryType, topMatches);
    insuranceInsight = buildInsuranceInsight(topMatches, insuranceMatches);
  }

  const hospitalReasons = buildHospitalReasons(intent, topMatches);

  let reply = fallbackReply(intent, topMatches, insuranceMatches, shouldCheckInsurance);

  if (apiKey) {
    try {
      reply = await generateConversationalReply(
        apiKey,
        latestUserContent,
        intent,
        topMatches,
        insuranceMatches,
        shouldCheckInsurance,
      );

      if (shouldCheckInsurance && insuranceInsight) {
        reply = `${reply}\n\n${insuranceInsight}`;
      }
    } catch {
      reply = fallbackReply(intent, topMatches, insuranceMatches, shouldCheckInsurance);

      if (shouldCheckInsurance && insuranceInsight) {
        reply = `${reply}\n\n${insuranceInsight}`;
      }
    }
  }

  return {
    reply,
    intent,
    matches: topMatches,
    hospitalReasons,
    insuranceChecked: shouldCheckInsurance,
    insurancePlans: insuranceMatches,
    insuranceInsight,
  };
}

export async function POST(request: NextRequest) {
  const contentLengthHeader = request.headers.get("content-length");
  const contentLength = contentLengthHeader ? Number(contentLengthHeader) : 0;

  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: `Payload too large. Keep request body below ${MAX_BODY_BYTES} bytes.` },
      { status: 413 },
    );
  }

  const clientKey = getClientKey(request);
  const rate = checkRateLimit(clientKey);

  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait and try again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rate.retryAfterSeconds),
        },
      },
    );
  }

  let body: ChatRequestBody;

  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const messages = body.messages ?? [];
  const symptomAction = body.symptomAction;

  const validationError = validateMessages(messages);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  if (messages.length === 0 && !symptomAction?.action) {
    return NextResponse.json({ error: "At least one message is required." }, { status: 400 });
  }

  const latestUser = [...messages].reverse().find((message) => message.role === "user");

  if (!latestUser && !symptomAction?.action) {
    return NextResponse.json({ error: "A user message is required." }, { status: 400 });
  }

  const rawApiKey = process.env.OPENAI_API_KEY;
  const apiKey =
    rawApiKey && !rawApiKey.includes("your_openai_api_key_here") && rawApiKey.trim().length > 20
      ? rawApiKey
      : undefined;

  if (symptomAction?.action === "decline") {
    return NextResponse.json({
      reply:
        "No problem. Please rephrase your symptoms, or tell me a surgery name, city, budget, and rating preference to continue with a direct search.",
      intent: {},
      matches: [],
      hospitalReasons: [],
      insuranceChecked: false,
      insurancePlans: [],
      insuranceInsight: undefined,
    });
  }

  if (symptomAction?.action === "confirm") {
    const surgeryType = symptomAction.surgeryType?.trim();

    if (!surgeryType) {
      return NextResponse.json({ error: "A surgery type is required to confirm symptom search." }, { status: 400 });
    }

    const filters = await getSearchFilters();
    const canonicalSurgery = filters.surgeries.find(
      (surgery) => normalize(surgery) === normalize(surgeryType),
    );

    if (!canonicalSurgery) {
      return NextResponse.json(
        { error: "The selected surgery type is not available in the current SurgiFind catalog." },
        { status: 400 },
      );
    }

    const searchResponse = await runSearchFlow({
      apiKey,
      messages,
      latestUserContent: latestUser?.content ?? `Show hospitals for ${canonicalSurgery}`,
      forcedSurgeryType: canonicalSurgery,
    });

    return NextResponse.json(searchResponse);
  }

  if (!latestUser) {
    return NextResponse.json({ error: "A user message is required." }, { status: 400 });
  }

  let classification: ChatClassification;

  if (apiKey) {
    try {
      classification = await classifyIntentWithLlm(apiKey, messages);
    } catch {
      classification = fallbackClassification(latestUser.content);
    }
  } else {
    classification = fallbackClassification(latestUser.content);
  }

  if (classification.kind === "general") {
    const fallback = fallbackClassification(latestUser.content);
    if (fallback.kind === "symptom") {
      classification = fallback;
    }
  }

  if (classification.kind === "emergency" || hasEmergencySignals(latestUser.content)) {
    return NextResponse.json({
      reply: EMERGENCY_REPLY,
      intent: {},
      matches: [],
      hospitalReasons: [],
      insuranceChecked: false,
      insurancePlans: [],
      insuranceInsight: undefined,
      isEmergency: true,
    });
  }

  if (classification.kind === "symptom") {
    const filters = await getSearchFilters();
    const surgeryNames = filters.surgeries;

    let symptomMatch: SymptomMatch | null = null;

    if (apiKey) {
      try {
        symptomMatch = await reasonAboutSymptomsWithLlm(apiKey, latestUser.content, surgeryNames);
      } catch {
        symptomMatch = null;
      }
    }

    if (!symptomMatch) {
      symptomMatch = fallbackSymptomMatch(latestUser.content, surgeryNames);
    }

    if (!symptomMatch) {
      const noMatchSuggestion = buildNoMatchSymptomSuggestion(latestUser.content);

      return NextResponse.json({
        reply:
          "I added a cautious symptom summary below. Please review it and use Search filters or tell me a likely procedure to continue.",
        intent: {},
        matches: [],
        hospitalReasons: [],
        insuranceChecked: false,
        insurancePlans: [],
        insuranceInsight: undefined,
        symptomSuggestion: noMatchSuggestion,
      });
    }

    const suggestionPayload = buildSymptomSuggestionPayload(symptomMatch);

    return NextResponse.json({
      reply:
        "I found a possible non-diagnostic match. Please review the suggestion card below and confirm if you want hospital options.",
      intent: {},
      matches: [],
      hospitalReasons: [],
      insuranceChecked: false,
      insurancePlans: [],
      insuranceInsight: undefined,
      symptomSuggestion: suggestionPayload,
    });
  }

  const searchResponse = await runSearchFlow({
    apiKey,
    messages,
    latestUserContent: latestUser.content,
  });

  return NextResponse.json(searchResponse);
}
