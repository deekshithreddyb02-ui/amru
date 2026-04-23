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
          sgst: number
          status: string
          subtotal: number
          terms: string | null
          total: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
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
          sgst?: number
          status?: string
          subtotal?: number
          terms?: string | null
          total?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
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
          sgst?: number
          status?: string
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
      crm_leads: {
        Row: {
          ai_hot_score: number | null
          assigned_to: string | null
          biz_area: string | null
          biz_cost: number | null
          city: string | null
          country: string | null
          created_at: string
          created_by: string | null
          email: string | null
          expected_close: string | null
          full_name: string
          id: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          phone: string | null
          pincode: string | null
          service_needed: string | null
          source_enquiry_id: string | null
          stage: string
          state: string | null
          status: string
          street: string | null
          updated_at: string
          whatsapp: string | null
          workspace_id: string
        }
        Insert: {
          ai_hot_score?: number | null
          assigned_to?: string | null
          biz_area?: string | null
          biz_cost?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          expected_close?: string | null
          full_name: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          phone?: string | null
          pincode?: string | null
          service_needed?: string | null
          source_enquiry_id?: string | null
          stage?: string
          state?: string | null
          status?: string
          street?: string | null
          updated_at?: string
          whatsapp?: string | null
          workspace_id: string
        }
        Update: {
          ai_hot_score?: number | null
          assigned_to?: string | null
          biz_area?: string | null
          biz_cost?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          expected_close?: string | null
          full_name?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          phone?: string | null
          pincode?: string | null
          service_needed?: string | null
          source_enquiry_id?: string | null
          stage?: string
          state?: string | null
          status?: string
          street?: string | null
          updated_at?: string
          whatsapp?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_source_enquiry_id_fkey"
            columns: ["source_enquiry_id"]
            isOneToOne: false
            referencedRelation: "contact_messages"
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
      crm_quotations: {
        Row: {
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
          sgst: number
          status: string
          subtotal: number
          terms: string | null
          total: number
          updated_at: string
          valid_until: string | null
          workspace_id: string
        }
        Insert: {
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
          sgst?: number
          status?: string
          subtotal?: number
          terms?: string | null
          total?: number
          updated_at?: string
          valid_until?: string | null
          workspace_id: string
        }
        Update: {
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
          sgst?: number
          status?: string
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
      crm_support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          contact_id: string | null
          created_at: string
          created_by: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          description: string | null
          due_at: string | null
          id: string
          lead_id: string | null
          organization_id: string | null
          priority: string
          resolution_notes: string | null
          resolved_at: string | null
          source_enquiry_id: string | null
          status: string
          subject: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          lead_id?: string | null
          organization_id?: string | null
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          source_enquiry_id?: string | null
          status?: string
          subject: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          lead_id?: string | null
          organization_id?: string | null
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
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
      crm_workspace_members: {
        Row: {
          created_at: string
          crm_role: Database["public"]["Enums"]["app_role"]
          id: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          crm_role?: Database["public"]["Enums"]["app_role"]
          id?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          crm_role?: Database["public"]["Enums"]["app_role"]
          id?: string
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
      [_ in never]: never
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
