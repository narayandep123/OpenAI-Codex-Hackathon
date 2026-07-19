"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { InsurancePlan, SearchResult } from "@/lib/types";

interface SymptomSuggestion {
  specialty: string;
  suggestedSurgeries: string[];
  reasoning: string;
  disclaimer: string;
  confirmPrompt: string;
  confidence?: number;
  reasonSignals?: string[];
  requiresConfirmation?: boolean;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  matches?: SearchResult[];
  insurancePlans?: Array<InsurancePlan & { matchingHospitalIds?: string[] }>;
  symptomSuggestion?: SymptomSuggestion;
  isEmergency?: boolean;
}

interface ChatApiResponse {
  error?: string;
  reply: string;
  matches: SearchResult[];
  insurancePlans: Array<InsurancePlan & { matchingHospitalIds?: string[] }>;
  symptomSuggestion?: SymptomSuggestion;
  isEmergency?: boolean;
}

interface ChatConversationProps {
  compact?: boolean;
  storageKey?: string;
}

const starterMessage: ChatMessage = {
  id: "starter",
  role: "assistant",
  content:
    "Tell me what you need in plain language. Example: I need a knee replacement under 2 lakh in Delhi with rating above 4.",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

const createStars = (rating: number) => {
  const fullStars = Math.round(rating);
  return "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
};

export default function ChatConversation({ compact = false, storageKey }: ChatConversationProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([starterMessage]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRestored, setIsRestored] = useState(!storageKey);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages update or typing indicator shows
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!storageKey) {
      return;
    }

    const restoreFrame = window.requestAnimationFrame(() => {
      try {
        const storedMessages = window.sessionStorage.getItem(storageKey);

        if (storedMessages) {
          const parsed = JSON.parse(storedMessages) as ChatMessage[];

          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        }
      } catch {
        // A bad or unavailable storage entry should not block the chat experience.
      } finally {
        setIsRestored(true);
      }

    });

    return () => window.cancelAnimationFrame(restoreFrame);
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey || !isRestored) {
      return;
    }

    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      // Session storage is an enhancement; chat remains available without it.
    }
  }, [isRestored, messages, storageKey]);

  const canSend = useMemo(() => input.trim().length > 0 && !isTyping, [input, isTyping]);

  const appendAssistantMessage = (payload: ChatApiResponse) => {
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: payload.reply,
        matches: payload.matches,
        insurancePlans: payload.insurancePlans,
        symptomSuggestion: payload.symptomSuggestion,
        isEmergency: payload.isEmergency,
      },
    ]);
  };

  const sendSymptomAction = async (action: "confirm" | "decline", surgeryType?: string) => {
    if (isTyping) {
      return;
    }

    const userActionText = action === "confirm"
      ? `Yes, show hospitals${surgeryType ? ` for ${surgeryType}` : ""}.`
      : "No, let me search differently.";

    const userActionMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: userActionText,
    };

    const nextMessages = [...messages, userActionMessage];
    setMessages(nextMessages);
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({ role: message.role, content: message.content })),
          symptomAction: {
            action,
            surgeryType,
          },
        }),
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorPayload?.error || "Symptom action request failed");
      }

      const payload = (await response.json()) as ChatApiResponse;
      appendAssistantMessage(payload);
    } catch (error) {
      const fallbackMessage = error instanceof Error ? error.message : "I could not process that action right now. Please try again.";
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: fallbackMessage,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = input.trim();

    if (!content || isTyping) {
      return;
    }

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({ role: message.role, content: message.content })),
        }),
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorPayload?.error || "Chat request failed");
      }

      const payload = (await response.json()) as ChatApiResponse;
      appendAssistantMessage(payload);
    } catch (error) {
      const fallbackMessage = error instanceof Error ? error.message : "I could not reach SurgiFind right now. Please try again in a moment.";
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: fallbackMessage,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={`flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto ${compact ? "p-4" : "p-4 sm:p-6"}`}>
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-3xl rounded-2xl px-4 py-3 text-sm ${message.role === "user" ? "bg-slate-900 text-white" : "border border-slate-200 bg-slate-50 text-slate-800"}`}>
              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>

              {message.role === "assistant" && message.symptomSuggestion ? (
                <Card className="mt-4 overflow-hidden border-cyan-200 bg-cyan-50/70">
                  <CardContent className="space-y-4 p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-cyan-100 p-2 text-cyan-700">
                        <Stethoscope className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-cyan-700">Possible Match</p>
                        <p className="text-sm font-semibold text-slate-900">Specialty: {message.symptomSuggestion.specialty}</p>
                        <p className="mt-2 text-sm text-slate-700">{message.symptomSuggestion.reasoning}</p>
                        {typeof message.symptomSuggestion.confidence === "number" ? (
                          <p className="mt-2 text-xs font-semibold text-cyan-800">
                            Confidence: {Math.round(message.symptomSuggestion.confidence * 100)}%
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {message.symptomSuggestion.reasonSignals?.length ? (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Why this match</p>
                        <div className="flex flex-wrap gap-2">
                          {message.symptomSuggestion.reasonSignals.map((signal, index) => (
                            <Badge key={`${message.id}-signal-${index}`} variant="outline" className="border-slate-300 bg-white text-slate-700">
                              {signal}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      {message.symptomSuggestion.suggestedSurgeries.map((surgery) => (
                        <Badge key={`${message.id}-${surgery}`} variant="outline" className="border-cyan-300 bg-white text-cyan-800">
                          {surgery}
                        </Badge>
                      ))}
                    </div>

                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                      <p className="flex items-start gap-2 font-medium">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        {message.symptomSuggestion.disclaimer}
                      </p>
                    </div>

                    {!message.isEmergency && message.symptomSuggestion.requiresConfirmation !== false && message.symptomSuggestion.suggestedSurgeries.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-800">{message.symptomSuggestion.confirmPrompt}</p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            disabled={isTyping || message.symptomSuggestion.suggestedSurgeries.length === 0}
                            onClick={() => sendSymptomAction("confirm", message.symptomSuggestion?.suggestedSurgeries[0])}
                            className="bg-[#05aba5] text-white hover:bg-[#04938e]"
                          >
                            Yes, show hospitals
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isTyping}
                            onClick={() => sendSymptomAction("decline")}
                          >
                            No, let me search differently
                          </Button>
                        </div>
                      </div>
                    ) : null}

                    {!message.isEmergency && (message.symptomSuggestion.requiresConfirmation === false || message.symptomSuggestion.suggestedSurgeries.length === 0) ? (
                      <div className="rounded-xl border border-slate-200 bg-white/80 p-3 text-sm text-slate-700">
                        {message.symptomSuggestion.confirmPrompt}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ) : null}

              {message.role === "assistant" && message.matches?.length ? (
                <div className={`mt-4 grid gap-3 ${compact ? "" : "md:grid-cols-2"}`}>
                  {message.matches.map((hospital) => (
                    <Card key={`${message.id}-${hospital.id}`}>
                      <CardContent className="space-y-1 py-3">
                        <p className="font-semibold text-slate-900">{hospital.name}</p>
                        <p className="text-xs text-slate-600">{hospital.city} • <Badge variant="outline">{hospital.type}</Badge></p>
                        <p className="mt-1 text-xs text-amber-700">{createStars(hospital.rating)} {hospital.rating.toFixed(1)}</p>
                        <p className="mt-1 text-xs text-slate-700">{hospital.surgeryName}: {formatCurrency(hospital.minPrice)} - {formatCurrency(hospital.maxPrice)}</p>
                        <Link href={`/hospital/${hospital.id}`} className="mt-2 block">
                          <Button variant="secondary" size="sm">View</Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : null}

              {message.role === "assistant" && message.insurancePlans?.length ? (
                <div className="mt-4 space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
                  <p className="font-semibold">Matching Insurance Plans</p>
                  {message.insurancePlans.map((plan) => (
                    <article key={`${message.id}-${plan.id}`} className="rounded-lg bg-white/70 p-2">
                      <p>{plan.insurerName} - {plan.planName}</p>
                      <p>Coverage: {formatCurrency(plan.coverageCap)} | Premium/year: {formatCurrency(plan.premiumPerYear)}</p>
                    </article>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}

        {isTyping ? (
          <Card className="w-full rounded-2xl">
            <CardContent className="space-y-3 py-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </CardContent>
          </Card>
        ) : null}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="border-t border-slate-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Describe your need, budget, city, and rating..."
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none ring-cyan-300 transition focus:ring"
          />
          <button type="submit" disabled={!canSend} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-55">
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
