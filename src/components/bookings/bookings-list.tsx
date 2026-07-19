"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface BookingRow {
  id: string;
  hospital_name: string;
  surgery_name: string;
  booking_type: "consultation" | "surgery";
  slot_date: string | null;
  slot_time: string | null;
  estimated_cost: number | null;
  patient_name: string | null;
  status: string;
  created_at: string;
  user_id: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export function BookingsList({ initialBookings }: { initialBookings: BookingRow[] }) {
  const [bookings, setBookings] = useState<BookingRow[]>(initialBookings);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [errorMap, setErrorMap] = useState<Record<string, string>>({});

  async function handleCancel(bookingId: string) {
    setCancellingId(bookingId);
    setErrorMap((prev) => ({ ...prev, [bookingId]: "" }));

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, { method: "PATCH" });
      const json = await res.json();

      if (!res.ok) {
        setErrorMap((prev) => ({ ...prev, [bookingId]: json.error ?? "Failed to cancel." }));
      } else {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b)),
        );
      }
    } catch {
      setErrorMap((prev) => ({ ...prev, [bookingId]: "Network error. Please try again." }));
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <section className="grid gap-4 md:grid-cols-2">
      {bookings.map((booking) => {
        const isCancelled = booking.status === "cancelled";
        const isCancelling = cancellingId === booking.id;

        return (
          <Card key={booking.id} className={isCancelled ? "opacity-60" : undefined}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="leading-snug">{booking.hospital_name}</CardTitle>
                <Badge variant={isCancelled ? "destructive" : "success"}>{booking.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-700">
              {booking.patient_name ? (
                <p>
                  Patient: <span className="font-semibold">{booking.patient_name}</span>
                </p>
              ) : null}
              <p>
                Booking ID: <span className="font-mono font-semibold">{booking.id}</span>
              </p>
              <p>
                Type: <span className="font-semibold capitalize">{booking.booking_type}</span>
              </p>
              <p>
                Surgery: <span className="font-semibold">{booking.surgery_name}</span>
              </p>
              <p>
                Slot:{" "}
                <span className="font-semibold">
                  {booking.slot_date || "TBD"} at {booking.slot_time || "TBD"}
                </span>
              </p>
              <p>
                Estimated Cost:{" "}
                <span className="font-semibold">{formatCurrency(booking.estimated_cost ?? 0)}</span>
              </p>
              <p>
                Booked on:{" "}
                <span className="font-semibold">
                  {new Date(booking.created_at).toLocaleString("en-IN")}
                </span>
              </p>

              {!isCancelled ? (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    disabled={isCancelling}
                    onClick={() => handleCancel(booking.id)}
                  >
                    {isCancelling ? "Cancelling…" : "Cancel Booking"}
                  </Button>
                  {errorMap[booking.id] ? (
                    <p className="mt-1.5 text-xs text-rose-600">{errorMap[booking.id]}</p>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
