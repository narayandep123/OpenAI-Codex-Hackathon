import { NextRequest, NextResponse } from "next/server";
import { getSearchFilters, searchHospitals } from "@/lib/search";
import type { HospitalType } from "@/lib/types";

const parseNumber = (input: string | null): number | undefined => {
  if (!input) {
    return undefined;
  }

  const parsed = Number(input);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const surgery = params.get("surgery") ?? undefined;
  const city = params.get("city") ?? undefined;
  const type = (params.get("type") as HospitalType | null) ?? undefined;

  const minPrice = parseNumber(params.get("minPrice"));
  const maxPrice = parseNumber(params.get("maxPrice"));
  const minRating = parseNumber(params.get("minRating"));

  const filters = await getSearchFilters();

  const results = await searchHospitals({
    surgery,
    city,
    minPrice,
    maxPrice,
    minRating,
    type,
  });

  return NextResponse.json({
    query: { surgery, city, type, minPrice, maxPrice, minRating },
    filters,
    total: results.length,
    results,
  });
}
