export type HospitalType = "multi-specialty" | "standard";

export interface HospitalSurgery {
  name: string;
  minPrice: number;
  maxPrice: number;
}

export interface HospitalSlot {
  date: string;
  time: string;
}

export interface Hospital {
  id: string;
  name: string;
  city: string;
  address: string;
  type: HospitalType;
  rating: number;
  image: string;
  surgeries: HospitalSurgery[];
  availableSlots: HospitalSlot[];
}

export interface SearchQuery {
  surgery?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  type?: HospitalType;
}

export interface SearchResult {
  id: string;
  name: string;
  city: string;
  address: string;
  type: HospitalType;
  rating: number;
  image: string;
  surgeryName: string;
  minPrice: number;
  maxPrice: number;
}

export interface SearchFilters {
  surgeries: string[];
  cities: string[];
  minAvailablePrice: number;
  maxAvailablePrice: number;
}

export interface InsurancePlan {
  id: string;
  insurerName: string;
  planName: string;
  coverageCap: number;
  premiumPerYear: number;
  coveredSurgeries: string[];
  networkHospitalIds: string[];
}

export interface ChatIntent {
  surgeryType?: string;
  city?: string;
  maxBudget?: number;
  minRating?: number;
}
