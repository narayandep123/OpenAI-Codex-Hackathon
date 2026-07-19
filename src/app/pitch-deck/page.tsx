const slides = [
  {
    title: "SurgiFind",
    body: [
      "Find the right hospital for surgery with clarity on price, insurance, and booking.",
      "SurgiFind helps patients discover surgical care faster by combining hospital search, price comparison, insurance matching, and guided booking in one platform.",
    ],
  },
  {
    title: "Problem",
    bullets: [
      "Hospital discovery is fragmented across search engines, aggregators, and hospital websites.",
      "Price transparency is poor, so families cannot compare likely costs with confidence.",
      "Insurance network and coverage checks are confusing and time-consuming.",
      "Booking a consultation or surgery often requires multiple manual calls and follow-ups.",
    ],
  },
  {
    title: "Solution",
    bullets: [
      "Hospital and surgery search",
      "Cost range comparison",
      "Insurance plan matching",
      "Conversational guidance",
      "Authenticated booking and booking history",
    ],
  },
  {
    title: "Product Flow",
    ordered: [
      "Search by surgery, city, budget, rating, or hospital type.",
      "Compare hospitals with price ranges and availability.",
      "Use the chat assistant in natural language.",
      "Review matching insurance plans.",
      "Book a consultation or surgery slot securely.",
      "Track or cancel the booking from booking history.",
    ],
  },
  {
    title: "Key Features",
    bullets: [
      "Smart surgery search with filters",
      "Conversational assistant with direct search and symptom-assisted guidance",
      "Insurance matching against covered surgeries and network hospitals",
      "Secure authentication with booking history",
      "Slot reservation flow with cancellation support",
    ],
  },
  {
    title: "Next Steps",
    bullets: [
      "Payment system for deposits, booking confirmation, refunds, and receipts",
      "Production cloud deployment with CI/CD, secrets handling, and monitoring",
      "Transactional booking workflow at the database layer",
      "Rate limiting, WAF, audit trails, and production security hardening",
      "Doctor-level scheduling and more hospital integrations",
    ],
  },
];

const architecturePillars = [
  "CDN and edge delivery",
  "Global load balancer",
  "API management and rate limiting",
  "Autoscaled app runtime",
  "Redis cache",
  "Queue and workers",
  "Observability and alerting",
  "Secrets management",
  "Payment gateway integration",
  "Audit logging and security controls",
];

export default function PitchDeckPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.14),_transparent_40%),linear-gradient(180deg,_#f8fafc_0%,_#ecfeff_100%)] text-slate-900">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-8 sm:py-14">
        <div className="rounded-[2rem] border border-cyan-100 bg-white/85 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Shareable Deck</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl">
            SurgiFind pitch deck and long-run platform vision.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
            A judge-ready story covering the current product, the next milestones like payments and cloud deployment,
            and the future-state architecture for scale, security, and operations.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/SurgiFind-Pitch-Deck.docx"
              className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Download DOCX
            </a>
            <a
              href="/long-run-architecture.svg"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-teal-200 bg-teal-50 px-5 py-2.5 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
            >
              Open architecture diagram
            </a>
          </div>
        </div>

        <section className="grid gap-5 lg:grid-cols-2">
          {slides.map((slide, index) => (
            <article key={slide.title} className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Slide {index + 1}</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">{slide.title}</h2>
              {slide.body?.map((paragraph) => (
                <p key={paragraph} className="mt-4 text-sm leading-7 text-slate-700 sm:text-base">
                  {paragraph}
                </p>
              ))}
              {slide.bullets ? (
                <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700 sm:text-base">
                  {slide.bullets.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-2.5 w-2.5 rounded-full bg-teal-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {slide.ordered ? (
                <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-700 sm:text-base">
                  {slide.ordered.map((item, itemIndex) => (
                    <li key={item} className="flex gap-3">
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                        {itemIndex + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              ) : null}
            </article>
          ))}
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Future-State Architecture</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-900">What the production platform grows into</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                The current app remains the core product. Long-term scale comes from adding edge controls, autoscaling,
                API governance, caching, background workers, stronger security, and payment infrastructure around it.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:max-w-xl">
              {architecturePillars.map((item) => (
                <div key={item} className="rounded-2xl border border-cyan-100 bg-cyan-50/70 px-4 py-3 text-sm font-medium text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
            <img
              src="/long-run-architecture.svg"
              alt="SurgiFind future-state production architecture diagram"
              className="w-full"
            />
          </div>
        </section>
      </section>
    </main>
  );
}
