import Link from "next/link";
import { getSearchFilters } from "@/lib/search";
import { Button } from "@/components/ui/button";
import SurgeryCombobox from "@/components/ui/surgery-combobox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  ChevronRight,
  ListFilter,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Stethoscope,
  Users,
} from "lucide-react";

export default async function Home() {
  const filters = await getSearchFilters();
  const trustStats = [
    { icon: Building2, label: "500+ Hospitals Listed" },
    { icon: Users, label: "50,000+ Patients Helped" },
    { icon: ShieldCheck, label: "NABH & JCI Verified Partners" },
    { icon: MapPin, label: "3 Cities & Growing" },
  ];

  const howItWorks = [
    {
      number: "01",
      icon: Search,
      title: "Search",
      description: "Tell us the surgery you need and your city.",
    },
    {
      number: "02",
      icon: ListFilter,
      title: "Compare",
      description: "See ranked hospitals by price, rating, and type.",
    },
    {
      number: "03",
      icon: CalendarCheck,
      title: "Book",
      description: "Reserve a consultation or surgery slot instantly.",
    },
  ];

  const impactMetrics = [
    { value: "500+", label: "Hospitals Listed" },
    { value: "10 min", label: "Avg. Time to Find a Match" },
    { value: "3", label: "Cities Covered" },
    { value: "5", label: "Insurance Partners" },
  ];

  const testimonials = [
    {
      quote:
        "I found a knee replacement hospital in Delhi within my budget in minutes. The booking flow was clear and quick.",
      name: "Ritu S., Bangalore",
    },
    {
      quote:
        "The comparison cards made it easy to understand which hospitals fit my price and rating requirements without calling around.",
      name: "Amit K., Mumbai",
    },
    {
      quote:
        "I described my surgery need in plain language and got useful recommendations instantly. That saved me a lot of time.",
      name: "Neha P., Delhi",
    },
  ];

  const faqItems = [
    {
      question: "Is SurgiFind free to use?",
      answer:
        "Yes. Patients can search, compare hospitals, and explore insurance options without any platform fee.",
    },
    {
      question: "How are hospitals verified?",
      answer:
        "We use publicly available hospital details and partner data, and highlight verified facilities and network coverage where available.",
    },
    {
      question: "Can I cancel or reschedule a booking?",
      answer:
        "Yes. Bookings in this demo are mock confirmations, and the interface is designed to support quick changes or rebooking.",
    },
    {
      question: "Is my insurance information kept private?",
      answer:
        "We only use the details you provide to match plans on the platform and do not process real insurance claims in this demo.",
    },
    {
      question: "Which cities does SurgiFind currently cover?",
      answer:
        "The current experience covers Delhi, Bangalore, and Mumbai, with more cities planned as the network expands.",
    },
  ];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-6 sm:gap-10 sm:px-8 sm:py-8">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="grid lg:grid-cols-2">
          <div className="flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-10 lg:py-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-teal-700">SurgiFind Healthcare</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl lg:text-[3.35rem]">
              Your trusted center for surgery care.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-700 sm:text-lg">
              Find high-quality hospitals by surgery type, compare treatment pricing, check insurance coverage,
              and book slots from one clean platform.
            </p>

            <form action="/search" method="get" className="mt-7 grid max-w-xl gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-[0_18px_38px_-24px_rgba(15,23,42,0.55)] sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
                <span className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-[#05aba5]" /> Surgery
                </span>
                <SurgeryCombobox surgeries={filters.surgeries} name="surgery" />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#05aba5]" /> City
                </span>
                <div className="relative">
                  <select
                    name="city"
                    defaultValue=""
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm"
                  >
                    <option value="">Any city</option>
                    {filters.cities.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </label>

              <div className="flex items-end">
                <Button type="submit" className="w-full bg-[#05aba5] text-white hover:bg-[#04938e]">
                  Search Hospitals
                </Button>
              </div>
            </form>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/#chat-open"><Button variant="secondary" className="bg-[#05aba5] hover:bg-[#04938e]">Try Conversational Assistant</Button></Link>
              <Link href="/insurance"><Button variant="outline">Explore Insurance Plans</Button></Link>
              <Link href="/search" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 underline-offset-4 hover:underline">
                <SlidersHorizontal className="h-4 w-4" />
                Open Advanced Filters
              </Link>
            </div>
          </div>

          <div className="relative min-h-[320px] bg-teal-50 lg:min-h-[520px]">
            <img
              src="https://images.pexels.com/photos/6129688/pexels-photo-6129688.jpeg?auto=compress&cs=tinysrgb&w=1600"
              alt="Healthcare professionals in a hospital"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-white/95 via-white/35 to-[#05aba5]/10" />
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent" />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/90 px-5 py-4 shadow-sm sm:px-6 sm:py-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trustStats.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.label} className="flex items-center gap-3 text-slate-700">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-[#05aba5]">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium">{item.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/95 px-6 py-9 shadow-lg sm:px-8 sm:py-11">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal-700">How SurgiFind Works</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">A simple path from search to booking</h2>
          <p className="mt-4 text-base text-slate-700 sm:text-lg">
            SurgiFind turns a complicated surgery search into a guided, transparent experience.
          </p>
        </div>

        <div className="relative mt-8 grid gap-4 md:grid-cols-3 md:gap-5">
          <div className="pointer-events-none absolute left-[16.7%] right-[16.7%] top-1/2 hidden h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-teal-300 to-transparent md:block" />
          <span className="pointer-events-none absolute left-1/3 top-1/2 z-20 hidden h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-teal-100 bg-white text-teal-600 shadow-sm md:inline-flex" aria-hidden="true">
            <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <span className="pointer-events-none absolute left-2/3 top-1/2 z-20 hidden h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-teal-100 bg-white text-teal-600 shadow-sm md:inline-flex" aria-hidden="true">
            <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
          </span>
          {howItWorks.map((step) => {
            const Icon = step.icon;

            return (
              <Card key={step.number} className="relative z-10 h-full rounded-2xl border-slate-200 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader className="flex h-full flex-col space-y-4">
                  <div className="flex items-start justify-between">
                    <p className="text-4xl font-semibold text-slate-200">{step.number}</p>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-[#05aba5]">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <CardTitle>{step.title}</CardTitle>
                  <p className="mt-auto text-sm leading-relaxed text-slate-600">{step.description}</p>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/95 px-6 py-9 shadow-lg sm:px-8 sm:py-11">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-semibold text-[#067b77] sm:text-5xl">Impact</h2>
          <p className="mt-4 text-base text-slate-700 sm:text-lg">
            SurgiFind is helping patients discover trusted surgery care faster with transparent pricing,
            smarter matching, and better insurance access.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">
          {impactMetrics.map((metric) => (
            <Card key={metric.label} className="h-full rounded-2xl bg-[#05aba5] text-white shadow-sm">
              <CardContent className="flex h-full flex-col justify-between p-6">
                <p className="text-4xl font-semibold leading-none sm:text-5xl">{metric.value}</p>
                <p className="mt-4 text-base font-medium leading-snug sm:text-lg">{metric.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/95 px-6 py-9 shadow-lg sm:px-8 sm:py-11">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal-700">What Patients Say</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">Real users, clearer decisions</h2>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3 md:gap-5">
          {testimonials.map((item) => (
            <Card key={item.name} className="h-full rounded-2xl border-slate-200 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="flex h-full flex-col space-y-4 p-6">
                <div className="flex gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-slate-700">“{item.quote}”</p>
                <p className="mt-auto font-semibold text-slate-900">{item.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/95 px-6 py-9 shadow-lg sm:px-8 sm:py-11">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal-700">FAQ</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">Common questions</h2>
        </div>

        <div className="mx-auto mt-8 max-w-4xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <Accordion type="single" collapsible>
            {faqItems.map((item, index) => (
              <AccordionItem key={item.question} value={`item-${index}`} className="rounded-lg px-2 transition hover:bg-slate-50">
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/95 px-6 py-8 shadow-lg sm:px-8 sm:py-10">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal-700">Featured Actions</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm font-semibold text-slate-700">
            <Link href="/search" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md">
              <Search className="h-4 w-4 text-teal-600" /> Search surgery <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/chat" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md">
              <MessageCircle className="h-4 w-4 text-teal-600" /> Chat assistant <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/insurance" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md">
              <ShieldCheck className="h-4 w-4 text-teal-600" /> Check insurance <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
