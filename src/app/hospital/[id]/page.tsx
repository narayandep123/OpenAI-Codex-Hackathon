import Link from "next/link";
import { notFound } from "next/navigation";
import { findHospitalById } from "@/lib/search";
import BookingPanel from "./booking-panel";
import HospitalImage from "@/components/hospital/hospital-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const createStars = (rating: number) => {
  const fullStars = Math.round(rating);
  return "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
};

interface DetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function HospitalDetailsPage({ params }: DetailsPageProps) {
  const { id } = await params;
  const hospital = await findHospitalById(id);

  if (!hospital) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-8">
      <Link href="/search" className="w-fit">
        <Button variant="outline" size="sm">Back to search</Button>
      </Link>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <HospitalImage
          imageUrl={hospital.image}
          seed={hospital.id}
          alt={hospital.name}
          className="h-72 w-full object-cover"
        />
        <div className="space-y-3 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">{hospital.name}</h1>
              <p className="mt-2 text-slate-600">{hospital.address}</p>
              <p className="mt-1 text-sm text-slate-500">{hospital.city}</p>
            </div>
            <Badge variant="secondary">
              {hospital.type}
            </Badge>
          </div>

          <p className="text-base font-semibold text-amber-700">
            {createStars(hospital.rating)} <span className="text-slate-700">{hospital.rating.toFixed(1)} / 5</span>
          </p>

          <BookingPanel hospital={hospital} />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-slate-900">All Surgeries Offered</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {hospital.surgeries.map((surgery) => (
            <article key={surgery.name} className="rounded-xl bg-slate-100 p-4">
              <p className="font-semibold text-slate-900">{surgery.name}</p>
              <p className="mt-1 text-sm text-slate-700">
                {formatCurrency(surgery.minPrice)} - {formatCurrency(surgery.maxPrice)}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-slate-900">Available Slots (from current schedule)</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {hospital.availableSlots.slice(0, 4).map((slot) => (
            <article key={`${slot.date}-${slot.time}`} className="rounded-xl border border-cyan-200 bg-cyan-50 p-3">
              <p className="text-sm font-semibold text-cyan-900">{slot.date}</p>
              <p className="text-sm text-cyan-800">{slot.time}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
