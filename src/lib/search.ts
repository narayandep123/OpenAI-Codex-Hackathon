import { createAdminClient } from "@/lib/supabase/admin";
import type { Hospital, HospitalSurgery, InsurancePlan, SearchFilters, SearchQuery, SearchResult } from "@/lib/types";

interface MasterSurgery {
  name: string;
  typicalMinPrice: number;
  typicalMaxPrice: number;
}

interface HospitalRow {
  id: string;
  name: string;
  city: string;
  address: string;
  type: Hospital["type"];
  rating: number;
  image: string;
}

interface HospitalSurgeryRow {
  hospital_id: string;
  surgery_name: string;
  min_price: number;
  max_price: number;
}

interface HospitalSlotRow {
  hospital_id: string;
  slot_date: string;
  slot_time: string;
  is_available: boolean;
}

interface InsurancePlanRow {
  id: string;
  insurer_name: string;
  plan_name: string;
  coverage_cap: number;
  premium_per_year: number;
  covered_surgeries: string[];
  network_hospital_ids: string[];
}

interface MasterSurgeryRow {
  name: string;
  typical_min_price: number;
  typical_max_price: number;
}

const normalize = (value: string) => value.trim().toLowerCase();

const averagePrice = (item: HospitalSurgery) => (item.minPrice + item.maxPrice) / 2;

async function fetchHospitalDataset() {
  const supabase = createAdminClient();

  const [{ data: hospitals, error: hospitalsError }, { data: surgeries, error: surgeriesError }, { data: slots, error: slotsError }] = await Promise.all([
    supabase.from("hospitals").select("id, name, city, address, type, rating, image").order("name", { ascending: true }),
    supabase.from("hospital_surgeries").select("hospital_id, surgery_name, min_price, max_price"),
    supabase.from("hospital_slots").select("hospital_id, slot_date, slot_time, is_available").eq("is_available", true),
  ]);

  if (hospitalsError) {
    throw new Error(hospitalsError.message);
  }

  if (surgeriesError) {
    throw new Error(surgeriesError.message);
  }

  if (slotsError) {
    throw new Error(slotsError.message);
  }

  return {
    hospitals: (hospitals ?? []) as HospitalRow[],
    surgeries: (surgeries ?? []) as HospitalSurgeryRow[],
    slots: (slots ?? []) as HospitalSlotRow[],
  };
}

export async function getHospitals(): Promise<Hospital[]> {
  const { hospitals, surgeries, slots } = await fetchHospitalDataset();

  return hospitals.map((hospital) => ({
    id: hospital.id,
    name: hospital.name,
    city: hospital.city,
    address: hospital.address,
    type: hospital.type,
    rating: Number(hospital.rating),
    image: hospital.image,
    surgeries: surgeries
      .filter((item) => item.hospital_id === hospital.id)
      .map((item) => ({
        name: item.surgery_name,
        minPrice: Number(item.min_price),
        maxPrice: Number(item.max_price),
      })),
    availableSlots: slots
      .filter((slot) => slot.hospital_id === hospital.id)
      .map((slot) => ({
        date: slot.slot_date,
        time: slot.slot_time,
      })),
  }));
}

async function getMasterSurgeries(): Promise<MasterSurgery[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("surgeries")
    .select("name, typical_min_price, typical_max_price")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as MasterSurgeryRow[]).map((item) => ({
    name: item.name,
    typicalMinPrice: Number(item.typical_min_price),
    typicalMaxPrice: Number(item.typical_max_price),
  }));
}

export async function getSearchFilters(): Promise<SearchFilters> {
  const [hospitals, surgeries] = await Promise.all([getHospitals(), getMasterSurgeries()]);

  const allPrices = hospitals.flatMap((hospital) =>
    hospital.surgeries.flatMap((surgery) => [surgery.minPrice, surgery.maxPrice]),
  );

  return {
    surgeries: surgeries.map((item) => item.name),
    cities: Array.from(new Set(hospitals.map((hospital) => hospital.city))).sort(),
    minAvailablePrice: Math.min(...allPrices),
    maxAvailablePrice: Math.max(...allPrices),
  };
}

function findMatchingSurgery(hospital: Hospital, selectedSurgery?: string): HospitalSurgery | null {
  if (!selectedSurgery) {
    return hospital.surgeries.reduce((lowest, current) =>
      averagePrice(current) < averagePrice(lowest) ? current : lowest,
    );
  }

  const selectedNormalized = normalize(selectedSurgery);
  return (
    hospital.surgeries.find((surgery) => normalize(surgery.name) === selectedNormalized) ?? null
  );
}

function overlapsRange(surgery: HospitalSurgery, minPrice: number, maxPrice: number): boolean {
  return surgery.maxPrice >= minPrice && surgery.minPrice <= maxPrice;
}

export async function searchHospitals(query: SearchQuery): Promise<SearchResult[]> {
  const hospitals = await getHospitals();

  const minPrice = query.minPrice ?? 0;
  const maxPrice = query.maxPrice ?? Number.MAX_SAFE_INTEGER;

  const filtered = hospitals
    .map((hospital) => {
      const matchedSurgery = findMatchingSurgery(hospital, query.surgery);

      if (!matchedSurgery) {
        return null;
      }

      if (query.city && normalize(hospital.city) !== normalize(query.city)) {
        return null;
      }

      if (query.type && hospital.type !== query.type) {
        return null;
      }

      if (query.minRating && hospital.rating < query.minRating) {
        return null;
      }

      if (!overlapsRange(matchedSurgery, minPrice, maxPrice)) {
        return null;
      }

      return {
        id: hospital.id,
        name: hospital.name,
        city: hospital.city,
        address: hospital.address,
        type: hospital.type,
        rating: hospital.rating,
        image: hospital.image,
        surgeryName: matchedSurgery.name,
        minPrice: matchedSurgery.minPrice,
        maxPrice: matchedSurgery.maxPrice,
      } satisfies SearchResult;
    })
    .filter((item): item is SearchResult => item !== null);

  return filtered.sort((a, b) => {
    if (b.rating !== a.rating) {
      return b.rating - a.rating;
    }

    return a.minPrice - b.minPrice;
  });
}

export async function findHospitalById(id: string): Promise<Hospital | null> {
  const hospitals = await getHospitals();
  return hospitals.find((hospital) => hospital.id === id) ?? null;
}

export async function getInsurancePlans(): Promise<InsurancePlan[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("insurance_plans")
    .select("id, insurer_name, plan_name, coverage_cap, premium_per_year, covered_surgeries, network_hospital_ids")
    .order("insurer_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as InsurancePlanRow[]).map((plan) => ({
    id: plan.id,
    insurerName: plan.insurer_name,
    planName: plan.plan_name,
    coverageCap: Number(plan.coverage_cap),
    premiumPerYear: Number(plan.premium_per_year),
    coveredSurgeries: plan.covered_surgeries,
    networkHospitalIds: plan.network_hospital_ids,
  }));
}
