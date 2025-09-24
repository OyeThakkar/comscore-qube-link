export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      cpl_management: {
        Row: {
          content_id: string
          content_title: string | null
          cpl_list: string | null
          created_at: string
          film_id: string | null
          id: string
          package_uuid: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content_id: string
          content_title?: string | null
          cpl_list?: string | null
          created_at?: string
          film_id?: string | null
          id?: string
          package_uuid: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content_id?: string
          content_title?: string | null
          cpl_list?: string | null
          created_at?: string
          film_id?: string | null
          id?: string
          package_uuid?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      distributors: {
        Row: {
          created_at: string
          id: string
          qw_company_id: string
          qw_company_name: string
          qw_pat_encrypted: string | null
          studio_id: string
          studio_name: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          qw_company_id: string
          qw_company_name: string
          qw_pat_encrypted?: string | null
          studio_id: string
          studio_name: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          qw_company_id?: string
          qw_company_name?: string
          qw_pat_encrypted?: string | null
          studio_id?: string
          studio_name?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          booker_email: string | null
          booker_name: string | null
          booker_phone: string | null
          booking_created_at: string | null
          booking_ref: string | null
          cancel_flag: string | null
          chain_name: string | null
          content_id: string | null
          content_title: string | null
          created_at: string
          delivery_method: string | null
          do_not_ship: string | null
          film_id: string | null
          hold_key_flag: string | null
          id: string
          is_no_key: string | null
          media_type: string | null
          note: string | null
          operation: string | null
          order_id: string | null
          package_uuid: string | null
          partner_name: string | null
          playdate_begin: string | null
          playdate_end: string | null
          qw_company_id: string | null
          qw_company_name: string | null
          qw_identifier: string | null
          qw_theatre_city: string | null
          qw_theatre_country: string | null
          qw_theatre_id: string | null
          qw_theatre_name: string | null
          qw_theatre_state: string | null
          return_method: string | null
          screening_screen_no: string | null
          screening_time: string | null
          ship_hold_type: string | null
          studio_id: string | null
          studio_name: string | null
          theatre_address1: string | null
          theatre_city: string | null
          theatre_country: string | null
          theatre_id: string | null
          theatre_name: string | null
          theatre_postal_code: string | null
          theatre_state: string | null
          tmc_media_order_id: string | null
          tmc_theatre_id: string | null
          tracking_id: string | null
          updated_at: string
          user_id: string
          wiretap_serial_number: string | null
        }
        Insert: {
          booker_email?: string | null
          booker_name?: string | null
          booker_phone?: string | null
          booking_created_at?: string | null
          booking_ref?: string | null
          cancel_flag?: string | null
          chain_name?: string | null
          content_id?: string | null
          content_title?: string | null
          created_at?: string
          delivery_method?: string | null
          do_not_ship?: string | null
          film_id?: string | null
          hold_key_flag?: string | null
          id?: string
          is_no_key?: string | null
          media_type?: string | null
          note?: string | null
          operation?: string | null
          order_id?: string | null
          package_uuid?: string | null
          partner_name?: string | null
          playdate_begin?: string | null
          playdate_end?: string | null
          qw_company_id?: string | null
          qw_company_name?: string | null
          qw_identifier?: string | null
          qw_theatre_city?: string | null
          qw_theatre_country?: string | null
          qw_theatre_id?: string | null
          qw_theatre_name?: string | null
          qw_theatre_state?: string | null
          return_method?: string | null
          screening_screen_no?: string | null
          screening_time?: string | null
          ship_hold_type?: string | null
          studio_id?: string | null
          studio_name?: string | null
          theatre_address1?: string | null
          theatre_city?: string | null
          theatre_country?: string | null
          theatre_id?: string | null
          theatre_name?: string | null
          theatre_postal_code?: string | null
          theatre_state?: string | null
          tmc_media_order_id?: string | null
          tmc_theatre_id?: string | null
          tracking_id?: string | null
          updated_at?: string
          user_id: string
          wiretap_serial_number?: string | null
        }
        Update: {
          booker_email?: string | null
          booker_name?: string | null
          booker_phone?: string | null
          booking_created_at?: string | null
          booking_ref?: string | null
          cancel_flag?: string | null
          chain_name?: string | null
          content_id?: string | null
          content_title?: string | null
          created_at?: string
          delivery_method?: string | null
          do_not_ship?: string | null
          film_id?: string | null
          hold_key_flag?: string | null
          id?: string
          is_no_key?: string | null
          media_type?: string | null
          note?: string | null
          operation?: string | null
          order_id?: string | null
          package_uuid?: string | null
          partner_name?: string | null
          playdate_begin?: string | null
          playdate_end?: string | null
          qw_company_id?: string | null
          qw_company_name?: string | null
          qw_identifier?: string | null
          qw_theatre_city?: string | null
          qw_theatre_country?: string | null
          qw_theatre_id?: string | null
          qw_theatre_name?: string | null
          qw_theatre_state?: string | null
          return_method?: string | null
          screening_screen_no?: string | null
          screening_time?: string | null
          ship_hold_type?: string | null
          studio_id?: string | null
          studio_name?: string | null
          theatre_address1?: string | null
          theatre_city?: string | null
          theatre_country?: string | null
          theatre_id?: string | null
          theatre_name?: string | null
          theatre_postal_code?: string | null
          theatre_state?: string | null
          tmc_media_order_id?: string | null
          tmc_theatre_id?: string | null
          tracking_id?: string | null
          updated_at?: string
          user_id?: string
          wiretap_serial_number?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          last_login: string | null
          name: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          last_login?: string | null
          name?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          last_login?: string | null
          name?: string | null
          status?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_last_login: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "client_service" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "client_service", "viewer"],
    },
  },
} as const
