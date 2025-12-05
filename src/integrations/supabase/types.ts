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
      agent_api_keys: {
        Row: {
          agent_id: string
          created_at: string
          current_day_requests: number
          current_minute_requests: number
          day_window_start: string | null
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          minute_window_start: string | null
          name: string
          requests_per_day: number
          requests_per_minute: number
          revoked_at: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          current_day_requests?: number
          current_minute_requests?: number
          day_window_start?: string | null
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          minute_window_start?: string | null
          name?: string
          requests_per_day?: number
          requests_per_minute?: number
          revoked_at?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          current_day_requests?: number
          current_minute_requests?: number
          day_window_start?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          minute_window_start?: string | null
          name?: string
          requests_per_day?: number
          requests_per_minute?: number
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_api_keys_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_tools: {
        Row: {
          agent_id: string
          created_at: string
          description: string
          enabled: boolean | null
          endpoint_url: string | null
          headers: Json | null
          id: string
          name: string
          parameters: Json
          timeout_ms: number | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          description: string
          enabled?: boolean | null
          endpoint_url?: string | null
          headers?: Json | null
          id?: string
          name: string
          parameters: Json
          timeout_ms?: number | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          description?: string
          enabled?: boolean | null
          endpoint_url?: string | null
          headers?: Json | null
          id?: string
          name?: string
          parameters?: Json
          timeout_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_tools_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          created_at: string
          deployment_config: Json | null
          description: string | null
          id: string
          max_tokens: number | null
          model: string
          name: string
          status: Database["public"]["Enums"]["agent_status"]
          system_prompt: string
          temperature: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deployment_config?: Json | null
          description?: string | null
          id?: string
          max_tokens?: number | null
          model?: string
          name: string
          status?: Database["public"]["Enums"]["agent_status"]
          system_prompt: string
          temperature?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deployment_config?: Json | null
          description?: string | null
          id?: string
          max_tokens?: number | null
          model?: string
          name?: string
          status?: Database["public"]["Enums"]["agent_status"]
          system_prompt?: string
          temperature?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          action_type: string | null
          action_url: string | null
          agent_id: string
          background_color: string | null
          created_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          order_index: number | null
          subtitle: string | null
          title: string
          title_color: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_type?: string | null
          action_url?: string | null
          agent_id: string
          background_color?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          order_index?: number | null
          subtitle?: string | null
          title: string
          title_color?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_type?: string | null
          action_url?: string | null
          agent_id?: string
          background_color?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          order_index?: number | null
          subtitle?: string | null
          title?: string
          title_color?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      article_feedback: {
        Row: {
          article_id: string
          comment: string | null
          created_at: string | null
          id: string
          is_helpful: boolean
          session_id: string
        }
        Insert: {
          article_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          is_helpful: boolean
          session_id: string
        }
        Update: {
          article_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          is_helpful?: boolean
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_feedback_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "help_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_takeovers: {
        Row: {
          conversation_id: string
          id: string
          reason: string | null
          returned_to_ai_at: string | null
          taken_over_at: string
          taken_over_by: string
        }
        Insert: {
          conversation_id: string
          id?: string
          reason?: string | null
          returned_to_ai_at?: string | null
          taken_over_at?: string
          taken_over_by: string
        }
        Update: {
          conversation_id?: string
          id?: string
          reason?: string | null
          returned_to_ai_at?: string | null
          taken_over_at?: string
          taken_over_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_takeovers_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          agent_id: string
          channel: string | null
          created_at: string
          expires_at: string
          id: string
          metadata: Json | null
          status: Database["public"]["Enums"]["conversation_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id: string
          channel?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          metadata?: Json | null
          status?: Database["public"]["Enums"]["conversation_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          channel?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          metadata?: Json | null
          status?: Database["public"]["Enums"]["conversation_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_domains: {
        Row: {
          created_at: string | null
          dns_configured: boolean | null
          domain: string
          id: string
          is_primary: boolean | null
          ssl_status: string | null
          updated_at: string | null
          user_id: string
          verification_token: string
          verified: boolean | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          dns_configured?: boolean | null
          domain: string
          id?: string
          is_primary?: boolean | null
          ssl_status?: string | null
          updated_at?: string | null
          user_id: string
          verification_token: string
          verified?: boolean | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          dns_configured?: boolean | null
          domain?: string
          id?: string
          is_primary?: boolean | null
          ssl_status?: string | null
          updated_at?: string | null
          user_id?: string
          verification_token?: string
          verified?: boolean | null
          verified_at?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          active: boolean | null
          created_at: string | null
          html_content: string
          id: string
          name: string
          subject: string
          text_content: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          html_content: string
          id?: string
          name: string
          subject: string
          text_content: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          html_content?: string
          id?: string
          name?: string
          subject?: string
          text_content?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      help_articles: {
        Row: {
          agent_id: string
          category_id: string
          content: string
          created_at: string | null
          featured_image: string | null
          icon: string | null
          id: string
          order_index: number | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_id: string
          category_id: string
          content: string
          created_at?: string | null
          featured_image?: string | null
          icon?: string | null
          id?: string
          order_index?: number | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string
          category_id?: string
          content?: string
          created_at?: string | null
          featured_image?: string | null
          icon?: string | null
          id?: string
          order_index?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "help_articles_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "help_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      help_categories: {
        Row: {
          agent_id: string
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          order_index: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          order_index?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          order_index?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "help_categories_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_sources: {
        Row: {
          agent_id: string
          content: string | null
          created_at: string
          embedding: string | null
          id: string
          metadata: Json | null
          source: string
          status: string
          type: Database["public"]["Enums"]["knowledge_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id: string
          content?: string | null
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source: string
          status?: string
          type: Database["public"]["Enums"]["knowledge_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          content?: string | null
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source?: string
          status?: string
          type?: Database["public"]["Enums"]["knowledge_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_sources_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          company: string | null
          conversation_id: string | null
          created_at: string
          data: Json | null
          email: string | null
          id: string
          name: string | null
          phone: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          conversation_id?: string | null
          created_at?: string
          data?: Json | null
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          conversation_id?: string | null
          created_at?: string
          data?: Json | null
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      news_items: {
        Row: {
          agent_id: string
          author_name: string | null
          body: string
          created_at: string | null
          featured_image_url: string | null
          id: string
          is_published: boolean | null
          order_index: number | null
          published_at: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_id: string
          author_name?: string | null
          body: string
          created_at?: string | null
          featured_image_url?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          published_at?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string
          author_name?: string | null
          body?: string
          created_at?: string | null
          featured_image_url?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          published_at?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_items_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          agent_notifications: boolean | null
          browser_notifications: boolean | null
          conversation_notifications: boolean | null
          created_at: string
          email_notifications: boolean | null
          id: string
          lead_notifications: boolean | null
          report_notifications: boolean | null
          team_notifications: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_notifications?: boolean | null
          browser_notifications?: boolean | null
          conversation_notifications?: boolean | null
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          lead_notifications?: boolean | null
          report_notifications?: boolean | null
          team_notifications?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_notifications?: boolean | null
          browser_notifications?: boolean | null
          conversation_notifications?: boolean | null
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          lead_notifications?: boolean | null
          report_notifications?: boolean | null
          team_notifications?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pending_invitations: {
        Row: {
          company_name: string | null
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string
          invited_by_name: string
          status: string
          updated_at: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by: string
          invited_by_name: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string
          invited_by_name?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      plans: {
        Row: {
          active: boolean | null
          created_at: string
          features: Json | null
          id: string
          limits: Json | null
          name: string
          price_monthly: number
          price_yearly: number
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          features?: Json | null
          id?: string
          limits?: Json | null
          name: string
          price_monthly: number
          price_yearly: number
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          features?: Json | null
          id?: string
          limits?: Json | null
          name?: string
          price_monthly?: number
          price_yearly?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_reports: {
        Row: {
          active: boolean
          created_at: string
          created_by: string
          day_of_month: number | null
          day_of_week: number | null
          frequency: string
          id: string
          last_sent_at: string | null
          name: string
          recipients: Json
          report_config: Json
          time_of_day: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by: string
          day_of_month?: number | null
          day_of_week?: number | null
          frequency: string
          id?: string
          last_sent_at?: string | null
          name: string
          recipients?: Json
          report_config?: Json
          time_of_day?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string
          day_of_month?: number | null
          day_of_week?: number | null
          frequency?: string
          id?: string
          last_sent_at?: string | null
          name?: string
          recipients?: Json
          report_config?: Json
          time_of_day?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      security_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          success: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string | null
          id: string
          member_id: string
          owner_id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          member_id: string
          owner_id: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          member_id?: string
          owner_id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      usage_metrics: {
        Row: {
          api_calls_count: number | null
          conversations_count: number | null
          created_at: string
          id: string
          messages_count: number | null
          period_end: string
          period_start: string
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          api_calls_count?: number | null
          conversations_count?: number | null
          created_at?: string
          id?: string
          messages_count?: number | null
          period_end: string
          period_start: string
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          api_calls_count?: number | null
          conversations_count?: number | null
          created_at?: string
          id?: string
          messages_count?: number | null
          period_end?: string
          period_start?: string
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          auto_save: boolean | null
          compact_mode: boolean | null
          created_at: string | null
          default_project_view: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_save?: boolean | null
          compact_mode?: boolean | null
          created_at?: string | null
          default_project_view?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_save?: boolean | null
          compact_mode?: boolean | null
          created_at?: string | null
          default_project_view?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          permissions: Database["public"]["Enums"]["app_permission"][] | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permissions?: Database["public"]["Enums"]["app_permission"][] | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permissions?: Database["public"]["Enums"]["app_permission"][] | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string
          delivered: boolean | null
          delivered_at: string | null
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          response_body: string | null
          response_status: number | null
          retry_count: number | null
          webhook_id: string
        }
        Insert: {
          created_at?: string
          delivered?: boolean | null
          delivered_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          payload: Json
          response_body?: string | null
          response_status?: number | null
          retry_count?: number | null
          webhook_id: string
        }
        Update: {
          created_at?: string
          delivered?: boolean | null
          delivered_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          retry_count?: number | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          active: boolean | null
          agent_id: string | null
          auth_config: Json | null
          auth_type: string
          conditions: Json | null
          created_at: string
          events: string[] | null
          headers: Json | null
          id: string
          method: string
          name: string
          response_actions: Json | null
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          agent_id?: string | null
          auth_config?: Json | null
          auth_type?: string
          conditions?: Json | null
          created_at?: string
          events?: string[] | null
          headers?: Json | null
          id?: string
          method?: string
          name: string
          response_actions?: Json | null
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          agent_id?: string | null
          auth_config?: Json | null
          auth_type?: string
          conditions?: Json | null
          created_at?: string
          events?: string[] | null
          headers?: Json | null
          id?: string
          method?: string
          name?: string
          response_actions?: Json | null
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_account_owner_id: { Args: never; Returns: string }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_role: {
        Args: { target_user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_account_access: {
        Args: { account_owner_id: string }
        Returns: boolean
      }
      has_permission: {
        Args: {
          permission_name: Database["public"]["Enums"]["app_permission"]
          target_user_id: string
        }
        Returns: boolean
      }
      is_account_admin: { Args: { account_owner_id: string }; Returns: boolean }
      is_admin: { Args: { target_user_id: string }; Returns: boolean }
      is_super_admin: { Args: { user_id: string }; Returns: boolean }
      log_security_event: {
        Args: {
          p_action: string
          p_details?: Json
          p_resource_id?: string
          p_resource_type: string
          p_success?: boolean
          p_user_id: string
        }
        Returns: undefined
      }
      mark_token_used: {
        Args: { p_email: string; p_token: string }
        Returns: undefined
      }
      search_knowledge_sources: {
        Args: {
          p_agent_id: string
          p_match_count?: number
          p_match_threshold?: number
          p_query_embedding: string
        }
        Returns: {
          content: string
          id: string
          similarity: number
          source: string
          type: string
        }[]
      }
      validate_api_key: {
        Args: { p_agent_id: string; p_key_hash: string }
        Returns: {
          error_message: string
          key_id: string
          rate_limited: boolean
          valid: boolean
        }[]
      }
      validate_onboarding_token: { Args: { p_token: string }; Returns: boolean }
      validate_submission_token: { Args: { p_email: string }; Returns: boolean }
    }
    Enums: {
      agent_status: "draft" | "active" | "paused"
      app_permission:
        | "manage_team"
        | "view_team"
        | "manage_projects"
        | "view_projects"
        | "manage_onboarding"
        | "view_onboarding"
        | "manage_scope_works"
        | "view_scope_works"
        | "manage_settings"
        | "view_settings"
      app_role: "admin" | "manager" | "member" | "super_admin" | "client"
      conversation_status: "active" | "human_takeover" | "closed"
      knowledge_type: "pdf" | "url" | "api" | "json" | "xml" | "csv"
      lead_status: "new" | "contacted" | "qualified" | "converted"
      org_role: "owner" | "admin" | "member"
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
      agent_status: ["draft", "active", "paused"],
      app_permission: [
        "manage_team",
        "view_team",
        "manage_projects",
        "view_projects",
        "manage_onboarding",
        "view_onboarding",
        "manage_scope_works",
        "view_scope_works",
        "manage_settings",
        "view_settings",
      ],
      app_role: ["admin", "manager", "member", "super_admin", "client"],
      conversation_status: ["active", "human_takeover", "closed"],
      knowledge_type: ["pdf", "url", "api", "json", "xml", "csv"],
      lead_status: ["new", "contacted", "qualified", "converted"],
      org_role: ["owner", "admin", "member"],
    },
  },
} as const
