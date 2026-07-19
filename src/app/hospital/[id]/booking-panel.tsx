"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/supabase/useAuth";
import type { Hospital } from "@/lib/types";

type BookingType = "consultation" | "surgery";

interface BookingConfirmation {
  bookingId: string;
  hospitalId: string;
  hospitalName: string;
  surgeryName: string;
  bookingType: BookingType;
  patientName: string;
  patientAge: number;
  patientLocation: string;
  slot: {
    date: string;
    time: string;
  };
  estimatedCost: number;
  status: "confirmed";
  createdAt: string;
}

interface BookingPanelProps {
  hospital: Hospital;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function BookingPanel({ hospital }: BookingPanelProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [bookingType, setBookingType] = useState<BookingType>("consultation");
  const [selectedSurgery, setSelectedSurgery] = useState(hospital.surgeries[0]?.name ?? "");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientLocation, setPatientLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  const visibleSlots = useMemo(() => hospital.availableSlots.slice(0, 4), [hospital.availableSlots]);

  const estimatedSurgeryCost = useMemo(() => {
    const surgery = hospital.surgeries.find((item) => item.name === selectedSurgery);

    if (!surgery) {
      return 0;
    }

    return Math.round((surgery.minPrice + surgery.maxPrice) / 2);
  }, [hospital.surgeries, selectedSurgery]);

  const resetModal = () => {
    setSelectedSurgery(hospital.surgeries[0]?.name ?? "");
    setSelectedSlot("");
    setPatientName("");
    setPatientAge("");
    setPatientLocation("");
    setBookingError(null);
    setConfirmation(null);
    setIsOpen(false);
  };

  const openModalFor = (type: BookingType) => {
    if (isLoading) {
      return;
    }

    if (!user) {
      router.push(`/sign-in?redirect=${encodeURIComponent(pathname || `/hospital/${hospital.id}`)}`);
      return;
    }

    setBookingType(type);
    setIsOpen(true);
    setBookingError(null);
    setConfirmation(null);
    setSelectedSlot("");
  };

  const submitBooking = async () => {
    if (!selectedSurgery || !selectedSlot || !patientName.trim() || !patientAge || !patientLocation.trim()) {
      return;
    }

    const [date, time] = selectedSlot.split("|", 2);

    setIsSubmitting(true);
    setBookingError(null);

    try {
      const response = await fetch("/api/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hospitalId: hospital.id,
          bookingType,
          surgeryName: selectedSurgery,
          patientName: patientName.trim(),
          patientAge: Number(patientAge),
          patientLocation: patientLocation.trim(),
          slot: {
            date,
            time,
          },
        }),
      });

      if (response.status === 401) {
        router.push(`/sign-in?redirect=${encodeURIComponent(pathname || `/hospital/${hospital.id}`)}`);
        return;
      }

      if (!response.ok) {
        let errorMessage = "Booking request failed. Please try again.";

        try {
          const errorPayload = (await response.json()) as { error?: string };

          if (errorPayload?.error) {
            errorMessage = errorPayload.error;
          }
        } catch {
          // Keep default message when response body is not JSON.
        }

        setBookingError(errorMessage);
        return;
      }

      const payload = (await response.json()) as { confirmation: BookingConfirmation };
      setConfirmation(payload.confirmation);
    } catch {
      setBookingError("Unable to connect right now. Please check your network and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={() => openModalFor("consultation")} disabled={isLoading}>
          Book Consultation
        </Button>
        <Button type="button" onClick={() => openModalFor("surgery")} disabled={isLoading}>
          Book Surgery
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={(open) => (open ? setIsOpen(true) : resetModal())}>
        <DialogContent>
          {confirmation ? (
            <section className="space-y-4">
              <Badge variant="success">Booking confirmed</Badge>
              <DialogHeader>
                <DialogTitle>Your slot is reserved</DialogTitle>
              </DialogHeader>
              <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
                <p className="font-semibold">Booking ID: {confirmation.bookingId}</p>
                <p className="mt-1">Hospital: {confirmation.hospitalName}</p>
                <p className="mt-1">Type: {confirmation.bookingType}</p>
                <p className="mt-1">Surgery: {confirmation.surgeryName}</p>
                <p className="mt-1">Patient: {confirmation.patientName}, {confirmation.patientAge}</p>
                <p className="mt-1">From: {confirmation.patientLocation}</p>
                <p className="mt-1">Slot: {confirmation.slot.date} at {confirmation.slot.time}</p>
                <p className="mt-1">Estimated Cost: {formatCurrency(confirmation.estimatedCost)}</p>
              </div>
              <DialogFooter>
                <Button type="button" onClick={resetModal}>Close</Button>
              </DialogFooter>
            </section>
          ) : (
            <section className="space-y-4">
              <Badge variant="outline">{bookingType} booking</Badge>
              <DialogHeader>
                <DialogTitle>Reserve your slot at {hospital.name}</DialogTitle>
                <DialogDescription>Select surgery and available slot to confirm your booking.</DialogDescription>
              </DialogHeader>

              {bookingError ? (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {bookingError}
                </p>
              ) : null}

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Patient Name
                <input
                  type="text"
                  autoComplete="name"
                  value={patientName}
                  onChange={(event) => setPatientName(event.target.value)}
                  placeholder="Enter patient’s full name"
                  className="rounded-xl border border-slate-300 px-3 py-2.5"
                  required
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Patient Age
                  <input
                    type="number"
                    min="1"
                    max="120"
                    inputMode="numeric"
                    value={patientAge}
                    onChange={(event) => setPatientAge(event.target.value)}
                    placeholder="Age"
                    className="rounded-xl border border-slate-300 px-3 py-2.5"
                    required
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Current City
                  <input
                    type="text"
                    autoComplete="address-level2"
                    value={patientLocation}
                    onChange={(event) => setPatientLocation(event.target.value)}
                    placeholder="e.g. Bangalore"
                    className="rounded-xl border border-slate-300 px-3 py-2.5"
                    required
                  />
                </label>
              </div>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Select Surgery
                <select
                  className="rounded-xl border border-slate-300 px-3 py-2.5"
                  value={selectedSurgery}
                  onChange={(event) => setSelectedSurgery(event.target.value)}
                >
                  {hospital.surgeries.map((surgery) => (
                    <option key={surgery.name} value={surgery.name}>
                      {surgery.name}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <p className="text-sm font-medium text-slate-700">Available Slots</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {visibleSlots.map((slot) => {
                    const value = `${slot.date}|${slot.time}`;
                    const isSelected = selectedSlot === value;

                    return (
                      <Button
                        type="button"
                        key={value}
                        variant={isSelected ? "secondary" : "outline"}
                        onClick={() => setSelectedSlot(value)}
                        className="h-auto flex-col items-start py-2"
                      >
                        <span className="font-semibold">{slot.date}</span>
                        <span>{slot.time}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
                <p>
                  Estimated Cost: {formatCurrency(bookingType === "consultation" ? 900 : estimatedSurgeryCost)}
                </p>
              </div>

              <DialogFooter>
                <Button type="button" onClick={submitBooking} disabled={!selectedSlot || !patientName.trim() || !patientAge || !patientLocation.trim() || isSubmitting}>
                  {isSubmitting ? "Confirming..." : "Confirm Booking"}
                </Button>
                <DialogClose asChild>
                  <Button type="button" variant="outline" onClick={resetModal}>Cancel</Button>
                </DialogClose>
              </DialogFooter>
            </section>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
