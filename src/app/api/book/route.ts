import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { findHospitalById } from "@/lib/search";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { HospitalSurgery } from "@/lib/types";

type BookingType = "consultation" | "surgery";

interface BookingRequest {
  hospitalId?: string;
  bookingType?: BookingType;
  surgeryName?: string;
  patientName?: string;
  patientAge?: number;
  patientLocation?: string;
  slot?: {
    date?: string;
    time?: string;
  };
}

function estimateCost(bookingType: BookingType, surgery: HospitalSurgery): number {
  if (bookingType === "consultation") {
    return 900;
  }

  return Math.round((surgery.minPrice + surgery.maxPrice) / 2);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Please sign in to confirm a booking." }, { status: 401 });
  }

  const body = (await request.json()) as BookingRequest;

  if (!body.hospitalId || !body.bookingType || !body.surgeryName || !body.slot?.date || !body.slot.time) {
    return NextResponse.json({ error: "Missing required booking fields." }, { status: 400 });
  }

  const patientName = body.patientName?.trim();
  const patientLocation = body.patientLocation?.trim();
  const patientAge = body.patientAge;

  if (
    !patientName ||
    !patientLocation ||
    typeof patientAge !== "number" ||
    !Number.isInteger(patientAge) ||
    patientAge < 1 ||
    patientAge > 120
  ) {
    return NextResponse.json({ error: "Enter a patient name, age from 1 to 120, and current city." }, { status: 400 });
  }

  const hospital = await findHospitalById(body.hospitalId);

  if (!hospital) {
    return NextResponse.json({ error: "Hospital not found." }, { status: 404 });
  }

  const surgery = hospital.surgeries.find((item) => item.name === body.surgeryName);

  if (!surgery) {
    return NextResponse.json({ error: "Selected surgery is unavailable at this hospital." }, { status: 400 });
  }

  const slotExists = hospital.availableSlots.some(
    (slot) => slot.date === body.slot?.date && slot.time === body.slot?.time,
  );

  if (!slotExists) {
    return NextResponse.json({ error: "Selected slot is unavailable." }, { status: 400 });
  }

  const bookingId = `SF-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
  const estimatedCost = estimateCost(body.bookingType, surgery);

  const { data: reservedSlots, error: reserveError } = await adminSupabase
    .from("hospital_slots")
    .update({ is_available: false })
    .eq("hospital_id", hospital.id)
    .eq("slot_date", body.slot.date)
    .eq("slot_time", body.slot.time)
    .eq("is_available", true)
    .select("id")
    .limit(1);

  if (reserveError) {
    return NextResponse.json({ error: reserveError.message }, { status: 500 });
  }

  if (!reservedSlots || reservedSlots.length === 0) {
    return NextResponse.json({ error: "Selected slot is no longer available." }, { status: 409 });
  }

  const { error } = await adminSupabase.from("bookings").insert({
    user_id: user.id,
    hospital_id: hospital.id,
    hospital_name: hospital.name,
    surgery_name: surgery.name,
    booking_type: body.bookingType,
    slot_date: body.slot.date,
    slot_time: body.slot.time,
    estimated_cost: estimatedCost,
    patient_name: patientName,
    status: "confirmed",
  });

  if (error) {
    await adminSupabase
      .from("hospital_slots")
      .update({ is_available: true })
      .eq("hospital_id", hospital.id)
      .eq("slot_date", body.slot.date)
      .eq("slot_time", body.slot.time);

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      confirmation: {
        bookingId,
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        surgeryName: surgery.name,
        bookingType: body.bookingType,
        patientName,
        patientAge,
        patientLocation,
        slot: {
          date: body.slot.date,
          time: body.slot.time,
        },
        estimatedCost,
        status: "confirmed",
        createdAt: new Date().toISOString(),
      },
      message: "Booking confirmed successfully.",
    },
    { status: 201 },
  );
}
