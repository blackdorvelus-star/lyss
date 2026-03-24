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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      call_logs: {
        Row: {
          call_result: string | null
          client_sentiment: string | null
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          invoice_id: string
          status: string
          summary: string | null
          user_id: string
          vapi_call_id: string | null
        }
        Insert: {
          call_result?: string | null
          client_sentiment?: string | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          invoice_id: string
          status?: string
          summary?: string | null
          user_id: string
          vapi_call_id?: string | null
        }
        Update: {
          call_result?: string | null
          client_sentiment?: string | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          invoice_id?: string
          status?: string
          summary?: string | null
          user_id?: string
          vapi_call_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      collection_sequences: {
        Row: {
          amount_due: number
          company_id: string
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          due_date: string | null
          id: string
          invoice_id: string
          last_action_at: string | null
          next_action_at: string | null
          sequence_step: string
          status: string
          stopped_reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_due?: number
          company_id: string
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          due_date?: string | null
          id?: string
          invoice_id: string
          last_action_at?: string | null
          next_action_at?: string | null
          sequence_step?: string
          status?: string
          stopped_reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_due?: number
          company_id?: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          due_date?: string | null
          id?: string
          invoice_id?: string
          last_action_at?: string | null
          next_action_at?: string | null
          sequence_step?: string
          status?: string
          stopped_reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_sequences_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          amount_recovered: number | null
          client_id: string
          created_at: string
          current_sequence_step: number | null
          due_date: string | null
          file_url: string | null
          id: string
          invoice_number: string | null
          last_sequence_action_at: string | null
          next_action_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          amount_recovered?: number | null
          client_id: string
          created_at?: string
          current_sequence_step?: number | null
          due_date?: string | null
          file_url?: string | null
          id?: string
          invoice_number?: string | null
          last_sequence_action_at?: string | null
          next_action_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          amount_recovered?: number | null
          client_id?: string
          created_at?: string
          current_sequence_step?: number | null
          due_date?: string | null
          file_url?: string | null
          id?: string
          invoice_number?: string | null
          last_sequence_action_at?: string | null
          next_action_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          invoice_id: string | null
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_id?: string | null
          is_read?: boolean
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invoice_id?: string | null
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_settings: {
        Row: {
          active_channels: Json | null
          ai_max_discount_percent: number | null
          ai_negotiate: boolean | null
          ai_propose_payment_plan: boolean | null
          allow_disputes: boolean
          assistant_name: string | null
          assistant_role: string | null
          auto_start_sequences: boolean
          bank_account: string | null
          bank_institution: string | null
          bank_name: string | null
          bank_transit: string | null
          cheque_address: string | null
          company_logo_url: string | null
          company_name: string | null
          created_at: string
          deposit_instructions: string | null
          email_body_template: string | null
          email_signature: string | null
          email_subject_template: string | null
          follow_up_closing: string | null
          greeting_style: string | null
          id: string
          interac_answer: string | null
          interac_email: string | null
          interac_question: string | null
          notify_on_dispute: boolean | null
          notify_on_negative_sentiment: boolean | null
          notify_on_payment: boolean | null
          notify_on_response: boolean | null
          onboarding_completed: boolean
          paypal_link: string | null
          script_call_full: string | null
          script_dispute: string | null
          script_email_followup: string | null
          script_no_response: string | null
          script_partial_payment: string | null
          script_promise: string | null
          script_sms_followup: string | null
          sms_signature: string | null
          sms_template: string | null
          stripe_link: string | null
          tone: string | null
          updated_at: string
          use_custom_templates: boolean
          use_relevance_ai: boolean
          user_id: string
          vapi_custom_instructions: string | null
          vapi_first_message_template: string | null
          vapi_personality: string | null
          vapi_public_key: string | null
          vapi_voice_id: string | null
          vapi_voice_provider: string | null
          working_days: Json | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          active_channels?: Json | null
          ai_max_discount_percent?: number | null
          ai_negotiate?: boolean | null
          ai_propose_payment_plan?: boolean | null
          allow_disputes?: boolean
          assistant_name?: string | null
          assistant_role?: string | null
          auto_start_sequences?: boolean
          bank_account?: string | null
          bank_institution?: string | null
          bank_name?: string | null
          bank_transit?: string | null
          cheque_address?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          created_at?: string
          deposit_instructions?: string | null
          email_body_template?: string | null
          email_signature?: string | null
          email_subject_template?: string | null
          follow_up_closing?: string | null
          greeting_style?: string | null
          id?: string
          interac_answer?: string | null
          interac_email?: string | null
          interac_question?: string | null
          notify_on_dispute?: boolean | null
          notify_on_negative_sentiment?: boolean | null
          notify_on_payment?: boolean | null
          notify_on_response?: boolean | null
          onboarding_completed?: boolean
          paypal_link?: string | null
          script_call_full?: string | null
          script_dispute?: string | null
          script_email_followup?: string | null
          script_no_response?: string | null
          script_partial_payment?: string | null
          script_promise?: string | null
          script_sms_followup?: string | null
          sms_signature?: string | null
          sms_template?: string | null
          stripe_link?: string | null
          tone?: string | null
          updated_at?: string
          use_custom_templates?: boolean
          use_relevance_ai?: boolean
          user_id: string
          vapi_custom_instructions?: string | null
          vapi_first_message_template?: string | null
          vapi_personality?: string | null
          vapi_public_key?: string | null
          vapi_voice_id?: string | null
          vapi_voice_provider?: string | null
          working_days?: Json | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          active_channels?: Json | null
          ai_max_discount_percent?: number | null
          ai_negotiate?: boolean | null
          ai_propose_payment_plan?: boolean | null
          allow_disputes?: boolean
          assistant_name?: string | null
          assistant_role?: string | null
          auto_start_sequences?: boolean
          bank_account?: string | null
          bank_institution?: string | null
          bank_name?: string | null
          bank_transit?: string | null
          cheque_address?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          created_at?: string
          deposit_instructions?: string | null
          email_body_template?: string | null
          email_signature?: string | null
          email_subject_template?: string | null
          follow_up_closing?: string | null
          greeting_style?: string | null
          id?: string
          interac_answer?: string | null
          interac_email?: string | null
          interac_question?: string | null
          notify_on_dispute?: boolean | null
          notify_on_negative_sentiment?: boolean | null
          notify_on_payment?: boolean | null
          notify_on_response?: boolean | null
          onboarding_completed?: boolean
          paypal_link?: string | null
          script_call_full?: string | null
          script_dispute?: string | null
          script_email_followup?: string | null
          script_no_response?: string | null
          script_partial_payment?: string | null
          script_promise?: string | null
          script_sms_followup?: string | null
          sms_signature?: string | null
          sms_template?: string | null
          stripe_link?: string | null
          tone?: string | null
          updated_at?: string
          use_custom_templates?: boolean
          use_relevance_ai?: boolean
          user_id?: string
          vapi_custom_instructions?: string | null
          vapi_first_message_template?: string | null
          vapi_personality?: string | null
          vapi_public_key?: string | null
          vapi_voice_id?: string | null
          vapi_voice_provider?: string | null
          working_days?: Json | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      payment_tokens: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          invoice_id: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          invoice_id: string
          token?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          invoice_id?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_tokens_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      quickbooks_connections: {
        Row: {
          access_token: string
          company_name: string | null
          created_at: string
          id: string
          realm_id: string
          refresh_token: string
          token_expires_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          company_name?: string | null
          created_at?: string
          id?: string
          realm_id: string
          refresh_token: string
          token_expires_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          company_name?: string | null
          created_at?: string
          id?: string
          realm_id?: string
          refresh_token?: string
          token_expires_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          quote_number: string | null
          sent_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          quote_number?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          quote_number?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_sequences: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          max_attempts_per_channel: Json
          steps: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          max_attempts_per_channel?: Json
          steps?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          max_attempts_per_channel?: Json
          steps?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          channel: string
          created_at: string
          delivered_at: string | null
          delivery_provider_id: string | null
          delivery_status: string | null
          id: string
          invoice_id: string
          message_content: string
          response: string | null
          sent_at: string | null
          sms_response: string | null
          sms_response_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          delivered_at?: string | null
          delivery_provider_id?: string | null
          delivery_status?: string | null
          id?: string
          invoice_id: string
          message_content: string
          response?: string | null
          sent_at?: string | null
          sms_response?: string | null
          sms_response_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          delivered_at?: string | null
          delivery_provider_id?: string | null
          delivery_status?: string | null
          id?: string
          invoice_id?: string
          message_content?: string
          response?: string | null
          sent_at?: string | null
          sms_response?: string | null
          sms_response_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      sage_connections: {
        Row: {
          access_token: string
          business_name: string | null
          created_at: string
          id: string
          refresh_token: string
          resource_owner_id: string
          token_expires_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          business_name?: string | null
          created_at?: string
          id?: string
          refresh_token: string
          resource_owner_id: string
          token_expires_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          business_name?: string | null
          created_at?: string
          id?: string
          refresh_token?: string
          resource_owner_id?: string
          token_expires_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          max_dossiers: number
          plan: Database["public"]["Enums"]["app_plan"]
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          max_dossiers?: number
          plan?: Database["public"]["Enums"]["app_plan"]
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          max_dossiers?: number
          plan?: Database["public"]["Enums"]["app_plan"]
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visitor_feedback: {
        Row: {
          created_at: string
          details: string | null
          feedback_type: string
          id: string
          page_time_seconds: number | null
          page_url: string | null
          reason: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: string | null
          feedback_type?: string
          id?: string
          page_time_seconds?: number | null
          page_url?: string | null
          reason?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: string | null
          feedback_type?: string
          id?: string
          page_time_seconds?: number | null
          page_url?: string | null
          reason?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_plan: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_plan"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_plan: "free" | "solo" | "pro" | "enterprise"
      app_role: "admin" | "moderator" | "user"
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
      app_plan: ["free", "solo", "pro", "enterprise"],
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
