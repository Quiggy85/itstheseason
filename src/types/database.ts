export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          marketing_opt_in: boolean;
          phone: string | null;
          stripe_customer_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          marketing_opt_in?: boolean;
          phone?: string | null;
          stripe_customer_id?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          marketing_opt_in?: boolean;
          phone?: string | null;
          stripe_customer_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      addresses: {
        Row: {
          city: string;
          country_code: string;
          created_at: string;
          id: string;
          is_default: boolean;
          label: string | null;
          line1: string;
          line2: string | null;
          phone: string | null;
          postcode: string;
          profile_id: string;
          recipient_name: string | null;
          county: string | null;
          updated_at: string;
        };
        Insert: {
          city: string;
          country_code?: string;
          created_at?: string;
          id?: string;
          is_default?: boolean;
          label?: string | null;
          line1: string;
          line2?: string | null;
          phone?: string | null;
          postcode: string;
          profile_id: string;
          recipient_name?: string | null;
          county?: string | null;
          updated_at?: string;
        };
        Update: {
          city?: string;
          country_code?: string;
          created_at?: string;
          id?: string;
          is_default?: boolean;
          label?: string | null;
          line1?: string;
          line2?: string | null;
          phone?: string | null;
          postcode?: string;
          profile_id?: string;
          recipient_name?: string | null;
          county?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "addresses_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_methods: {
        Row: {
          brand: string | null;
          created_at: string;
          exp_month: number | null;
          exp_year: number | null;
          id: string;
          is_default: boolean;
          last4: string | null;
          profile_id: string;
          stripe_payment_method_id: string;
          updated_at: string;
        };
        Insert: {
          brand?: string | null;
          created_at?: string;
          exp_month?: number | null;
          exp_year?: number | null;
          id?: string;
          is_default?: boolean;
          last4?: string | null;
          profile_id: string;
          stripe_payment_method_id: string;
          updated_at?: string;
        };
        Update: {
          brand?: string | null;
          created_at?: string;
          exp_month?: number | null;
          exp_year?: number | null;
          id?: string;
          is_default?: boolean;
          last4?: string | null;
          profile_id?: string;
          stripe_payment_method_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payment_methods_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      seasonal_events: {
        Row: {
          auto_rotate: boolean;
          created_at: string;
          description: string | null;
          display_priority: number;
          end_date: string;
          id: string;
          is_active: boolean;
          name: string;
          slug: string;
          start_date: string;
          updated_at: string;
        };
        Insert: {
          auto_rotate?: boolean;
          created_at?: string;
          description?: string | null;
          display_priority?: number;
          end_date: string;
          id?: string;
          is_active?: boolean;
          name: string;
          slug: string;
          start_date: string;
          updated_at?: string;
        };
        Update: {
          auto_rotate?: boolean;
          created_at?: string;
          description?: string | null;
          display_priority?: number;
          end_date?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          slug?: string;
          start_date?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      seasonal_event_keywords: {
        Row: {
          event_id: string;
          id: string;
          keyword: string;
        };
        Insert: {
          event_id: string;
          id?: string;
          keyword: string;
        };
        Update: {
          event_id?: string;
          id?: string;
          keyword?: string;
        };
        Relationships: [
          {
            foreignKeyName: "seasonal_event_keywords_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "seasonal_events";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          cj_product_id: string;
          created_at: string;
          currency_code: string;
          estimated_delivery_max_days: number | null;
          estimated_delivery_min_days: number | null;
          event_id: string | null;
          id: string;
          inventory_quantity: number | null;
          is_active: boolean;
          last_synced_at: string;
          media: Json | null;
          price: number;
          product_metadata: Json;
          returns_policy: string | null;
          shipping_cost: number | null;
          shipping_currency: string | null;
          shipping_estimated_max_days: number | null;
          shipping_estimated_min_days: number | null;
          shipping_method: string | null;
          shipping_policy: string | null;
          slug: string | null;
          tags: string[] | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          cj_product_id: string;
          created_at?: string;
          currency_code?: string;
          estimated_delivery_max_days?: number | null;
          estimated_delivery_min_days?: number | null;
          event_id?: string | null;
          id?: string;
          inventory_quantity?: number | null;
          is_active?: boolean;
          last_synced_at?: string;
          media?: Json | null;
          price: number;
          product_metadata: Json;
          returns_policy?: string | null;
          shipping_cost?: number | null;
          shipping_currency?: string | null;
          shipping_estimated_max_days?: number | null;
          shipping_estimated_min_days?: number | null;
          shipping_method?: string | null;
          shipping_policy?: string | null;
          slug?: string | null;
          tags?: string[] | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          cj_product_id?: string;
          created_at?: string;
          currency_code?: string;
          estimated_delivery_max_days?: number | null;
          estimated_delivery_min_days?: number | null;
          event_id?: string | null;
          id?: string;
          inventory_quantity?: number | null;
          is_active?: boolean;
          last_synced_at?: string;
          media?: Json | null;
          price?: number;
          product_metadata?: Json;
          returns_policy?: string | null;
          shipping_cost?: number | null;
          shipping_currency?: string | null;
          shipping_estimated_max_days?: number | null;
          shipping_estimated_min_days?: number | null;
          shipping_method?: string | null;
          shipping_policy?: string | null;
          slug?: string | null;
          tags?: string[] | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "seasonal_events";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_snapshots: {
        Row: {
          captured_at: string;
          id: number;
          inventory_quantity: number | null;
          product_id: string;
        };
        Insert: {
          captured_at?: string;
          id?: number;
          inventory_quantity?: number | null;
          product_id: string;
        };
        Update: {
          captured_at?: string;
          id?: number;
          inventory_quantity?: number | null;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_snapshots_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          billing_address_id: string | null;
          created_at: string;
          currency_code: string;
          delivery_notes: string | null;
          id: string;
          metadata: Json | null;
          profile_id: string;
          shipping_address_id: string | null;
          status: Database["public"]["Enums"]["order_status"];
          stripe_checkout_session_id: string | null;
          stripe_payment_intent_id: string | null;
          total_amount: number;
          updated_at: string;
        };
        Insert: {
          billing_address_id?: string | null;
          created_at?: string;
          currency_code?: string;
          delivery_notes?: string | null;
          id?: string;
          metadata?: Json | null;
          profile_id: string;
          shipping_address_id?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          total_amount: number;
          updated_at?: string;
        };
        Update: {
          billing_address_id?: string | null;
          created_at?: string;
          currency_code?: string;
          delivery_notes?: string | null;
          id?: string;
          metadata?: Json | null;
          profile_id?: string;
          shipping_address_id?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          total_amount?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_billing_address_id_fkey";
            columns: ["billing_address_id"];
            isOneToOne: false;
            referencedRelation: "addresses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_shipping_address_id_fkey";
            columns: ["shipping_address_id"];
            isOneToOne: false;
            referencedRelation: "addresses";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          cj_sku: string | null;
          created_at: string;
          currency_code: string;
          id: number;
          order_id: string;
          product_id: string;
          quantity: number;
          snapshot: Json;
          unit_amount: number;
        };
        Insert: {
          cj_sku?: string | null;
          created_at?: string;
          currency_code?: string;
          id?: number;
          order_id: string;
          product_id: string;
          quantity?: number;
          snapshot: Json;
          unit_amount: number;
        };
        Update: {
          cj_sku?: string | null;
          created_at?: string;
          currency_code?: string;
          id?: number;
          order_id?: string;
          product_id?: string;
          quantity?: number;
          snapshot?: Json;
          unit_amount?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      order_status: "pending" | "processing" | "fulfilled" | "cancelled" | "refunded";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
