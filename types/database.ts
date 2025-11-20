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
          id: string;
          full_name: string | null;
          headline: string | null;
          location: string | null;
          phone: string | null;
          links: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          headline?: string | null;
          location?: string | null;
          phone?: string | null;
          links?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          headline?: string | null;
          location?: string | null;
          phone?: string | null;
          links?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      project_records: {
        Row: {
          id: string;
          user_id: string | null;
          title: string;
          summary: string | null;
          highlights: string[] | null;
          raw_input: string | null;
          tags: string[] | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          title: string;
          summary?: string | null;
          highlights?: string[] | null;
          raw_input?: string | null;
          tags?: string[] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          title?: string;
          summary?: string | null;
          highlights?: string[] | null;
          raw_input?: string | null;
          tags?: string[] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      job_targets: {
        Row: {
          id: string;
          user_id: string | null;
          role_title: string | null;
          company: string | null;
          location: string | null;
          job_description: string | null;
          seniority: string | null;
          skills: string[] | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          role_title?: string | null;
          company?: string | null;
          location?: string | null;
          job_description?: string | null;
          seniority?: string | null;
          skills?: string[] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          role_title?: string | null;
          company?: string | null;
          location?: string | null;
          job_description?: string | null;
          seniority?: string | null;
          skills?: string[] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      resumes: {
        Row: {
          id: string;
          user_id: string | null;
          job_target_id: string | null;
          job_description_id: string | null;
          title: string;
          status: string | null;
          format: "pdf" | "latex";
          template_id: string | null;
          structured_content: Json;
          ai_prompt: Json | null;
          ai_response: Json | null;
          pdf_url: string | null;
          latex_source: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          job_target_id?: string | null;
          job_description_id?: string | null;
          title: string;
          status?: string | null;
          format?: "pdf" | "latex";
          template_id?: string | null;
          structured_content: Json;
          ai_prompt?: Json | null;
          ai_response?: Json | null;
          pdf_url?: string | null;
          latex_source?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          job_target_id?: string | null;
          job_description_id?: string | null;
          title?: string;
          status?: string | null;
          format?: "pdf" | "latex";
          template_id?: string | null;
          structured_content?: Json;
          ai_prompt?: Json | null;
          ai_response?: Json | null;
          pdf_url?: string | null;
          latex_source?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      resume_activity_log: {
        Row: {
          id: string;
          resume_id: string | null;
          event: string;
          metadata: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          resume_id?: string | null;
          event: string;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          resume_id?: string | null;
          event?: string;
          metadata?: Json | null;
          created_at?: string | null;
        };
      };
      resume_templates: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: "finance" | "tech" | "custom";
          is_default: boolean | null;
          template_config: Json;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          name: string;
          description?: string | null;
          category: "finance" | "tech" | "custom";
          is_default?: boolean | null;
          template_config: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category?: "finance" | "tech" | "custom";
          is_default?: boolean | null;
          template_config?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      resume_sources: {
        Row: {
          id: string;
          user_id: string | null;
          original_filename: string | null;
          mime_type: string | null;
          extracted_text: string | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
          parse_status: string | null;
          parsed_at: string | null;
          parse_error: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          original_filename?: string | null;
          mime_type?: string | null;
          extracted_text?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          parse_status?: string | null;
          parsed_at?: string | null;
          parse_error?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          original_filename?: string | null;
          mime_type?: string | null;
          extracted_text?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          parse_status?: string | null;
          parsed_at?: string | null;
          parse_error?: string | null;
        };
      };
      job_descriptions: {
        Row: {
          id: string;
          user_id: string | null;
          role_title: string | null;
          company: string | null;
          location: string | null;
          seniority: string | null;
          source_url: string | null;
          job_text: string;
          keywords: string[] | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          role_title?: string | null;
          company?: string | null;
          location?: string | null;
          seniority?: string | null;
          source_url?: string | null;
          job_text: string;
          keywords?: string[] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          role_title?: string | null;
          company?: string | null;
          location?: string | null;
          seniority?: string | null;
          source_url?: string | null;
          job_text?: string;
          keywords?: string[] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      experience_records: {
        Row: {
          id: string;
          user_id: string | null;
          resume_source_id: string | null;
          organization: string | null;
          role_title: string | null;
          location: string | null;
          start_date: string | null;
          end_date: string | null;
          is_current: boolean | null;
          summary: string | null;
          achievements: string[] | null;
          skills: string[] | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          resume_source_id?: string | null;
          organization?: string | null;
          role_title?: string | null;
          location?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          is_current?: boolean | null;
          summary?: string | null;
          achievements?: string[] | null;
          skills?: string[] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          resume_source_id?: string | null;
          organization?: string | null;
          role_title?: string | null;
          location?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          is_current?: boolean | null;
          summary?: string | null;
          achievements?: string[] | null;
          skills?: string[] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      education_records: {
        Row: {
          id: string;
          user_id: string | null;
          resume_source_id: string | null;
          institution: string | null;
          degree: string | null;
          field_of_study: string | null;
          start_date: string | null;
          end_date: string | null;
          achievements: string[] | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          resume_source_id?: string | null;
          institution?: string | null;
          degree?: string | null;
          field_of_study?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          achievements?: string[] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          resume_source_id?: string | null;
          institution?: string | null;
          degree?: string | null;
          field_of_study?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          achievements?: string[] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      skill_records: {
        Row: {
          id: string;
          user_id: string | null;
          resume_source_id: string | null;
          category: string | null;
          skills: string[] | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          resume_source_id?: string | null;
          category?: string | null;
          skills?: string[] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          resume_source_id?: string | null;
          category?: string | null;
          skills?: string[] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
    };
    };
    Enums: {
      resume_format: "pdf" | "latex";
    };
    Functions: never;
  };
};

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ProjectRecord = Database["public"]["Tables"]["project_records"]["Row"];
export type JobTarget = Database["public"]["Tables"]["job_targets"]["Row"];
export type ResumeRecord = Database["public"]["Tables"]["resumes"]["Row"];
export type ResumeActivity = Database["public"]["Tables"]["resume_activity_log"]["Row"];
export type ResumeSource = Database["public"]["Tables"]["resume_sources"]["Row"];
export type JobDescription = Database["public"]["Tables"]["job_descriptions"]["Row"];
export type ExperienceRecord = Database["public"]["Tables"]["experience_records"]["Row"];
export type EducationRecord = Database["public"]["Tables"]["education_records"]["Row"];
export type SkillRecord = Database["public"]["Tables"]["skill_records"]["Row"];
export type ResumeTemplateRecord = Database["public"]["Tables"]["resume_templates"]["Row"];

