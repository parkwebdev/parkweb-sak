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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      client_folder_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          client_email: string
          folder_id: string
          id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          client_email: string
          folder_id: string
          id?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          client_email?: string
          folder_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_folder_assignments_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "client_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      client_folders: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "client_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      client_onboarding_links: {
        Row: {
          client_name: string
          company_name: string
          created_at: string
          date_sent: string
          email: string
          id: string
          industry: string
          last_activity: string
          onboarding_url: string
          personal_note: string | null
          sow_status: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_name: string
          company_name: string
          created_at?: string
          date_sent?: string
          email: string
          id?: string
          industry: string
          last_activity?: string
          onboarding_url: string
          personal_note?: string | null
          sow_status?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_name?: string
          company_name?: string
          created_at?: string
          date_sent?: string
          email?: string
          id?: string
          industry?: string
          last_activity?: string
          onboarding_url?: string
          personal_note?: string | null
          sow_status?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          client_name: string | null
          company_name: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          industry: string
          last_name: string | null
          personal_note: string | null
          phone: string | null
          status: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          client_name?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          industry: string
          last_name?: string | null
          personal_note?: string | null
          phone?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          client_name?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          industry?: string
          last_name?: string | null
          personal_note?: string | null
          phone?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      draft_submissions: {
        Row: {
          client_email: string
          client_name: string
          created_at: string
          draft_data: Json
          expires_at: string
          id: string
          resume_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_email: string
          client_name: string
          created_at?: string
          draft_data?: Json
          expires_at?: string
          id?: string
          resume_token?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_email?: string
          client_name?: string
          created_at?: string
          draft_data?: Json
          expires_at?: string
          id?: string
          resume_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          active: boolean | null
          created_at: string
          html_content: string
          id: string
          name: string
          subject: string
          text_content: string | null
          updated_at: string
          variables: Json | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          html_content: string
          id?: string
          name: string
          subject: string
          text_content?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          html_content?: string
          id?: string
          name?: string
          subject?: string
          text_content?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          browser_notifications: boolean | null
          created_at: string
          email_notifications: boolean | null
          id: string
          onboarding_notifications: boolean | null
          scope_work_notifications: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          browser_notifications?: boolean | null
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          onboarding_notifications?: boolean | null
          scope_work_notifications?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          browser_notifications?: boolean | null
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          onboarding_notifications?: boolean | null
          scope_work_notifications?: boolean | null
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
      onboarding_submissions: {
        Row: {
          branding_files: Json | null
          budget_range: string | null
          client_email: string
          client_name: string
          content_files: Json | null
          description: string | null
          id: string
          industry: string | null
          project_type: string | null
          status: string | null
          submitted_at: string
          timeline: string | null
          user_id: string
        }
        Insert: {
          branding_files?: Json | null
          budget_range?: string | null
          client_email: string
          client_name: string
          content_files?: Json | null
          description?: string | null
          id?: string
          industry?: string | null
          project_type?: string | null
          status?: string | null
          submitted_at?: string
          timeline?: string | null
          user_id: string
        }
        Update: {
          branding_files?: Json | null
          budget_range?: string | null
          client_email?: string
          client_name?: string
          content_files?: Json | null
          description?: string | null
          id?: string
          industry?: string | null
          project_type?: string | null
          status?: string | null
          submitted_at?: string
          timeline?: string | null
          user_id?: string
        }
        Relationships: []
      }
      onboarding_templates: {
        Row: {
          active: boolean | null
          created_at: string
          description: string | null
          form_fields: Json
          id: string
          industry: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          form_fields?: Json
          id?: string
          industry: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          form_fields?: Json
          id?: string
          industry?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      onboarding_tokens: {
        Row: {
          client_email: string
          client_name: string
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          token: string
          used: boolean
        }
        Insert: {
          client_email: string
          client_name: string
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          token: string
          used?: boolean
        }
        Update: {
          client_email?: string
          client_name?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          token?: string
          used?: boolean
        }
        Relationships: []
      }
      pending_invitations: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          invited_by_name: string
          status: string
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          invited_by_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          invited_by_name?: string
          status?: string
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
      project_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          project_id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          project_id: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_project_tasks_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: string
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          name: string
          priority: string
          start_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          priority?: string
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          priority?: string
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_projects_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      request_links: {
        Row: {
          active: boolean
          client_email: string
          client_name: string
          company_name: string
          created_at: string
          id: string
          submission_url: string
          updated_at: string
          user_id: string
          website_name: string | null
          website_url: string | null
        }
        Insert: {
          active?: boolean
          client_email: string
          client_name: string
          company_name: string
          created_at?: string
          id?: string
          submission_url: string
          updated_at?: string
          user_id: string
          website_name?: string | null
          website_url?: string | null
        }
        Update: {
          active?: boolean
          client_email?: string
          client_name?: string
          company_name?: string
          created_at?: string
          id?: string
          submission_url?: string
          updated_at?: string
          user_id?: string
          website_name?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      requests: {
        Row: {
          assigned_to: string | null
          client_email: string
          client_name: string
          company_name: string
          completed_at: string | null
          created_at: string
          description: string
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["request_priority"]
          project_id: string | null
          status: Database["public"]["Enums"]["request_status"]
          task_id: string | null
          title: string
          updated_at: string
          user_id: string
          website_name: string | null
          website_url: string | null
        }
        Insert: {
          assigned_to?: string | null
          client_email: string
          client_name: string
          company_name: string
          completed_at?: string | null
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["request_priority"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          task_id?: string | null
          title: string
          updated_at?: string
          user_id: string
          website_name?: string | null
          website_url?: string | null
        }
        Update: {
          assigned_to?: string | null
          client_email?: string
          client_name?: string
          company_name?: string
          completed_at?: string | null
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["request_priority"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          task_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          website_name?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_requests_assigned_to_profiles"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_requests_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_requests_task_id"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      scope_of_works: {
        Row: {
          branding_files: Json | null
          client: string
          client_contact: string
          content: string
          content_files: Json | null
          created_at: string
          date_created: string
          date_modified: string
          email: string
          id: string
          industry: string
          integrations: string[] | null
          pages: number
          project_type: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          branding_files?: Json | null
          client: string
          client_contact: string
          content: string
          content_files?: Json | null
          created_at?: string
          date_created?: string
          date_modified?: string
          email: string
          id?: string
          industry: string
          integrations?: string[] | null
          pages?: number
          project_type: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          branding_files?: Json | null
          client?: string
          client_contact?: string
          content?: string
          content_files?: Json | null
          created_at?: string
          date_created?: string
          date_modified?: string
          email?: string
          id?: string
          industry?: string
          integrations?: string[] | null
          pages?: number
          project_type?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scope_work_approvals: {
        Row: {
          approved_at: string | null
          client_email: string | null
          client_name: string
          created_at: string
          id: string
          sow_title: string
          status: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          client_email?: string | null
          client_name: string
          created_at?: string
          id?: string
          sow_title: string
          status?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          client_email?: string | null
          client_name?: string
          created_at?: string
          id?: string
          sow_title?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      security_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type: string
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_role: {
        Args: { target_user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_permission: {
        Args: {
          permission_name: Database["public"]["Enums"]["app_permission"]
          target_user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { target_user_id: string }; Returns: boolean }
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
      validate_onboarding_token: { Args: { p_token: string }; Returns: boolean }
      validate_submission_token: { Args: { p_email: string }; Returns: boolean }
    }
    Enums: {
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
      request_priority: "low" | "medium" | "high" | "urgent"
      request_status: "to_do" | "in_progress" | "on_hold" | "completed"
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
      request_priority: ["low", "medium", "high", "urgent"],
      request_status: ["to_do", "in_progress", "on_hold", "completed"],
    },
  },
} as const
