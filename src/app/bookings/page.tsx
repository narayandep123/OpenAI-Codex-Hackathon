import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { BookingsList, type BookingRow } from "@/components/bookings/bookings-list";
import { createClient } from "@/lib/supabase/server";

export default async function MyBookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in?redirect=/bookings");
  }

  const { data, error } = await supabase
    .from("bookings")
    .select("id, hospital_name, surgery_name, booking_type, slot_date, slot_time, estimated_cost, patient_name, status, created_at, user_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const bookings = (data ?? []) as BookingRow[];
  const hasBookings = bookings.length > 0;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-8">
      <section>
        <h1 className="text-3xl font-semibold text-slate-900">My Bookings</h1>
        <p className="mt-2 text-slate-600">
          Signed in as {user.email}. Your bookings are loaded securely from Supabase.
        </p>
      </section>

      {error ? (
        <Card>
          <CardContent className="py-8 text-sm text-rose-700">We could not load your bookings right now.</CardContent>
        </Card>
      ) : null}

      {!error && !hasBookings ? (
        <Card>
          <CardContent className="py-10 text-center text-slate-600">
            No bookings yet. Book a consultation or surgery to see it here.
          </CardContent>
        </Card>
      ) : null}

      {!error && hasBookings ? <BookingsList initialBookings={bookings} /> : null}
    </main>
  );
}
