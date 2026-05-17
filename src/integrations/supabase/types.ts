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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      _mirror_config: {
        Row: {
          enabled: boolean
          endpoint: string
          id: number
        }
        Insert: {
          enabled?: boolean
          endpoint: string
          id?: number
        }
        Update: {
          enabled?: boolean
          endpoint?: string
          id?: number
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_date: string
          booking_time: string
          created_at: string
          id: string
          location: string | null
          notes: string | null
          phone: string | null
          service_id: string | null
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_date: string
          booking_time: string
          created_at?: string
          id?: string
          location?: string | null
          notes?: string | null
          phone?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_date?: string
          booking_time?: string
          created_at?: string
          id?: string
          location?: string | null
          notes?: string | null
          phone?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      certifications: {
        Row: {
          created_at: string
          description: string
          display_order: number
          icon_name: string
          id: string
          is_visible: boolean
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          display_order?: number
          icon_name?: string
          id?: string
          is_visible?: boolean
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          icon_name?: string
          id?: string
          is_visible?: boolean
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          area_type: string | null
          area_value: string | null
          assigned_to: string | null
          biz_area: string | null
          biz_cost: string | null
          country: string | null
          created_at: string
          crm_label: string | null
          crm_status: string | null
          distance: string | null
          email: string
          enquiry_type: string
          expected_close: string | null
          firstname: string | null
          id: string
          is_completed: boolean
          is_read: boolean | null
          latitude: string | null
          longitude: string | null
          mailing_city: string | null
          mailing_pincode: string | null
          mailing_state: string | null
          mailing_street: string | null
          message: string
          mobile_phone: string | null
          name: string
          num_scans: string | null
          phone: string | null
          primary_phone: string | null
          service: string | null
          service_needed: string | null
          whatsapp: string | null
        }
        Insert: {
          area_type?: string | null
          area_value?: string | null
          assigned_to?: string | null
          biz_area?: string | null
          biz_cost?: string | null
          country?: string | null
          created_at?: string
          crm_label?: string | null
          crm_status?: string | null
          distance?: string | null
          email: string
          enquiry_type?: string
          expected_close?: string | null
          firstname?: string | null
          id?: string
          is_completed?: boolean
          is_read?: boolean | null
          latitude?: string | null
          longitude?: string | null
          mailing_city?: string | null
          mailing_pincode?: string | null
          mailing_state?: string | null
          mailing_street?: string | null
          message: string
          mobile_phone?: string | null
          name: string
          num_scans?: string | null
          phone?: string | null
          primary_phone?: string | null
          service?: string | null
          service_needed?: string | null
          whatsapp?: string | null
        }
        Update: {
          area_type?: string | null
          area_value?: string | null
          assigned_to?: string | null
          biz_area?: string | null
          biz_cost?: string | null
          country?: string | null
          created_at?: string
          crm_label?: string | null
          crm_status?: string | null
          distance?: string | null
          email?: string
          enquiry_type?: string
          expected_close?: string | null
          firstname?: string | null
          id?: string
          is_completed?: boolean
          is_read?: boolean | null
          latitude?: string | null
          longitude?: string | null
          mailing_city?: string | null
          mailing_pincode?: string | null
          mailing_state?: string | null
          mailing_street?: string | null
          message?: string
          mobile_phone?: string | null
          name?: string
          num_scans?: string | null
          phone?: string | null
          primary_phone?: string | null
          service?: string | null
          service_needed?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      crm_activities: {
        Row: {
          activity_type: string
          assigned_to: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          deal_id: string | null
          description: string | null
          due_at: string | null
          duration_minutes: number | null
          id: string
          lead_id: string | null
          location: string | null
          meeting_url: string | null
          organization_id: string | null
          priority: string
          reminded: boolean
          reminder_minutes_before: number | null
          status: string
          subject: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          activity_type?: string
          assigned_to?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          due_at?: string | null
          duration_minutes?: number | null
          id?: string
          lead_id?: string | null
          location?: string | null
          meeting_url?: string | null
          organization_id?: string | null
          priority?: string
          reminded?: boolean
          reminder_minutes_before?: number | null
          status?: string
          subject: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          activity_type?: string
          assigned_to?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          due_at?: string | null
          duration_minutes?: number | null
          id?: string
          lead_id?: string | null
          location?: string | null
          meeting_url?: string | null
          organization_id?: string | null
          priority?: string
          reminded?: boolean
          reminder_minutes_before?: number | null
          status?: string
          subject?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "crm_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_ai_report_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          report_id: string
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          report_id: string
          role: string
          user_id: string
          workspace_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          report_id?: string
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_ai_report_assignments_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "crm_ai_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_ai_report_assignments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_ai_report_status_log: {
        Row: {
          by_user_id: string | null
          changed_at: string
          from_status: string | null
          id: string
          note: string | null
          report_id: string
          to_status: string
          workspace_id: string
        }
        Insert: {
          by_user_id?: string | null
          changed_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          report_id: string
          to_status: string
          workspace_id: string
        }
        Update: {
          by_user_id?: string | null
          changed_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          report_id?: string
          to_status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_ai_report_status_log_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "crm_ai_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_ai_report_status_log_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_ai_report_templates: {
        Row: {
          created_at: string
          created_by: string | null
          default_model: string
          description: string | null
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          output_schema: Json | null
          prompt_template: string
          template_type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          default_model?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          output_schema?: Json | null
          prompt_template: string
          template_type?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          default_model?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          output_schema?: Json | null
          prompt_template?: string
          template_type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_ai_report_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_ai_report_versions: {
        Row: {
          ai_model: string | null
          ai_prompt: string | null
          ai_response: Json | null
          created_at: string
          created_by: string | null
          edited_markdown: string | null
          id: string
          is_current: boolean
          photo_paths: Json | null
          rendered_markdown: string | null
          report_id: string
          user_inputs: Json | null
          version_no: number
          workspace_id: string
        }
        Insert: {
          ai_model?: string | null
          ai_prompt?: string | null
          ai_response?: Json | null
          created_at?: string
          created_by?: string | null
          edited_markdown?: string | null
          id?: string
          is_current?: boolean
          photo_paths?: Json | null
          rendered_markdown?: string | null
          report_id: string
          user_inputs?: Json | null
          version_no: number
          workspace_id: string
        }
        Update: {
          ai_model?: string | null
          ai_prompt?: string | null
          ai_response?: Json | null
          created_at?: string
          created_by?: string | null
          edited_markdown?: string | null
          id?: string
          is_current?: boolean
          photo_paths?: Json | null
          rendered_markdown?: string | null
          report_id?: string
          user_inputs?: Json | null
          version_no?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_ai_report_versions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "crm_ai_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_ai_report_versions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_ai_reports: {
        Row: {
          acknowledged_at: string | null
          created_at: string
          created_by: string | null
          current_version: number
          customer_contact_id: string | null
          customer_org_id: string | null
          description: string | null
          id: string
          primary_owner_user_id: string | null
          rejection_reason: string | null
          related_to_id: string | null
          related_to_type: string | null
          sent_to_customer_at: string | null
          status: string
          template_id: string | null
          template_type: string | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string
          created_by?: string | null
          current_version?: number
          customer_contact_id?: string | null
          customer_org_id?: string | null
          description?: string | null
          id?: string
          primary_owner_user_id?: string | null
          rejection_reason?: string | null
          related_to_id?: string | null
          related_to_type?: string | null
          sent_to_customer_at?: string | null
          status?: string
          template_id?: string | null
          template_type?: string | null
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string
          created_by?: string | null
          current_version?: number
          customer_contact_id?: string | null
          customer_org_id?: string | null
          description?: string | null
          id?: string
          primary_owner_user_id?: string | null
          rejection_reason?: string | null
          related_to_id?: string | null
          related_to_type?: string | null
          sent_to_customer_at?: string | null
          status?: string
          template_id?: string | null
          template_type?: string | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_ai_reports_customer_contact_id_fkey"
            columns: ["customer_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_ai_reports_customer_org_id_fkey"
            columns: ["customer_org_id"]
            isOneToOne: false
            referencedRelation: "crm_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_ai_reports_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "crm_ai_report_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_ai_reports_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_approval_requests: {
        Row: {
          amount: number | null
          approver_role: string | null
          approver_user_id: string | null
          created_at: string
          currency: string | null
          decided_at: string | null
          decided_by: string | null
          decision_note: string | null
          description: string | null
          due_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          request_type: string
          requested_by: string
          status: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          amount?: number | null
          approver_role?: string | null
          approver_user_id?: string | null
          created_at?: string
          currency?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          description?: string | null
          due_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          request_type: string
          requested_by: string
          status?: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          amount?: number | null
          approver_role?: string | null
          approver_user_id?: string | null
          created_at?: string
          currency?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          description?: string | null
          due_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          request_type?: string
          requested_by?: string
          status?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_approval_requests_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          changes: Json | null
          created_at: string
          entity_id: string | null
          entity_label: string | null
          entity_type: string
          id: string
          metadata: Json | null
          workspace_id: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_label?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          workspace_id?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_label?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_audit_log_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_campaign_members: {
        Row: {
          campaign_id: string
          clicked_at: string | null
          contact_id: string | null
          created_at: string
          email: string | null
          id: string
          lead_id: string | null
          opened_at: string | null
          phone: string | null
          sent_at: string | null
          status: string
          workspace_id: string
        }
        Insert: {
          campaign_id: string
          clicked_at?: string | null
          contact_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          lead_id?: string | null
          opened_at?: string | null
          phone?: string | null
          sent_at?: string | null
          status?: string
          workspace_id: string
        }
        Update: {
          campaign_id?: string
          clicked_at?: string | null
          contact_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          lead_id?: string | null
          opened_at?: string | null
          phone?: string | null
          sent_at?: string | null
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_campaign_members_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "crm_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_campaign_members_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_campaign_members_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_campaign_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_campaigns: {
        Row: {
          actual_revenue: number | null
          audience_filter: Json | null
          budget: number | null
          channel: string
          completed_at: string | null
          cost: number | null
          created_at: string
          created_by: string | null
          description: string | null
          email_template_id: string | null
          expected_revenue: number | null
          id: string
          name: string
          scheduled_at: string | null
          started_at: string | null
          status: string
          total_bounces: number | null
          total_clicks: number | null
          total_leads_generated: number | null
          total_opens: number | null
          total_recipients: number | null
          total_sent: number | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          actual_revenue?: number | null
          audience_filter?: Json | null
          budget?: number | null
          channel?: string
          completed_at?: string | null
          cost?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          email_template_id?: string | null
          expected_revenue?: number | null
          id?: string
          name: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          total_bounces?: number | null
          total_clicks?: number | null
          total_leads_generated?: number | null
          total_opens?: number | null
          total_recipients?: number | null
          total_sent?: number | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          actual_revenue?: number | null
          audience_filter?: Json | null
          budget?: number | null
          channel?: string
          completed_at?: string | null
          cost?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          email_template_id?: string | null
          expected_revenue?: number | null
          id?: string
          name?: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          total_bounces?: number | null
          total_clicks?: number | null
          total_leads_generated?: number | null
          total_opens?: number | null
          total_recipients?: number | null
          total_sent?: number | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_campaigns_email_template_id_fkey"
            columns: ["email_template_id"]
            isOneToOne: false
            referencedRelation: "crm_email_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_campaigns_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_commission_rules: {
        Row: {
          applies_to: string
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          effective_from: string
          effective_to: string | null
          flat_percentage: number
          id: string
          is_active: boolean
          min_deal_value: number
          name: string
          priority: number
          rule_type: string
          tiers: Json | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          applies_to?: string
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          effective_from?: string
          effective_to?: string | null
          flat_percentage?: number
          id?: string
          is_active?: boolean
          min_deal_value?: number
          name: string
          priority?: number
          rule_type?: string
          tiers?: Json | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          applies_to?: string
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          effective_from?: string
          effective_to?: string | null
          flat_percentage?: number
          id?: string
          is_active?: boolean
          min_deal_value?: number
          name?: string
          priority?: number
          rule_type?: string
          tiers?: Json | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      crm_commissions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          base_amount: number
          commission_amount: number
          created_at: string
          currency: string
          deal_id: string | null
          earned_date: string
          id: string
          invoice_id: string | null
          notes: string | null
          paid_at: string | null
          payout_reference: string | null
          percentage: number
          rule_id: string | null
          source_type: string
          status: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          base_amount?: number
          commission_amount?: number
          created_at?: string
          currency?: string
          deal_id?: string | null
          earned_date?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          paid_at?: string | null
          payout_reference?: string | null
          percentage?: number
          rule_id?: string | null
          source_type?: string
          status?: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          base_amount?: number
          commission_amount?: number
          created_at?: string
          currency?: string
          deal_id?: string | null
          earned_date?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          paid_at?: string | null
          payout_reference?: string | null
          percentage?: number
          rule_id?: string | null
          source_type?: string
          status?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      crm_contacts: {
        Row: {
          city: string | null
          created_at: string
          created_by: string | null
          email: string | null
          full_name: string
          id: string
          notes: string | null
          organization_id: string | null
          phone: string | null
          state: string | null
          title: string | null
          updated_at: string
          whatsapp: string | null
          workspace_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          state?: string | null
          title?: string | null
          updated_at?: string
          whatsapp?: string | null
          workspace_id: string
        }
        Update: {
          city?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          state?: string | null
          title?: string | null
          updated_at?: string
          whatsapp?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "crm_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contract_renewals: {
        Row: {
          contract_id: string
          created_at: string
          id: string
          new_end_date: string
          new_start_date: string
          new_value: number | null
          notes: string | null
          previous_end_date: string | null
          renewed_at: string | null
          renewed_by: string | null
          status: string
          workspace_id: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          id?: string
          new_end_date: string
          new_start_date: string
          new_value?: number | null
          notes?: string | null
          previous_end_date?: string | null
          renewed_at?: string | null
          renewed_by?: string | null
          status?: string
          workspace_id: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          id?: string
          new_end_date?: string
          new_start_date?: string
          new_value?: number | null
          notes?: string | null
          previous_end_date?: string | null
          renewed_at?: string | null
          renewed_by?: string | null
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_contract_renewals_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "crm_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contract_renewals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contracts: {
        Row: {
          auto_renew: boolean
          billing_frequency: string | null
          cancelled_at: string | null
          cancelled_reason: string | null
          contact_id: string | null
          contract_number: string
          contract_type: string
          contract_value: number
          created_at: string
          created_by: string | null
          currency: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          deal_id: string | null
          document_url: string | null
          end_date: string
          id: string
          notes: string | null
          notice_period_days: number | null
          organization_id: string | null
          owner_id: string | null
          payment_terms: string | null
          renewal_date: string | null
          renewal_period_months: number | null
          scope_of_work: string | null
          service_level: string | null
          signed_by_company_at: string | null
          signed_by_customer_at: string | null
          start_date: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          visits_completed: number | null
          visits_per_year: number | null
          workspace_id: string
        }
        Insert: {
          auto_renew?: boolean
          billing_frequency?: string | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          contact_id?: string | null
          contract_number: string
          contract_type?: string
          contract_value?: number
          created_at?: string
          created_by?: string | null
          currency?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          deal_id?: string | null
          document_url?: string | null
          end_date: string
          id?: string
          notes?: string | null
          notice_period_days?: number | null
          organization_id?: string | null
          owner_id?: string | null
          payment_terms?: string | null
          renewal_date?: string | null
          renewal_period_months?: number | null
          scope_of_work?: string | null
          service_level?: string | null
          signed_by_company_at?: string | null
          signed_by_customer_at?: string | null
          start_date: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          visits_completed?: number | null
          visits_per_year?: number | null
          workspace_id: string
        }
        Update: {
          auto_renew?: boolean
          billing_frequency?: string | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          contact_id?: string | null
          contract_number?: string
          contract_type?: string
          contract_value?: number
          created_at?: string
          created_by?: string | null
          currency?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          deal_id?: string | null
          document_url?: string | null
          end_date?: string
          id?: string
          notes?: string | null
          notice_period_days?: number | null
          organization_id?: string | null
          owner_id?: string | null
          payment_terms?: string | null
          renewal_date?: string | null
          renewal_period_months?: number | null
          scope_of_work?: string | null
          service_level?: string | null
          signed_by_company_at?: string | null
          signed_by_customer_at?: string | null
          start_date?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          visits_completed?: number | null
          visits_per_year?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_contracts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contracts_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contracts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "crm_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contracts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_copilot_conversations: {
        Row: {
          created_at: string
          id: string
          messages: Json
          title: string | null
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          title?: string | null
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          title?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_copilot_conversations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deals: {
        Row: {
          amount: number
          contact_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          expected_close: string | null
          id: string
          lead_id: string | null
          organization_id: string | null
          owner_id: string | null
          position: number
          probability: number
          stage: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          amount?: number
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          expected_close?: string | null
          id?: string
          lead_id?: string | null
          organization_id?: string | null
          owner_id?: string | null
          position?: number
          probability?: number
          stage?: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          amount?: number
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          expected_close?: string | null
          id?: string
          lead_id?: string | null
          organization_id?: string | null
          owner_id?: string | null
          position?: number
          probability?: number
          stage?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "crm_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_dedupe_merges: {
        Row: {
          created_at: string
          entity_type: string
          id: string
          merged_id: string
          merged_snapshot: Json | null
          performed_by: string | null
          primary_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          entity_type: string
          id?: string
          merged_id: string
          merged_snapshot?: Json | null
          performed_by?: string | null
          primary_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          entity_type?: string
          id?: string
          merged_id?: string
          merged_snapshot?: Json | null
          performed_by?: string | null
          primary_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_dedupe_merges_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_documents: {
        Row: {
          contact_id: string | null
          created_at: string
          deal_id: string | null
          description: string | null
          file_path: string
          file_size: number | null
          id: string
          is_shared: boolean
          lead_id: string | null
          mime_type: string | null
          name: string
          organization_id: string | null
          parent_document_id: string | null
          share_token: string | null
          ticket_id: string | null
          updated_at: string
          uploaded_by: string | null
          version: number
          workspace_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          is_shared?: boolean
          lead_id?: string | null
          mime_type?: string | null
          name: string
          organization_id?: string | null
          parent_document_id?: string | null
          share_token?: string | null
          ticket_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
          version?: number
          workspace_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          is_shared?: boolean
          lead_id?: string | null
          mime_type?: string | null
          name?: string
          organization_id?: string | null
          parent_document_id?: string | null
          share_token?: string | null
          ticket_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_documents_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_documents_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "crm_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_documents_parent_document_id_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "crm_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_documents_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "crm_support_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_documents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_email_templates: {
        Row: {
          body_html: string
          body_text: string | null
          category: string | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          subject: string
          updated_at: string
          variables: Json | null
          workspace_id: string
        }
        Insert: {
          body_html: string
          body_text?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          subject: string
          updated_at?: string
          variables?: Json | null
          workspace_id: string
        }
        Update: {
          body_html?: string
          body_text?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          subject?: string
          updated_at?: string
          variables?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_email_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          category: string
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          expense_date: string
          expense_number: string | null
          field_visit_id: string | null
          id: string
          payment_method: string
          project_id: string | null
          purchase_order_id: string | null
          receipt_path: string | null
          reimbursable: boolean
          reimbursed_at: string | null
          rejection_reason: string | null
          status: string
          submitted_at: string | null
          submitted_by: string | null
          tax_amount: number
          title: string
          updated_at: string
          vendor_id: string | null
          vendor_name: string | null
          workspace_id: string
        }
        Insert: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          expense_date?: string
          expense_number?: string | null
          field_visit_id?: string | null
          id?: string
          payment_method?: string
          project_id?: string | null
          purchase_order_id?: string | null
          receipt_path?: string | null
          reimbursable?: boolean
          reimbursed_at?: string | null
          rejection_reason?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          tax_amount?: number
          title: string
          updated_at?: string
          vendor_id?: string | null
          vendor_name?: string | null
          workspace_id: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          expense_date?: string
          expense_number?: string | null
          field_visit_id?: string | null
          id?: string
          payment_method?: string
          project_id?: string | null
          purchase_order_id?: string | null
          receipt_path?: string | null
          reimbursable?: boolean
          reimbursed_at?: string | null
          rejection_reason?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          tax_amount?: number
          title?: string
          updated_at?: string
          vendor_id?: string | null
          vendor_name?: string | null
          workspace_id?: string
        }
        Relationships: []
      }
      crm_feedback_surveys: {
        Row: {
          category: string | null
          comment: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          expires_at: string | null
          field_visit_id: string | null
          follow_up_done: boolean
          follow_up_notes: string | null
          follow_up_required: boolean
          id: string
          invoice_id: string | null
          organization_id: string | null
          question: string
          responded_at: string | null
          score: number | null
          sent_at: string
          status: string
          survey_type: string
          ticket_id: string | null
          token: string
          trigger_source: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          category?: string | null
          comment?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          expires_at?: string | null
          field_visit_id?: string | null
          follow_up_done?: boolean
          follow_up_notes?: string | null
          follow_up_required?: boolean
          id?: string
          invoice_id?: string | null
          organization_id?: string | null
          question?: string
          responded_at?: string | null
          score?: number | null
          sent_at?: string
          status?: string
          survey_type?: string
          ticket_id?: string | null
          token?: string
          trigger_source?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          category?: string | null
          comment?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          expires_at?: string | null
          field_visit_id?: string | null
          follow_up_done?: boolean
          follow_up_notes?: string | null
          follow_up_required?: boolean
          id?: string
          invoice_id?: string | null
          organization_id?: string | null
          question?: string
          responded_at?: string | null
          score?: number | null
          sent_at?: string
          status?: string
          survey_type?: string
          ticket_id?: string | null
          token?: string
          trigger_source?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      crm_field_visits: {
        Row: {
          assigned_to: string | null
          checkin_at: string | null
          checkin_lat: number | null
          checkin_lng: number | null
          checkout_at: string | null
          checkout_lat: number | null
          checkout_lng: number | null
          client_uuid: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_rating: number | null
          findings: string | null
          hydrogeo_id: string | null
          id: string
          lead_id: string | null
          next_action: string | null
          organization_id: string | null
          photo_paths: Json | null
          recommendations: string | null
          scheduled_at: string | null
          signature_path: string | null
          site_address: string | null
          site_city: string | null
          site_state: string | null
          status: string
          synced_offline: boolean
          ticket_id: string | null
          title: string
          updated_at: string
          visit_number: string | null
          visit_type: string
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          checkin_at?: string | null
          checkin_lat?: number | null
          checkin_lng?: number | null
          checkout_at?: string | null
          checkout_lat?: number | null
          checkout_lng?: number | null
          client_uuid?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_rating?: number | null
          findings?: string | null
          hydrogeo_id?: string | null
          id?: string
          lead_id?: string | null
          next_action?: string | null
          organization_id?: string | null
          photo_paths?: Json | null
          recommendations?: string | null
          scheduled_at?: string | null
          signature_path?: string | null
          site_address?: string | null
          site_city?: string | null
          site_state?: string | null
          status?: string
          synced_offline?: boolean
          ticket_id?: string | null
          title: string
          updated_at?: string
          visit_number?: string | null
          visit_type?: string
          workspace_id: string
        }
        Update: {
          assigned_to?: string | null
          checkin_at?: string | null
          checkin_lat?: number | null
          checkin_lng?: number | null
          checkout_at?: string | null
          checkout_lat?: number | null
          checkout_lng?: number | null
          client_uuid?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_rating?: number | null
          findings?: string | null
          hydrogeo_id?: string | null
          id?: string
          lead_id?: string | null
          next_action?: string | null
          organization_id?: string | null
          photo_paths?: Json | null
          recommendations?: string | null
          scheduled_at?: string | null
          signature_path?: string | null
          site_address?: string | null
          site_city?: string | null
          site_state?: string | null
          status?: string
          synced_offline?: boolean
          ticket_id?: string | null
          title?: string
          updated_at?: string
          visit_number?: string | null
          visit_type?: string
          workspace_id?: string
        }
        Relationships: []
      }
      crm_hydrogeo_enquiries: {
        Row: {
          area_size: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          estimated_cost: number | null
          expected_depth_ft: number | null
          id: string
          latitude: number | null
          lead_id: string | null
          longitude: number | null
          notes: string | null
          num_scans: number | null
          preferred_visit_date: string | null
          recommendation: string | null
          site_address: string | null
          site_city: string | null
          site_name: string | null
          site_pincode: string | null
          site_state: string | null
          soil_type: string | null
          source_enquiry_id: string | null
          survey_findings: string | null
          survey_status: string
          terrain_type: string | null
          updated_at: string
          water_source_type: string | null
          workspace_id: string
        }
        Insert: {
          area_size?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          estimated_cost?: number | null
          expected_depth_ft?: number | null
          id?: string
          latitude?: number | null
          lead_id?: string | null
          longitude?: number | null
          notes?: string | null
          num_scans?: number | null
          preferred_visit_date?: string | null
          recommendation?: string | null
          site_address?: string | null
          site_city?: string | null
          site_name?: string | null
          site_pincode?: string | null
          site_state?: string | null
          soil_type?: string | null
          source_enquiry_id?: string | null
          survey_findings?: string | null
          survey_status?: string
          terrain_type?: string | null
          updated_at?: string
          water_source_type?: string | null
          workspace_id: string
        }
        Update: {
          area_size?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          estimated_cost?: number | null
          expected_depth_ft?: number | null
          id?: string
          latitude?: number | null
          lead_id?: string | null
          longitude?: number | null
          notes?: string | null
          num_scans?: number | null
          preferred_visit_date?: string | null
          recommendation?: string | null
          site_address?: string | null
          site_city?: string | null
          site_name?: string | null
          site_pincode?: string | null
          site_state?: string | null
          soil_type?: string | null
          source_enquiry_id?: string | null
          survey_findings?: string | null
          survey_status?: string
          terrain_type?: string | null
          updated_at?: string
          water_source_type?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_hydrogeo_enquiries_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_hydrogeo_enquiries_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_hydrogeo_enquiries_source_enquiry_id_fkey"
            columns: ["source_enquiry_id"]
            isOneToOne: false
            referencedRelation: "contact_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_hydrogeo_enquiries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_import_jobs: {
        Row: {
          created_at: string
          created_by: string | null
          entity_type: string
          errors: Json | null
          failed_rows: number
          field_mapping: Json | null
          file_name: string | null
          id: string
          status: string
          success_rows: number
          total_rows: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          entity_type: string
          errors?: Json | null
          failed_rows?: number
          field_mapping?: Json | null
          file_name?: string | null
          id?: string
          status?: string
          success_rows?: number
          total_rows?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entity_type?: string
          errors?: Json | null
          failed_rows?: number
          field_mapping?: Json | null
          file_name?: string | null
          id?: string
          status?: string
          success_rows?: number
          total_rows?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_import_jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_invoice_items: {
        Row: {
          amount: number
          created_at: string
          description: string
          hsn_sac: string | null
          id: string
          invoice_id: string
          position: number
          quantity: number
          rate: number
          tax_rate: number
          unit: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          description: string
          hsn_sac?: string | null
          id?: string
          invoice_id: string
          position?: number
          quantity?: number
          rate?: number
          tax_rate?: number
          unit?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          hsn_sac?: string | null
          id?: string
          invoice_id?: string
          position?: number
          quantity?: number
          rate?: number
          tax_rate?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "crm_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_invoices: {
        Row: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          cgst: number
          contact_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          customer_address: string | null
          customer_email: string | null
          customer_gstin: string | null
          customer_name: string
          customer_phone: string | null
          customer_state: string | null
          deal_id: string | null
          discount: number
          due_date: string | null
          gst_type: string
          id: string
          igst: number
          invoice_number: string
          issue_date: string
          lead_id: string | null
          notes: string | null
          organization_id: string | null
          paid_amount: number
          quotation_id: string | null
          rejection_reason: string | null
          sgst: number
          status: string
          submitted_at: string | null
          subtotal: number
          terms: string | null
          total: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          cgst?: number
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_gstin?: string | null
          customer_name: string
          customer_phone?: string | null
          customer_state?: string | null
          deal_id?: string | null
          discount?: number
          due_date?: string | null
          gst_type?: string
          id?: string
          igst?: number
          invoice_number: string
          issue_date?: string
          lead_id?: string | null
          notes?: string | null
          organization_id?: string | null
          paid_amount?: number
          quotation_id?: string | null
          rejection_reason?: string | null
          sgst?: number
          status?: string
          submitted_at?: string | null
          subtotal?: number
          terms?: string | null
          total?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          cgst?: number
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_gstin?: string | null
          customer_name?: string
          customer_phone?: string | null
          customer_state?: string | null
          deal_id?: string | null
          discount?: number
          due_date?: string | null
          gst_type?: string
          id?: string
          igst?: number
          invoice_number?: string
          issue_date?: string
          lead_id?: string | null
          notes?: string | null
          organization_id?: string | null
          paid_amount?: number
          quotation_id?: string | null
          rejection_reason?: string | null
          sgst?: number
          status?: string
          submitted_at?: string | null
          subtotal?: number
          terms?: string | null
          total?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_invoices_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_invoices_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_invoices_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "crm_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_invoices_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "crm_quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_invoices_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_lead_activities: {
        Row: {
          activity_type: string
          actor_id: string | null
          content: string | null
          created_at: string
          id: string
          lead_id: string
          metadata: Json | null
          workspace_id: string
        }
        Insert: {
          activity_type: string
          actor_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          lead_id: string
          metadata?: Json | null
          workspace_id: string
        }
        Update: {
          activity_type?: string
          actor_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          metadata?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_lead_activities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_lead_scoring_history: {
        Row: {
          ai_score: number | null
          computed_at: string
          final_score: number | null
          id: string
          lead_id: string
          reasoning: string | null
          rule_score: number | null
          workspace_id: string
        }
        Insert: {
          ai_score?: number | null
          computed_at?: string
          final_score?: number | null
          id?: string
          lead_id: string
          reasoning?: string | null
          rule_score?: number | null
          workspace_id: string
        }
        Update: {
          ai_score?: number | null
          computed_at?: string
          final_score?: number | null
          id?: string
          lead_id?: string
          reasoning?: string | null
          rule_score?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_lead_scoring_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_lead_scoring_history_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          ai_hot_score: number | null
          assigned_to: string | null
          biz_area: string | null
          biz_cost: number | null
          campaign_id: string | null
          city: string | null
          country: string | null
          created_at: string
          created_by: string | null
          email: string | null
          expected_close: string | null
          full_name: string
          id: string
          latitude: number | null
          lead_source: string | null
          longitude: number | null
          notes: string | null
          phone: string | null
          pincode: string | null
          score_reasoning: string | null
          score_updated_at: string | null
          service_needed: string | null
          source_enquiry_id: string | null
          stage: string
          state: string | null
          status: string
          street: string | null
          updated_at: string
          web_form_id: string | null
          whatsapp: string | null
          workspace_id: string
        }
        Insert: {
          ai_hot_score?: number | null
          assigned_to?: string | null
          biz_area?: string | null
          biz_cost?: number | null
          campaign_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          expected_close?: string | null
          full_name: string
          id?: string
          latitude?: number | null
          lead_source?: string | null
          longitude?: number | null
          notes?: string | null
          phone?: string | null
          pincode?: string | null
          score_reasoning?: string | null
          score_updated_at?: string | null
          service_needed?: string | null
          source_enquiry_id?: string | null
          stage?: string
          state?: string | null
          status?: string
          street?: string | null
          updated_at?: string
          web_form_id?: string | null
          whatsapp?: string | null
          workspace_id: string
        }
        Update: {
          ai_hot_score?: number | null
          assigned_to?: string | null
          biz_area?: string | null
          biz_cost?: number | null
          campaign_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          expected_close?: string | null
          full_name?: string
          id?: string
          latitude?: number | null
          lead_source?: string | null
          longitude?: number | null
          notes?: string | null
          phone?: string | null
          pincode?: string | null
          score_reasoning?: string | null
          score_updated_at?: string | null
          service_needed?: string | null
          source_enquiry_id?: string | null
          stage?: string
          state?: string | null
          status?: string
          street?: string | null
          updated_at?: string
          web_form_id?: string | null
          whatsapp?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "crm_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_source_enquiry_id_fkey"
            columns: ["source_enquiry_id"]
            isOneToOne: false
            referencedRelation: "contact_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_web_form_id_fkey"
            columns: ["web_form_id"]
            isOneToOne: false
            referencedRelation: "crm_web_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_meeting_summaries: {
        Row: {
          action_items: Json | null
          activity_id: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          deal_id: string | null
          error_message: string | null
          follow_ups: Json | null
          id: string
          lead_id: string | null
          meeting_date: string | null
          participants: Json | null
          source_audio_path: string | null
          source_type: string
          status: string
          summary: string | null
          title: string
          transcript: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          action_items?: Json | null
          activity_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          error_message?: string | null
          follow_ups?: Json | null
          id?: string
          lead_id?: string | null
          meeting_date?: string | null
          participants?: Json | null
          source_audio_path?: string | null
          source_type?: string
          status?: string
          summary?: string | null
          title: string
          transcript?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          action_items?: Json | null
          activity_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          error_message?: string | null
          follow_ups?: Json | null
          id?: string
          lead_id?: string | null
          meeting_date?: string | null
          participants?: Json | null
          source_audio_path?: string | null
          source_type?: string
          status?: string
          summary?: string | null
          title?: string
          transcript?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_meeting_summaries_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "crm_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_meeting_summaries_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_meeting_summaries_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_meeting_summaries_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_meeting_summaries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_message_templates: {
        Row: {
          body: string
          category: string | null
          channel: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          language: string | null
          name: string
          updated_at: string
          variables: string[] | null
          workspace_id: string
        }
        Insert: {
          body: string
          category?: string | null
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          language?: string | null
          name: string
          updated_at?: string
          variables?: string[] | null
          workspace_id: string
        }
        Update: {
          body?: string
          category?: string | null
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          language?: string | null
          name?: string
          updated_at?: string
          variables?: string[] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_message_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_messages: {
        Row: {
          body: string
          channel: string
          contact_id: string | null
          created_at: string
          deal_id: string | null
          delivered_at: string | null
          direction: string
          error_message: string | null
          id: string
          lead_id: string | null
          provider: string | null
          provider_message_id: string | null
          read_at: string | null
          recipient_name: string | null
          recipient_phone: string
          related_entity_id: string | null
          related_entity_type: string | null
          sent_at: string | null
          sent_by: string | null
          status: string
          template_id: string | null
          ticket_id: string | null
          workspace_id: string
        }
        Insert: {
          body: string
          channel?: string
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          delivered_at?: string | null
          direction?: string
          error_message?: string | null
          id?: string
          lead_id?: string | null
          provider?: string | null
          provider_message_id?: string | null
          read_at?: string | null
          recipient_name?: string | null
          recipient_phone: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          template_id?: string | null
          ticket_id?: string | null
          workspace_id: string
        }
        Update: {
          body?: string
          channel?: string
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          delivered_at?: string | null
          direction?: string
          error_message?: string | null
          id?: string
          lead_id?: string | null
          provider?: string | null
          provider_message_id?: string | null
          read_at?: string | null
          recipient_name?: string | null
          recipient_phone?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          template_id?: string | null
          ticket_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_messages_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_messages_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "crm_message_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "crm_support_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_notification_preferences: {
        Row: {
          created_at: string
          digest_frequency: string
          email_enabled: boolean
          id: string
          in_app_enabled: boolean
          muted_types: string[]
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          digest_frequency?: string
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          muted_types?: string[]
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          digest_frequency?: string
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          muted_types?: string[]
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_notification_preferences_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          read_at: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          title: string
          type: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title: string
          type?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title?: string
          type?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_notifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_organizations: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          industry: string | null
          name: string
          notes: string | null
          phone: string | null
          pincode: string | null
          state: string | null
          street: string | null
          updated_at: string
          website: string | null
          workspace_id: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          street?: string | null
          updated_at?: string
          website?: string | null
          workspace_id: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          street?: string | null
          updated_at?: string
          website?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_organizations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          method: string
          notes: string | null
          paid_at: string
          recorded_by: string | null
          reference: string | null
          workspace_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          method?: string
          notes?: string | null
          paid_at?: string
          recorded_by?: string | null
          reference?: string | null
          workspace_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          method?: string
          notes?: string | null
          paid_at?: string
          recorded_by?: string | null
          reference?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "crm_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_payments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_ping_history: {
        Row: {
          crm_label: string | null
          crm_url: string
          error_message: string | null
          id: string
          pinged_at: string
          response_time_ms: number | null
          state_key: string
          status: string
          status_code: number | null
        }
        Insert: {
          crm_label?: string | null
          crm_url: string
          error_message?: string | null
          id?: string
          pinged_at?: string
          response_time_ms?: number | null
          state_key: string
          status?: string
          status_code?: number | null
        }
        Update: {
          crm_label?: string | null
          crm_url?: string
          error_message?: string | null
          id?: string
          pinged_at?: string
          response_time_ms?: number | null
          state_key?: string
          status?: string
          status_code?: number | null
        }
        Relationships: []
      }
      crm_portal_tokens: {
        Row: {
          contact_id: string | null
          created_at: string
          created_by: string | null
          customer_email: string | null
          customer_name: string | null
          entity_id: string | null
          entity_type: string | null
          expires_at: string | null
          id: string
          last_viewed_at: string | null
          organization_id: string | null
          revoked_at: string | null
          scope: string
          token: string
          view_count: number
          workspace_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_name?: string | null
          entity_id?: string | null
          entity_type?: string | null
          expires_at?: string | null
          id?: string
          last_viewed_at?: string | null
          organization_id?: string | null
          revoked_at?: string | null
          scope?: string
          token: string
          view_count?: number
          workspace_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_name?: string | null
          entity_id?: string | null
          entity_type?: string | null
          expires_at?: string | null
          id?: string
          last_viewed_at?: string | null
          organization_id?: string | null
          revoked_at?: string | null
          scope?: string
          token?: string
          view_count?: number
          workspace_id?: string
        }
        Relationships: []
      }
      crm_products: {
        Row: {
          category: string | null
          cost_price: number
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          hsn_sac: string | null
          id: string
          is_active: boolean
          name: string
          product_type: string
          reorder_level: number
          sku: string | null
          stock_quantity: number
          tax_rate: number
          unit: string | null
          unit_price: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          category?: string | null
          cost_price?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          hsn_sac?: string | null
          id?: string
          is_active?: boolean
          name: string
          product_type?: string
          reorder_level?: number
          sku?: string | null
          stock_quantity?: number
          tax_rate?: number
          unit?: string | null
          unit_price?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          category?: string | null
          cost_price?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          hsn_sac?: string | null
          id?: string
          is_active?: boolean
          name?: string
          product_type?: string
          reorder_level?: number
          sku?: string | null
          stock_quantity?: number
          tax_rate?: number
          unit?: string | null
          unit_price?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_products_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_purchase_order_items: {
        Row: {
          amount: number
          created_at: string
          description: string
          hsn_sac: string | null
          id: string
          position: number
          product_id: string | null
          purchase_order_id: string
          quantity: number
          rate: number
          tax_rate: number
          unit: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          description: string
          hsn_sac?: string | null
          id?: string
          position?: number
          product_id?: string | null
          purchase_order_id: string
          quantity?: number
          rate?: number
          tax_rate?: number
          unit?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          hsn_sac?: string | null
          id?: string
          position?: number
          product_id?: string | null
          purchase_order_id?: string
          quantity?: number
          rate?: number
          tax_rate?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "crm_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "crm_purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_purchase_orders: {
        Row: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          cgst: number
          created_at: string
          created_by: string | null
          currency: string
          discount: number
          expected_delivery: string | null
          gst_type: string
          id: string
          igst: number
          notes: string | null
          order_date: string
          po_number: string
          sgst: number
          status: string
          subtotal: number
          terms: string | null
          total: number
          updated_at: string
          vendor_address: string | null
          vendor_email: string | null
          vendor_gstin: string | null
          vendor_id: string | null
          vendor_name: string
          vendor_phone: string | null
          workspace_id: string
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          cgst?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          discount?: number
          expected_delivery?: string | null
          gst_type?: string
          id?: string
          igst?: number
          notes?: string | null
          order_date?: string
          po_number: string
          sgst?: number
          status?: string
          subtotal?: number
          terms?: string | null
          total?: number
          updated_at?: string
          vendor_address?: string | null
          vendor_email?: string | null
          vendor_gstin?: string | null
          vendor_id?: string | null
          vendor_name: string
          vendor_phone?: string | null
          workspace_id: string
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          cgst?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          discount?: number
          expected_delivery?: string | null
          gst_type?: string
          id?: string
          igst?: number
          notes?: string | null
          order_date?: string
          po_number?: string
          sgst?: number
          status?: string
          subtotal?: number
          terms?: string | null
          total?: number
          updated_at?: string
          vendor_address?: string | null
          vendor_email?: string | null
          vendor_gstin?: string | null
          vendor_id?: string | null
          vendor_name?: string
          vendor_phone?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_purchase_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "crm_vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_purchase_orders_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_quotation_items: {
        Row: {
          amount: number
          created_at: string
          description: string
          hsn_sac: string | null
          id: string
          position: number
          quantity: number
          quotation_id: string
          rate: number
          tax_rate: number
          unit: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          description: string
          hsn_sac?: string | null
          id?: string
          position?: number
          quantity?: number
          quotation_id: string
          rate?: number
          tax_rate?: number
          unit?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          hsn_sac?: string | null
          id?: string
          position?: number
          quantity?: number
          quotation_id?: string
          rate?: number
          tax_rate?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "crm_quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_quotation_signatures: {
        Row: {
          id: string
          ip_address: string | null
          quotation_id: string
          signature_data_url: string
          signed_at: string
          signer_company: string | null
          signer_email: string | null
          signer_name: string
          token: string | null
          user_agent: string | null
          workspace_id: string
        }
        Insert: {
          id?: string
          ip_address?: string | null
          quotation_id: string
          signature_data_url: string
          signed_at?: string
          signer_company?: string | null
          signer_email?: string | null
          signer_name: string
          token?: string | null
          user_agent?: string | null
          workspace_id: string
        }
        Update: {
          id?: string
          ip_address?: string | null
          quotation_id?: string
          signature_data_url?: string
          signed_at?: string
          signer_company?: string | null
          signer_email?: string | null
          signer_name?: string
          token?: string | null
          user_agent?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_quotation_signatures_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "crm_quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_quotation_signatures_token_fkey"
            columns: ["token"]
            isOneToOne: false
            referencedRelation: "crm_signing_tokens"
            referencedColumns: ["token"]
          },
          {
            foreignKeyName: "crm_quotation_signatures_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_quotations: {
        Row: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          cgst: number
          contact_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          customer_address: string | null
          customer_email: string | null
          customer_gstin: string | null
          customer_name: string
          customer_phone: string | null
          customer_state: string | null
          deal_id: string | null
          discount: number
          gst_type: string
          id: string
          igst: number
          lead_id: string | null
          notes: string | null
          organization_id: string | null
          quotation_number: string
          rejection_reason: string | null
          sgst: number
          status: string
          submitted_at: string | null
          subtotal: number
          terms: string | null
          total: number
          updated_at: string
          valid_until: string | null
          workspace_id: string
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          cgst?: number
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_gstin?: string | null
          customer_name: string
          customer_phone?: string | null
          customer_state?: string | null
          deal_id?: string | null
          discount?: number
          gst_type?: string
          id?: string
          igst?: number
          lead_id?: string | null
          notes?: string | null
          organization_id?: string | null
          quotation_number: string
          rejection_reason?: string | null
          sgst?: number
          status?: string
          submitted_at?: string | null
          subtotal?: number
          terms?: string | null
          total?: number
          updated_at?: string
          valid_until?: string | null
          workspace_id: string
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          cgst?: number
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_gstin?: string | null
          customer_name?: string
          customer_phone?: string | null
          customer_state?: string | null
          deal_id?: string | null
          discount?: number
          gst_type?: string
          id?: string
          igst?: number
          lead_id?: string | null
          notes?: string | null
          organization_id?: string | null
          quotation_number?: string
          rejection_reason?: string | null
          sgst?: number
          status?: string
          submitted_at?: string | null
          subtotal?: number
          terms?: string | null
          total?: number
          updated_at?: string
          valid_until?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_quotations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_quotations_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_quotations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_quotations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "crm_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_quotations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_reports: {
        Row: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          content_data: Json | null
          content_markdown: string | null
          created_at: string
          created_by: string | null
          description: string | null
          generated_at: string | null
          id: string
          parameters: Json
          rejection_reason: string | null
          submitted_at: string | null
          template_key: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          content_data?: Json | null
          content_markdown?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          generated_at?: string | null
          id?: string
          parameters?: Json
          rejection_reason?: string | null
          submitted_at?: string | null
          template_key: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          content_data?: Json | null
          content_markdown?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          generated_at?: string | null
          id?: string
          parameters?: Json
          rejection_reason?: string | null
          submitted_at?: string | null
          template_key?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_reports_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_role_permissions: {
        Row: {
          can_approve: boolean
          can_create: boolean
          can_delete: boolean
          can_edit: boolean
          can_view: boolean
          created_at: string
          id: string
          module: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          can_approve?: boolean
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          module: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          can_approve?: boolean
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          module?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_role_permissions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_sales_order_items: {
        Row: {
          amount: number
          created_at: string
          description: string
          hsn_sac: string | null
          id: string
          position: number
          product_id: string | null
          quantity: number
          rate: number
          sales_order_id: string
          tax_rate: number
          unit: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          description: string
          hsn_sac?: string | null
          id?: string
          position?: number
          product_id?: string | null
          quantity?: number
          rate?: number
          sales_order_id: string
          tax_rate?: number
          unit?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          hsn_sac?: string | null
          id?: string
          position?: number
          product_id?: string | null
          quantity?: number
          rate?: number
          sales_order_id?: string
          tax_rate?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_sales_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "crm_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_sales_order_items_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "crm_sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_sales_orders: {
        Row: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          cgst: number
          contact_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          customer_address: string | null
          customer_email: string | null
          customer_gstin: string | null
          customer_name: string
          customer_phone: string | null
          customer_state: string | null
          deal_id: string | null
          delivery_date: string | null
          discount: number
          gst_type: string
          id: string
          igst: number
          notes: string | null
          order_date: string
          organization_id: string | null
          quotation_id: string | null
          sgst: number
          so_number: string
          status: string
          subtotal: number
          terms: string | null
          total: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          cgst?: number
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_gstin?: string | null
          customer_name: string
          customer_phone?: string | null
          customer_state?: string | null
          deal_id?: string | null
          delivery_date?: string | null
          discount?: number
          gst_type?: string
          id?: string
          igst?: number
          notes?: string | null
          order_date?: string
          organization_id?: string | null
          quotation_id?: string | null
          sgst?: number
          so_number: string
          status?: string
          subtotal?: number
          terms?: string | null
          total?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          cgst?: number
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_gstin?: string | null
          customer_name?: string
          customer_phone?: string | null
          customer_state?: string | null
          deal_id?: string | null
          delivery_date?: string | null
          discount?: number
          gst_type?: string
          id?: string
          igst?: number
          notes?: string | null
          order_date?: string
          organization_id?: string | null
          quotation_id?: string | null
          sgst?: number
          so_number?: string
          status?: string
          subtotal?: number
          terms?: string | null
          total?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_sales_orders_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_sales_orders_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_sales_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "crm_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_sales_orders_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "crm_quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_sales_orders_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_saved_dashboards: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          is_shared: boolean
          layout: Json
          name: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          is_shared?: boolean
          layout?: Json
          name: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          is_shared?: boolean
          layout?: Json
          name?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_saved_dashboards_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_saved_views: {
        Row: {
          columns: string[]
          created_at: string
          filters: Json
          id: string
          is_default: boolean
          is_shared: boolean
          module: string
          name: string
          sort: Json | null
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          columns?: string[]
          created_at?: string
          filters?: Json
          id?: string
          is_default?: boolean
          is_shared?: boolean
          module: string
          name: string
          sort?: Json | null
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          columns?: string[]
          created_at?: string
          filters?: Json
          id?: string
          is_default?: boolean
          is_shared?: boolean
          module?: string
          name?: string
          sort?: Json | null
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_saved_views_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_signing_tokens: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string
          quotation_id: string
          signer_email: string | null
          token: string
          used_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          quotation_id: string
          signer_email?: string | null
          token: string
          used_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          quotation_id?: string
          signer_email?: string | null
          token?: string
          used_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_signing_tokens_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "crm_quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_signing_tokens_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_sla_policies: {
        Row: {
          business_hours_only: boolean
          created_at: string
          description: string | null
          first_response_minutes: number
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          priority: string
          resolution_minutes: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          business_hours_only?: boolean
          created_at?: string
          description?: string | null
          first_response_minutes?: number
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          priority: string
          resolution_minutes?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          business_hours_only?: boolean
          created_at?: string
          description?: string | null
          first_response_minutes?: number
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          priority?: string
          resolution_minutes?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_sla_policies_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_stock_movements: {
        Row: {
          created_at: string
          id: string
          movement_type: string
          notes: string | null
          performed_by: string | null
          product_id: string
          quantity: number
          reference_id: string | null
          reference_number: string | null
          reference_type: string | null
          unit_cost: number | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          movement_type: string
          notes?: string | null
          performed_by?: string | null
          product_id: string
          quantity: number
          reference_id?: string | null
          reference_number?: string | null
          reference_type?: string | null
          unit_cost?: number | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          movement_type?: string
          notes?: string | null
          performed_by?: string | null
          product_id?: string
          quantity?: number
          reference_id?: string | null
          reference_number?: string | null
          reference_type?: string | null
          unit_cost?: number | null
          workspace_id?: string
        }
        Relationships: []
      }
      crm_support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          closed_at: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_satisfaction: number | null
          description: string | null
          due_at: string | null
          escalated_at: string | null
          first_responded_at: string | null
          first_response_due_at: string | null
          id: string
          is_escalated: boolean
          lead_id: string | null
          organization_id: string | null
          priority: string
          resolution_due_at: string | null
          resolution_notes: string | null
          resolved_at: string | null
          sla_breach_notified: boolean
          sla_policy_id: string | null
          source_enquiry_id: string | null
          status: string
          subject: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          closed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_satisfaction?: number | null
          description?: string | null
          due_at?: string | null
          escalated_at?: string | null
          first_responded_at?: string | null
          first_response_due_at?: string | null
          id?: string
          is_escalated?: boolean
          lead_id?: string | null
          organization_id?: string | null
          priority?: string
          resolution_due_at?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          sla_breach_notified?: boolean
          sla_policy_id?: string | null
          source_enquiry_id?: string | null
          status?: string
          subject: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          closed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_satisfaction?: number | null
          description?: string | null
          due_at?: string | null
          escalated_at?: string | null
          first_responded_at?: string | null
          first_response_due_at?: string | null
          id?: string
          is_escalated?: boolean
          lead_id?: string | null
          organization_id?: string | null
          priority?: string
          resolution_due_at?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          sla_breach_notified?: boolean
          sla_policy_id?: string | null
          source_enquiry_id?: string | null
          status?: string
          subject?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_support_tickets_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_support_tickets_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_support_tickets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "crm_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_support_tickets_source_enquiry_id_fkey"
            columns: ["source_enquiry_id"]
            isOneToOne: false
            referencedRelation: "contact_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_support_tickets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_task_time_logs: {
        Row: {
          created_at: string
          duration_minutes: number | null
          ended_at: string | null
          id: string
          notes: string | null
          started_at: string
          task_id: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          started_at: string
          task_id: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string
          task_id?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_task_time_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "crm_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_task_time_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tasks: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          due_time: string | null
          estimated_hours: number | null
          id: string
          is_recurring: boolean | null
          parent_task_id: string | null
          priority: string
          progress: number | null
          recurrence_pattern: string | null
          related_contact_id: string | null
          related_deal_id: string | null
          related_lead_id: string | null
          related_ticket_id: string | null
          reminder_at: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          estimated_hours?: number | null
          id?: string
          is_recurring?: boolean | null
          parent_task_id?: string | null
          priority?: string
          progress?: number | null
          recurrence_pattern?: string | null
          related_contact_id?: string | null
          related_deal_id?: string | null
          related_lead_id?: string | null
          related_ticket_id?: string | null
          reminder_at?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          estimated_hours?: number | null
          id?: string
          is_recurring?: boolean | null
          parent_task_id?: string | null
          priority?: string
          progress?: number | null
          recurrence_pattern?: string | null
          related_contact_id?: string | null
          related_deal_id?: string | null
          related_lead_id?: string | null
          related_ticket_id?: string | null
          reminder_at?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "crm_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_related_contact_id_fkey"
            columns: ["related_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_related_deal_id_fkey"
            columns: ["related_deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_related_lead_id_fkey"
            columns: ["related_lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_related_ticket_id_fkey"
            columns: ["related_ticket_id"]
            isOneToOne: false
            referencedRelation: "crm_support_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_territories: {
        Row: {
          countries: string[]
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          owner_user_id: string | null
          region_keys: string[]
          rules: Json
          states: string[]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          countries?: string[]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          owner_user_id?: string | null
          region_keys?: string[]
          rules?: Json
          states?: string[]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          countries?: string[]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          owner_user_id?: string | null
          region_keys?: string[]
          rules?: Json
          states?: string[]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_territories_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_user_column_prefs: {
        Row: {
          columns: string[]
          id: string
          module: string
          updated_at: string
          user_id: string
        }
        Insert: {
          columns?: string[]
          id?: string
          module: string
          updated_at?: string
          user_id: string
        }
        Update: {
          columns?: string[]
          id?: string
          module?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_user_quotas: {
        Row: {
          created_at: string
          currency: string
          id: string
          notes: string | null
          period_end: string
          period_start: string
          target_amount: number
          target_deals: number
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          period_end: string
          period_start: string
          target_amount?: number
          target_deals?: number
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          target_amount?: number
          target_deals?: number
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_user_quotas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_vendors: {
        Row: {
          city: string | null
          contact_person: string | null
          country: string | null
          created_at: string
          created_by: string | null
          email: string | null
          gstin: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          pan: string | null
          payment_terms: string | null
          phone: string | null
          pincode: string | null
          state: string | null
          street: string | null
          updated_at: string
          website: string | null
          workspace_id: string
        }
        Insert: {
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          pan?: string | null
          payment_terms?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          street?: string | null
          updated_at?: string
          website?: string | null
          workspace_id: string
        }
        Update: {
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          pan?: string | null
          payment_terms?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          street?: string | null
          updated_at?: string
          website?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_vendors_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_web_forms: {
        Row: {
          auto_assign_to: string | null
          campaign_id: string | null
          created_at: string
          created_by: string | null
          default_lead_source: string | null
          description: string | null
          fields: Json
          id: string
          is_active: boolean
          name: string
          redirect_url: string | null
          slug: string
          thank_you_message: string | null
          total_submissions: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          auto_assign_to?: string | null
          campaign_id?: string | null
          created_at?: string
          created_by?: string | null
          default_lead_source?: string | null
          description?: string | null
          fields?: Json
          id?: string
          is_active?: boolean
          name: string
          redirect_url?: string | null
          slug: string
          thank_you_message?: string | null
          total_submissions?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          auto_assign_to?: string | null
          campaign_id?: string | null
          created_at?: string
          created_by?: string | null
          default_lead_source?: string | null
          description?: string | null
          fields?: Json
          id?: string
          is_active?: boolean
          name?: string
          redirect_url?: string | null
          slug?: string
          thank_you_message?: string | null
          total_submissions?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_web_forms_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "crm_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_web_forms_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_workflow_executions: {
        Row: {
          actions_executed: Json
          entity_id: string | null
          entity_type: string
          error_message: string | null
          executed_at: string
          id: string
          status: string
          trigger_event: string
          workflow_id: string
          workspace_id: string
        }
        Insert: {
          actions_executed?: Json
          entity_id?: string | null
          entity_type: string
          error_message?: string | null
          executed_at?: string
          id?: string
          status?: string
          trigger_event: string
          workflow_id: string
          workspace_id: string
        }
        Update: {
          actions_executed?: Json
          entity_id?: string | null
          entity_type?: string
          error_message?: string | null
          executed_at?: string
          id?: string
          status?: string
          trigger_event?: string
          workflow_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_workflow_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "crm_workflow_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_workflow_executions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_workflow_rules: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string
          created_by: string | null
          description: string | null
          entity_type: string
          id: string
          is_active: boolean
          last_run_at: string | null
          name: string
          run_count: number
          schedule_cron: string | null
          schedule_filter: Json | null
          schedule_target_module: string | null
          trigger_event: string
          trigger_field: string | null
          trigger_value: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          actions?: Json
          conditions?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_type: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name: string
          run_count?: number
          schedule_cron?: string | null
          schedule_filter?: Json | null
          schedule_target_module?: string | null
          trigger_event: string
          trigger_field?: string | null
          trigger_value?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_type?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name?: string
          run_count?: number
          schedule_cron?: string | null
          schedule_filter?: Json | null
          schedule_target_module?: string | null
          trigger_event?: string
          trigger_field?: string | null
          trigger_value?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_workflow_rules_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_workspace_members: {
        Row: {
          created_at: string
          crm_role: Database["public"]["Enums"]["app_role"]
          department: string | null
          id: string
          manager_user_id: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          crm_role?: Database["public"]["Enums"]["app_role"]
          department?: string | null
          id?: string
          manager_user_id?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          crm_role?: Database["public"]["Enums"]["app_role"]
          department?: string | null
          id?: string
          manager_user_id?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_workspaces: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          region_key: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          region_key: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          region_key?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      custom_sections: {
        Row: {
          background_color: string | null
          button_link: string | null
          button_text: string | null
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          section_key: string
          section_type: string
          text_color: string | null
          title: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          background_color?: string | null
          button_link?: string | null
          button_text?: string | null
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          section_key: string
          section_type?: string
          text_color?: string | null
          title?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          background_color?: string | null
          button_link?: string | null
          button_text?: string | null
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          section_key?: string
          section_type?: string
          text_color?: string | null
          title?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      customer_feedback: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_visible: boolean
          media_type: string
          media_url: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_visible?: boolean
          media_type?: string
          media_url: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_visible?: boolean
          media_type?: string
          media_url?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      deleted_users: {
        Row: {
          deleted_at: string
          deleted_by: string | null
          email: string
          full_name: string | null
          id: string
          original_user_id: string
          phone: string | null
          role: string | null
        }
        Insert: {
          deleted_at?: string
          deleted_by?: string | null
          email: string
          full_name?: string | null
          id?: string
          original_user_id: string
          phone?: string | null
          role?: string | null
        }
        Update: {
          deleted_at?: string
          deleted_by?: string | null
          email?: string
          full_name?: string | null
          id?: string
          original_user_id?: string
          phone?: string | null
          role?: string | null
        }
        Relationships: []
      }
      employee_tasks: {
        Row: {
          assigned_by: string
          assigned_to: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_by: string
          assigned_to: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string
          assigned_to?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      gallery_images: {
        Row: {
          caption: string | null
          created_at: string
          display_order: number
          id: string
          image_url: string
          is_visible: boolean
          updated_at: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          is_visible?: boolean
          updated_at?: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          is_visible?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      lead_region_assignments: {
        Row: {
          assignee_role: string
          biz_area: string | null
          created_at: string
          employee_id: string
          id: string
          region_key: string | null
        }
        Insert: {
          assignee_role?: string
          biz_area?: string | null
          created_at?: string
          employee_id: string
          id?: string
          region_key?: string | null
        }
        Update: {
          assignee_role?: string
          biz_area?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          region_key?: string | null
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempted_at: string
          email: string
          id: string
          ip_address: string | null
          is_blocked: boolean
        }
        Insert: {
          attempted_at?: string
          email: string
          id?: string
          ip_address?: string | null
          is_blocked?: boolean
        }
        Update: {
          attempted_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          is_blocked?: boolean
        }
        Relationships: []
      }
      order_tracking: {
        Row: {
          booking_id: string | null
          created_at: string
          enquiry_id: string | null
          expected_completion: string | null
          id: string
          status: Database["public"]["Enums"]["order_status"]
          status_message: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          enquiry_id?: string | null
          expected_completion?: string | null
          id?: string
          status?: Database["public"]["Enums"]["order_status"]
          status_message?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          enquiry_id?: string | null
          expected_completion?: string | null
          id?: string
          status?: Database["public"]["Enums"]["order_status"]
          status_message?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_tracking_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_tracking_enquiry_id_fkey"
            columns: ["enquiry_id"]
            isOneToOne: false
            referencedRelation: "contact_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_approved: boolean
          must_change_password: boolean
          phone: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string
          id?: string
          is_approved?: boolean
          must_change_password?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_approved?: boolean
          must_change_password?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          content: string | null
          created_at: string
          id: string
          is_published: boolean | null
          is_verified: boolean | null
          rating: number
          service_id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          is_verified?: boolean | null
          rating: number
          service_id: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          is_verified?: boolean | null
          rating?: number
          service_id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_services: {
        Row: {
          created_at: string
          id: string
          service_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          service_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          service_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          description: string
          detailed_description: string | null
          display_order: number
          display_order_mobile: number
          display_order_tablet: number
          id: string
          image: string
          is_main: boolean
          is_main_mobile: boolean
          is_main_tablet: boolean
          link: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          detailed_description?: string | null
          display_order?: number
          display_order_mobile?: number
          display_order_tablet?: number
          id?: string
          image: string
          is_main?: boolean
          is_main_mobile?: boolean
          is_main_tablet?: boolean
          link?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          detailed_description?: string | null
          display_order?: number
          display_order_mobile?: number
          display_order_tablet?: number
          id?: string
          image?: string
          is_main?: boolean
          is_main_mobile?: boolean
          is_main_tablet?: boolean
          link?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          content: string | null
          id: string
          metadata: Json | null
          section_key: string
          title: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: string | null
          id?: string
          metadata?: Json | null
          section_key: string
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string | null
          id?: string
          metadata?: Json | null
          section_key?: string
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      site_visits: {
        Row: {
          id: string
          page_path: string | null
          session_id: string
          user_agent: string | null
          user_id: string | null
          visited_at: string
        }
        Insert: {
          id?: string
          page_path?: string | null
          session_id: string
          user_agent?: string | null
          user_id?: string | null
          visited_at?: string
        }
        Update: {
          id?: string
          page_path?: string | null
          session_id?: string
          user_agent?: string | null
          user_id?: string | null
          visited_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_visible: boolean
          name: string
          organization: string | null
          text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          name: string
          organization?: string | null
          text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          name?: string
          organization?: string | null
          text?: string
          updated_at?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      crm_forecast_summary: {
        Row: {
          deal_count: number | null
          month: string | null
          owner_id: string | null
          stage: string | null
          total_amount: number | null
          weighted_amount: number | null
          workspace_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_deals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_delete_user: { Args: { _target_user_id: string }; Returns: boolean }
      admin_update_user_role: {
        Args: {
          _new_role: Database["public"]["Enums"]["app_role"]
          _target_user_id: string
        }
        Returns: boolean
      }
      cleanup_old_login_attempts: { Args: never; Returns: undefined }
      crm_calc_commission: {
        Args: { _base: number; _rule_id: string }
        Returns: number
      }
      crm_eval_condition: {
        Args: { _cond: Json; _old: Json; _row: Json }
        Returns: boolean
      }
      crm_has_permission: {
        Args: {
          _module: string
          _perm: string
          _user_id: string
          _workspace_id: string
        }
        Returns: boolean
      }
      crm_run_action: {
        Args: {
          _action: Json
          _entity_id: string
          _entity_type: string
          _row: Json
          _workspace_id: string
        }
        Returns: Json
      }
      crm_run_scheduled_workflows: { Args: never; Returns: Json }
      get_email_by_username: { Args: { _username: string }; Returns: string }
      get_users_with_emails: {
        Args: never
        Returns: {
          created_at: string
          email: string
          is_banned: boolean
          last_sign_in_at: string
          user_id: string
        }[]
      }
      has_crm_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
          _workspace_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_crm_member: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      resolve_crm_workspace: {
        Args: { _country: string; _state: string }
        Returns: string
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "user"
        | "employee"
        | "super_admin"
        | "crm_admin"
        | "crm_sales_mgr"
        | "crm_sales_rep"
        | "crm_support"
        | "crm_marketing"
        | "crm_technician"
        | "crm_viewer"
        | "crm_ceo"
        | "crm_support_mgr"
        | "crm_marketing_mgr"
        | "crm_ops_mgr"
        | "crm_accountant"
        | "crm_field_staff"
      booking_status:
        | "pending"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
      order_status:
        | "enquiry_received"
        | "site_visit_scheduled"
        | "survey_in_progress"
        | "report_generated"
        | "work_started"
        | "completed"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "pending" | "in_progress" | "completed" | "cancelled"
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
      app_role: [
        "admin",
        "user",
        "employee",
        "super_admin",
        "crm_admin",
        "crm_sales_mgr",
        "crm_sales_rep",
        "crm_support",
        "crm_marketing",
        "crm_technician",
        "crm_viewer",
        "crm_ceo",
        "crm_support_mgr",
        "crm_marketing_mgr",
        "crm_ops_mgr",
        "crm_accountant",
        "crm_field_staff",
      ],
      booking_status: [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ],
      order_status: [
        "enquiry_received",
        "site_visit_scheduled",
        "survey_in_progress",
        "report_generated",
        "work_started",
        "completed",
      ],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["pending", "in_progress", "completed", "cancelled"],
    },
  },
} as const
