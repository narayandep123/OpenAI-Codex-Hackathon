import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Please sign in to manage bookings." }, { status: 401 });
  }

  const { id: bookingId } = await params;
  const adminSupabase = createAdminClient();

  const { data: booking, error: fetchError } = await adminSupabase
    .from("bookings")
    .select("id, user_id, hospital_id, slot_date, slot_time, status")
    .eq("id", bookingId)
    .single();

  if (fetchError || !booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  if (booking.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (booking.status === "cancelled") {
    return NextResponse.json({ error: "Booking is already cancelled." }, { status: 409 });
  }

  const { error: updateError } = await adminSupabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Re-release the slot so others can book it
  if (booking.slot_date && booking.slot_time) {
    await adminSupabase
      .from("hospital_slots")
      .update({ is_available: true })
      .eq("hospital_id", booking.hospital_id)
      .eq("slot_date", booking.slot_date)
      .eq("slot_time", booking.slot_time);
  }

  return NextResponse.json({ success: true, message: "Booking cancelled." });
}
