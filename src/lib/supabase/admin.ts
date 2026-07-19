import { createClient, type SupabaseClient } from "@supabase/supabase-js";

interface Database {
  public: {
    Tables: {
      bookings: {
        Row: {
          id: string;
          user_id: string;
          hospital_id: string;
          hospital_name: string;
          surgery_name: string;
          booking_type: string;
          slot_date: string | null;
          slot_time: string | null;
          estimated_cost: number | null;
          patient_name: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          hospital_id: string;
          hospital_name: string;
          surgery_name: string;
          booking_type: string;
          slot_date?: string | null;
          slot_time?: string | null;
          estimated_cost?: number | null;
          patient_name?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          hospital_id?: string;
          hospital_name?: string;
          surgery_name?: string;
          booking_type?: string;
          slot_date?: string | null;
          slot_time?: string | null;
          estimated_cost?: number | null;
          patient_name?: string | null;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      hospitals: {
        Row: {
          id: string;
          name: string;
          city: string;
          address: string;
          type: string;
          rating: number;
          image: string;
        };
        Insert: {
          id: string;
          name: string;
          city: string;
          address: string;
          type: string;
          rating: number;
          image: string;
        };
        Update: {
          id?: string;
          name?: string;
          city?: string;
          address?: string;
          type?: string;
          rating?: number;
          image?: string;
        };
        Relationships: [];
      };
      surgeries: {
        Row: {
          name: string;
          typical_min_price: number;
          typical_max_price: number;
        };
        Insert: {
          name: string;
          typical_min_price: number;
          typical_max_price: number;
        };
        Update: {
          name?: string;
          typical_min_price?: number;
          typical_max_price?: number;
        };
        Relationships: [];
      };
      insurance_plans: {
        Row: {
          id: string;
          insurer_name: string;
          plan_name: string;
          coverage_cap: number;
          premium_per_year: number;
          covered_surgeries: string[];
          network_hospital_ids: string[];
        };
        Insert: {
          id: string;
          insurer_name: string;
          plan_name: string;
          coverage_cap: number;
          premium_per_year: number;
          covered_surgeries?: string[];
          network_hospital_ids?: string[];
        };
        Update: {
          id?: string;
          insurer_name?: string;
          plan_name?: string;
          coverage_cap?: number;
          premium_per_year?: number;
          covered_surgeries?: string[];
          network_hospital_ids?: string[];
        };
        Relationships: [];
      };
      hospital_surgeries: {
        Row: {
          hospital_id: string;
          surgery_name: string;
          min_price: number;
          max_price: number;
        };
        Insert: {
          hospital_id: string;
          surgery_name: string;
          min_price: number;
          max_price: number;
        };
        Update: {
          hospital_id?: string;
          surgery_name?: string;
          min_price?: number;
          max_price?: number;
        };
        Relationships: [];
      };
      hospital_slots: {
        Row: {
          id: number;
          hospital_id: string;
          slot_date: string;
          slot_time: string;
          is_available: boolean;
        };
        Insert: {
          id?: number;
          hospital_id: string;
          slot_date: string;
          slot_time: string;
          is_available?: boolean;
        };
        Update: {
          id?: number;
          hospital_id?: string;
          slot_date?: string;
          slot_time?: string;
          is_available?: boolean;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}

let adminClient: SupabaseClient<Database> | null = null;

export function createAdminClient() {
  if (adminClient) {
    return adminClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase admin environment variables are missing.");
  }

  adminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return adminClient;
}