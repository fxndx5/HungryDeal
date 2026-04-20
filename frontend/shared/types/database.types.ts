export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      platform_prices: {
        Row: {
          available: boolean | null
          delivery_fee: number | null
          expires_at: string | null
          fetched_at: string | null
          id: string
          platform: string
          product_price: number | null
          redirect_url: string | null
          restaurant_id: string | null
          service_fee: number | null
          total: number | null
        }
        Insert: {
          available?: boolean | null
          delivery_fee?: number | null
          expires_at?: string | null
          fetched_at?: string | null
          id?: string
          platform: string
          product_price?: number | null
          redirect_url?: string | null
          restaurant_id?: string | null
          service_fee?: number | null
          total?: number | null
        }
        Update: {
          available?: boolean | null
          delivery_fee?: number | null
          expires_at?: string | null
          fetched_at?: string | null
          id?: string
          platform?: string
          product_price?: number | null
          redirect_url?: string | null
          restaurant_id?: string | null
          service_fee?: number | null
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_prices_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          id: string
          image_url: string | null
          latitude: number | null
          longitude: number | null
          name: string
          platforms: string[] | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          id: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          platforms?: string[] | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          platforms?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      search_history: {
        Row: {
          id: string
          platform_chosen: string | null
          query: string | null
          restaurant_id: string | null
          savings: number | null
          searched_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          platform_chosen?: string | null
          query?: string | null
          restaurant_id?: string | null
          savings?: number | null
          searched_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          platform_chosen?: string | null
          query?: string | null
          restaurant_id?: string | null
          savings?: number | null
          searched_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "search_history_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "search_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          password_hash: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          password_hash: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          password_hash?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ─── Helpers de conveniencia ───────────────────────────────────────────────

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Row"]

export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Update"]

// ─── Tipos de dominio ──────────────────────────────────────────────────────

export type Platform = "uber_eats" | "glovo" | "just_eat"

export type User          = Tables<"users">
export type Restaurant    = Tables<"restaurants">
export type PlatformPrice = Tables<"platform_prices">
export type SearchHistory = Tables<"search_history">

export type PlatformPriceInsert = TablesInsert<"platform_prices">
export type SearchHistoryInsert = TablesInsert<"search_history">
