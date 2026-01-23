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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          event_date: string
          event_time: string
          event_type: string
          guest_count: number | null
          id: string
          package_type: string | null
          special_requests: string | null
          status: string
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          event_date: string
          event_time: string
          event_type: string
          guest_count?: number | null
          id?: string
          package_type?: string | null
          special_requests?: string | null
          status?: string
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          event_date?: string
          event_time?: string
          event_type?: string
          guest_count?: number | null
          id?: string
          package_type?: string | null
          special_requests?: string | null
          status?: string
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      assets: {
        Row: {
          asset_type: Database["public"]["Enums"]["asset_type_enum"]
          client_id: string
          cost_basis: number | null
          created_at: string | null
          current_value: number
          expected_return_base: number | null
          expected_return_high: number | null
          expected_return_low: number | null
          fee_bps: number | null
          id: string
          liquidity_score: number | null
          meta_jsonb: Json | null
          notes: string | null
          tax_wrapper: Database["public"]["Enums"]["tax_wrapper_type"]
          title: string
          updated_at: string | null
        }
        Insert: {
          asset_type: Database["public"]["Enums"]["asset_type_enum"]
          client_id: string
          cost_basis?: number | null
          created_at?: string | null
          current_value: number
          expected_return_base?: number | null
          expected_return_high?: number | null
          expected_return_low?: number | null
          fee_bps?: number | null
          id?: string
          liquidity_score?: number | null
          meta_jsonb?: Json | null
          notes?: string | null
          tax_wrapper: Database["public"]["Enums"]["tax_wrapper_type"]
          title: string
          updated_at?: string | null
        }
        Update: {
          asset_type?: Database["public"]["Enums"]["asset_type_enum"]
          client_id?: string
          cost_basis?: number | null
          created_at?: string | null
          current_value?: number
          expected_return_base?: number | null
          expected_return_high?: number | null
          expected_return_low?: number | null
          fee_bps?: number | null
          id?: string
          liquidity_score?: number | null
          meta_jsonb?: Json | null
          notes?: string | null
          tax_wrapper?: Database["public"]["Enums"]["tax_wrapper_type"]
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string
          customer_email: string | null
          id: string
          messages: Json
          session_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          id?: string
          messages?: Json
          session_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          id?: string
          messages?: Json
          session_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_profiles: {
        Row: {
          age: number
          annual_expenses: number
          annual_income: number
          created_at: string
          current_insurance_coverage: number
          debts: number
          dependents: number
          desired_retirement_income: number
          education_expenses: number
          id: string
          income_replacement: number
          investment_allocation_bonds: number
          investment_allocation_cash: number
          investment_allocation_stocks: number
          legacy_goal: number
          marital_status: string
          mortgage_balance: number
          name: string
          open_to_annuity: boolean
          open_to_iul: boolean
          other_investments: number
          real_estate_value: number
          retirement_401k: number
          retirement_ira: number
          risk_tolerance: number
          target_retirement_age: number
          total_assets: number
          updated_at: string
          user_id: string
        }
        Insert: {
          age: number
          annual_expenses?: number
          annual_income?: number
          created_at?: string
          current_insurance_coverage?: number
          debts?: number
          dependents?: number
          desired_retirement_income?: number
          education_expenses?: number
          id?: string
          income_replacement?: number
          investment_allocation_bonds?: number
          investment_allocation_cash?: number
          investment_allocation_stocks?: number
          legacy_goal?: number
          marital_status: string
          mortgage_balance?: number
          name: string
          open_to_annuity?: boolean
          open_to_iul?: boolean
          other_investments?: number
          real_estate_value?: number
          retirement_401k?: number
          retirement_ira?: number
          risk_tolerance?: number
          target_retirement_age?: number
          total_assets?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number
          annual_expenses?: number
          annual_income?: number
          created_at?: string
          current_insurance_coverage?: number
          debts?: number
          dependents?: number
          desired_retirement_income?: number
          education_expenses?: number
          id?: string
          income_replacement?: number
          investment_allocation_bonds?: number
          investment_allocation_cash?: number
          investment_allocation_stocks?: number
          legacy_goal?: number
          marital_status?: string
          mortgage_balance?: number
          name?: string
          open_to_annuity?: boolean
          open_to_iul?: boolean
          other_investments?: number
          real_estate_value?: number
          retirement_401k?: number
          retirement_ira?: number
          risk_tolerance?: number
          target_retirement_age?: number
          total_assets?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          advisor_id: string
          created_at: string | null
          dob: string
          email: string | null
          filing_status: string
          household_jsonb: Json | null
          id: string
          name_first: string
          name_last: string
          state: string
          updated_at: string | null
        }
        Insert: {
          advisor_id: string
          created_at?: string | null
          dob: string
          email?: string | null
          filing_status: string
          household_jsonb?: Json | null
          id?: string
          name_first: string
          name_last: string
          state: string
          updated_at?: string | null
        }
        Update: {
          advisor_id?: string
          created_at?: string | null
          dob?: string
          email?: string | null
          filing_status?: string
          household_jsonb?: Json | null
          id?: string
          name_first?: string
          name_last?: string
          state?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      computed_metrics: {
        Row: {
          client_id: string
          created_at: string | null
          dime_need: number | null
          disability_gap: number | null
          id: string
          lifetime_tax_drag_est: number | null
          liquid_pct: number | null
          liquidity_runway_months: number | null
          ltc_gap: number | null
          net_worth: number | null
          protection_gap: number | null
          retirement_gap_mo: number | null
          scores_jsonb: Json | null
          seq_risk_index: number | null
          tax_bucket_later_pct: number | null
          tax_bucket_never_pct: number | null
          tax_bucket_now_pct: number | null
          top_concentration_pct: number | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          dime_need?: number | null
          disability_gap?: number | null
          id?: string
          lifetime_tax_drag_est?: number | null
          liquid_pct?: number | null
          liquidity_runway_months?: number | null
          ltc_gap?: number | null
          net_worth?: number | null
          protection_gap?: number | null
          retirement_gap_mo?: number | null
          scores_jsonb?: Json | null
          seq_risk_index?: number | null
          tax_bucket_later_pct?: number | null
          tax_bucket_never_pct?: number | null
          tax_bucket_now_pct?: number | null
          top_concentration_pct?: number | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          dime_need?: number | null
          disability_gap?: number | null
          id?: string
          lifetime_tax_drag_est?: number | null
          liquid_pct?: number | null
          liquidity_runway_months?: number | null
          ltc_gap?: number | null
          net_worth?: number | null
          protection_gap?: number | null
          retirement_gap_mo?: number | null
          scores_jsonb?: Json | null
          seq_risk_index?: number | null
          tax_bucket_later_pct?: number | null
          tax_bucket_never_pct?: number | null
          tax_bucket_now_pct?: number | null
          top_concentration_pct?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "computed_metrics_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_twin_conversations: {
        Row: {
          created_at: string
          id: string
          illustration_id: string
          question: string
          response: Json
          simulation_results: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          illustration_id: string
          question: string
          response?: Json
          simulation_results?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          illustration_id?: string
          question?: string
          response?: Json
          simulation_results?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_twin_conversations_illustration_id_fkey"
            columns: ["illustration_id"]
            isOneToOne: false
            referencedRelation: "iul_illustrations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          document_id: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          updated_at: string
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          document_id?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          updated_at?: string
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          document_id?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          access_token: string | null
          analysis_result: Json | null
          analysis_status: string | null
          created_at: string
          file_size: number
          filename: string
          guest_email: string | null
          guest_name: string | null
          id: string
          metadata: Json | null
          mime_type: string
          original_filename: string
          parsing_method: string | null
          processed_at: string | null
          processing_progress: number | null
          storage_path: string
          updated_at: string
          upload_status: string
          user_id: string | null
        }
        Insert: {
          access_token?: string | null
          analysis_result?: Json | null
          analysis_status?: string | null
          created_at?: string
          file_size: number
          filename: string
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          metadata?: Json | null
          mime_type: string
          original_filename: string
          parsing_method?: string | null
          processed_at?: string | null
          processing_progress?: number | null
          storage_path: string
          updated_at?: string
          upload_status?: string
          user_id?: string | null
        }
        Update: {
          access_token?: string | null
          analysis_result?: Json | null
          analysis_status?: string | null
          created_at?: string
          file_size?: number
          filename?: string
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          metadata?: Json | null
          mime_type?: string
          original_filename?: string
          parsing_method?: string | null
          processed_at?: string | null
          processing_progress?: number | null
          storage_path?: string
          updated_at?: string
          upload_status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      financial_profile: {
        Row: {
          client_id: string
          created_at: string | null
          expenses_jsonb: Json | null
          goals_jsonb: Json | null
          horizons_jsonb: Json | null
          id: string
          income_jsonb: Json | null
          preferences_jsonb: Json | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          expenses_jsonb?: Json | null
          goals_jsonb?: Json | null
          horizons_jsonb?: Json | null
          id?: string
          income_jsonb?: Json | null
          preferences_jsonb?: Json | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          expenses_jsonb?: Json | null
          goals_jsonb?: Json | null
          horizons_jsonb?: Json | null
          id?: string
          income_jsonb?: Json | null
          preferences_jsonb?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_profile_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      insurances: {
        Row: {
          carrier: string | null
          cash_value: number | null
          client_id: string
          created_at: string | null
          expiry_year: number | null
          face_amount: number | null
          id: string
          loan_balance: number | null
          notes: string | null
          policy_type: Database["public"]["Enums"]["insurance_type_enum"]
          premium: number | null
          riders_jsonb: Json | null
          updated_at: string | null
        }
        Insert: {
          carrier?: string | null
          cash_value?: number | null
          client_id: string
          created_at?: string | null
          expiry_year?: number | null
          face_amount?: number | null
          id?: string
          loan_balance?: number | null
          notes?: string | null
          policy_type: Database["public"]["Enums"]["insurance_type_enum"]
          premium?: number | null
          riders_jsonb?: Json | null
          updated_at?: string | null
        }
        Update: {
          carrier?: string | null
          cash_value?: number | null
          client_id?: string
          created_at?: string | null
          expiry_year?: number | null
          face_amount?: number | null
          id?: string
          loan_balance?: number | null
          notes?: string | null
          policy_type?: Database["public"]["Enums"]["insurance_type_enum"]
          premium?: number | null
          riders_jsonb?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurances_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      iul_cases: {
        Row: {
          created_at: string | null
          id: string
          owner_uid: string | null
          title: string | null
          updated_at: string | null
          vector_store_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          owner_uid?: string | null
          title?: string | null
          updated_at?: string | null
          vector_store_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          owner_uid?: string | null
          title?: string | null
          updated_at?: string | null
          vector_store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "iul_cases_vector_store_id_fkey"
            columns: ["vector_store_id"]
            isOneToOne: false
            referencedRelation: "iul_vector_store"
            referencedColumns: ["id"]
          },
        ]
      }
      iul_files: {
        Row: {
          case_id: string | null
          created_at: string | null
          filename: string
          id: string
          pages: Json | null
          storage_path: string
          text_id: string | null
        }
        Insert: {
          case_id?: string | null
          created_at?: string | null
          filename: string
          id?: string
          pages?: Json | null
          storage_path: string
          text_id?: string | null
        }
        Update: {
          case_id?: string | null
          created_at?: string | null
          filename?: string
          id?: string
          pages?: Json | null
          storage_path?: string
          text_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "iul_files_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "iul_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      iul_illustrations: {
        Row: {
          carrier_name: string | null
          created_at: string
          extracted_data: Json
          file_name: string
          file_path: string
          id: string
          policy_type: string | null
          processing_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          carrier_name?: string | null
          created_at?: string
          extracted_data?: Json
          file_name: string
          file_path: string
          id?: string
          policy_type?: string | null
          processing_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          carrier_name?: string | null
          created_at?: string
          extracted_data?: Json
          file_name?: string
          file_path?: string
          id?: string
          policy_type?: string | null
          processing_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      iul_policies: {
        Row: {
          case_id: string | null
          created_at: string | null
          data: Json
          id: string
          source_file_id: string | null
        }
        Insert: {
          case_id?: string | null
          created_at?: string | null
          data: Json
          id?: string
          source_file_id?: string | null
        }
        Update: {
          case_id?: string | null
          created_at?: string | null
          data?: Json
          id?: string
          source_file_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "iul_policies_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "iul_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iul_policies_source_file_id_fkey"
            columns: ["source_file_id"]
            isOneToOne: false
            referencedRelation: "iul_files"
            referencedColumns: ["id"]
          },
        ]
      }
      iul_texts: {
        Row: {
          case_id: string | null
          created_at: string | null
          file_id: string | null
          id: string
          plain: string
        }
        Insert: {
          case_id?: string | null
          created_at?: string | null
          file_id?: string | null
          id?: string
          plain: string
        }
        Update: {
          case_id?: string | null
          created_at?: string | null
          file_id?: string | null
          id?: string
          plain?: string
        }
        Relationships: [
          {
            foreignKeyName: "iul_texts_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "iul_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iul_texts_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "iul_files"
            referencedColumns: ["id"]
          },
        ]
      }
      iul_vector_store: {
        Row: {
          created_at: string | null
          id: string
          note: string | null
          openai_vector_store_id: string
          owner_uid: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          note?: string | null
          openai_vector_store_id: string
          owner_uid?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          note?: string | null
          openai_vector_store_id?: string
          owner_uid?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          ai_insights: string | null
          assessment_data: Json
          consultation_requested: boolean | null
          created_at: string
          email: string | null
          follow_up_scheduled: boolean | null
          id: string
          name: string | null
          phone: string | null
          report_generated_at: string | null
          risk_scores: Json
          status: string | null
          updated_at: string
        }
        Insert: {
          ai_insights?: string | null
          assessment_data: Json
          consultation_requested?: boolean | null
          created_at?: string
          email?: string | null
          follow_up_scheduled?: boolean | null
          id?: string
          name?: string | null
          phone?: string | null
          report_generated_at?: string | null
          risk_scores: Json
          status?: string | null
          updated_at?: string
        }
        Update: {
          ai_insights?: string | null
          assessment_data?: Json
          consultation_requested?: boolean | null
          created_at?: string
          email?: string | null
          follow_up_scheduled?: boolean | null
          id?: string
          name?: string | null
          phone?: string | null
          report_generated_at?: string | null
          risk_scores?: Json
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      liabilities: {
        Row: {
          balance: number
          client_id: string
          created_at: string | null
          deductible: boolean | null
          id: string
          notes: string | null
          payment_monthly: number
          rate: number
          term_months: number | null
          type: Database["public"]["Enums"]["liability_type_enum"]
          updated_at: string | null
          variable: boolean | null
        }
        Insert: {
          balance: number
          client_id: string
          created_at?: string | null
          deductible?: boolean | null
          id?: string
          notes?: string | null
          payment_monthly: number
          rate: number
          term_months?: number | null
          type: Database["public"]["Enums"]["liability_type_enum"]
          updated_at?: string | null
          variable?: boolean | null
        }
        Update: {
          balance?: number
          client_id?: string
          created_at?: string | null
          deductible?: boolean | null
          id?: string
          notes?: string | null
          payment_monthly?: number
          rate?: number
          term_months?: number | null
          type?: Database["public"]["Enums"]["liability_type_enum"]
          updated_at?: string | null
          variable?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "liabilities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      pensions_social: {
        Row: {
          client_id: string
          cola: number | null
          created_at: string | null
          id: string
          monthly_benefit_est: number
          source: string
          start_age: number
          updated_at: string | null
        }
        Insert: {
          client_id: string
          cola?: number | null
          created_at?: string | null
          id?: string
          monthly_benefit_est: number
          source: string
          start_age: number
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          cola?: number | null
          created_at?: string | null
          id?: string
          monthly_benefit_est?: number
          source?: string
          start_age?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pensions_social_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_analyses: {
        Row: {
          client_questions: Json | null
          coverages: Json | null
          created_at: string | null
          document_id: string
          exclusions: Json | null
          gaps: Json | null
          id: string
          summary: string | null
          updated_at: string | null
        }
        Insert: {
          client_questions?: Json | null
          coverages?: Json | null
          created_at?: string | null
          document_id: string
          exclusions?: Json | null
          gaps?: Json | null
          id?: string
          summary?: string | null
          updated_at?: string | null
        }
        Update: {
          client_questions?: Json | null
          coverages?: Json | null
          created_at?: string | null
          document_id?: string
          exclusions?: Json | null
          gaps?: Json | null
          id?: string
          summary?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policy_analyses_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          pdf_url: string | null
          public_link_id: string | null
          report_jsonb: Json
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          pdf_url?: string | null
          public_link_id?: string | null
          report_jsonb: Json
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          pdf_url?: string | null
          public_link_id?: string | null
          report_jsonb?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      stress_test_scenarios: {
        Row: {
          created_at: string
          id: string
          illustration_id: string
          parameters: Json
          results: Json
          scenario_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          illustration_id: string
          parameters?: Json
          results?: Json
          scenario_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          illustration_id?: string
          parameters?: Json
          results?: Json
          scenario_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stress_test_scenarios_illustration_id_fkey"
            columns: ["illustration_id"]
            isOneToOne: false
            referencedRelation: "iul_illustrations"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_calculations: {
        Row: {
          calc_type: string
          created_at: string
          id: string
          inputs: Json
          outputs: Json
          scenario_id: string | null
        }
        Insert: {
          calc_type: string
          created_at?: string
          id?: string
          inputs?: Json
          outputs?: Json
          scenario_id?: string | null
        }
        Update: {
          calc_type?: string
          created_at?: string
          id?: string
          inputs?: Json
          outputs?: Json
          scenario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_calculations_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "tax_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_presets: {
        Row: {
          created_at: string
          description: string | null
          id: string
          inputs: Json
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          inputs?: Json
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          inputs?: Json
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      tax_scenarios: {
        Row: {
          created_at: string
          id: string
          inputs: Json
          outputs: Json
          scenario_type: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          inputs?: Json
          outputs?: Json
          scenario_type: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          inputs?: Json
          outputs?: Json
          scenario_type?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_guest_client: {
        Args: {
          p_dob: string
          p_email: string
          p_filing_status: string
          p_household_jsonb: Json
          p_name_first: string
          p_name_last: string
          p_state: string
        }
        Returns: string
      }
      get_document_by_access_token: {
        Args: { p_access_token: string }
        Returns: {
          analysis_result: Json
          analysis_status: string
          created_at: string
          file_size: number
          filename: string
          id: string
          metadata: Json
          mime_type: string
          original_filename: string
          parsing_method: string
          processed_at: string
          processing_progress: number
          storage_path: string
          updated_at: string
          upload_status: string
        }[]
      }
      get_report_by_public_link: {
        Args: { _public_link_id: string }
        Returns: {
          client_id: string
          created_at: string | null
          id: string
          pdf_url: string | null
          public_link_id: string | null
          report_jsonb: Json
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "reports"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      save_guest_assets: {
        Args: { p_assets: Json; p_client_id: string }
        Returns: undefined
      }
      save_guest_financial_profile: {
        Args: {
          p_client_id: string
          p_expenses_jsonb: Json
          p_goals_jsonb: Json
          p_income_jsonb: Json
          p_preferences_jsonb: Json
        }
        Returns: string
      }
      save_guest_insurances: {
        Args: { p_client_id: string; p_insurances: Json }
        Returns: undefined
      }
      save_guest_liabilities: {
        Args: { p_client_id: string; p_liabilities: Json }
        Returns: undefined
      }
      search_documents: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          document_id: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
    }
    Enums: {
      asset_type_enum:
        | "cash_checking"
        | "cash_savings"
        | "cash_cd"
        | "cash_money_market"
        | "cash_tbills"
        | "brokerage_equity"
        | "brokerage_etf"
        | "brokerage_mutual_fund"
        | "brokerage_bond"
        | "brokerage_options"
        | "brokerage_alternatives"
        | "brokerage_crypto"
        | "retirement_401k"
        | "retirement_403b"
        | "retirement_457"
        | "retirement_trad_ira"
        | "retirement_sep"
        | "retirement_simple"
        | "retirement_roth_ira"
        | "retirement_roth_401k"
        | "education_529"
        | "education_utma"
        | "education_ugma"
        | "insurance_term"
        | "insurance_whole_life"
        | "insurance_iul"
        | "insurance_vul"
        | "annuity_fia"
        | "annuity_rila"
        | "annuity_spia"
        | "annuity_dia"
        | "business_equity"
        | "real_estate_primary"
        | "real_estate_rental"
        | "real_estate_land"
        | "pension"
        | "social_security"
        | "hsa"
      insurance_type_enum:
        | "life_term"
        | "life_whole"
        | "life_iul"
        | "life_vul"
        | "disability_own_occ"
        | "disability_any_occ"
        | "ltc"
        | "umbrella"
        | "health"
      liability_type_enum:
        | "mortgage_primary"
        | "mortgage_rental"
        | "heloc"
        | "student_loan"
        | "auto_loan"
        | "credit_card"
        | "business_loan"
        | "personal_loan"
      tax_wrapper_type: "TAX_NOW" | "TAX_LATER" | "TAX_NEVER"
      user_role: "admin" | "advisor" | "user"
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
      asset_type_enum: [
        "cash_checking",
        "cash_savings",
        "cash_cd",
        "cash_money_market",
        "cash_tbills",
        "brokerage_equity",
        "brokerage_etf",
        "brokerage_mutual_fund",
        "brokerage_bond",
        "brokerage_options",
        "brokerage_alternatives",
        "brokerage_crypto",
        "retirement_401k",
        "retirement_403b",
        "retirement_457",
        "retirement_trad_ira",
        "retirement_sep",
        "retirement_simple",
        "retirement_roth_ira",
        "retirement_roth_401k",
        "education_529",
        "education_utma",
        "education_ugma",
        "insurance_term",
        "insurance_whole_life",
        "insurance_iul",
        "insurance_vul",
        "annuity_fia",
        "annuity_rila",
        "annuity_spia",
        "annuity_dia",
        "business_equity",
        "real_estate_primary",
        "real_estate_rental",
        "real_estate_land",
        "pension",
        "social_security",
        "hsa",
      ],
      insurance_type_enum: [
        "life_term",
        "life_whole",
        "life_iul",
        "life_vul",
        "disability_own_occ",
        "disability_any_occ",
        "ltc",
        "umbrella",
        "health",
      ],
      liability_type_enum: [
        "mortgage_primary",
        "mortgage_rental",
        "heloc",
        "student_loan",
        "auto_loan",
        "credit_card",
        "business_loan",
        "personal_loan",
      ],
      tax_wrapper_type: ["TAX_NOW", "TAX_LATER", "TAX_NEVER"],
      user_role: ["admin", "advisor", "user"],
    },
  },
} as const
