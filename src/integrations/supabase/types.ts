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
      academic_events: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          end_time: string | null
          event_type: string
          id: string
          school_id: string | null
          start_date: string
          start_time: string | null
          title: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          event_type?: string
          id?: string
          school_id?: string | null
          start_date: string
          start_time?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          event_type?: string
          id?: string
          school_id?: string | null
          start_date?: string
          start_time?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      academic_periods: {
        Row: {
          academic_year_id: string | null
          created_at: string
          display_order: number
          end_date: string
          id: string
          label: string
          period_type: string
          school_id: string | null
          semester: string
          start_date: string
          updated_at: string
        }
        Insert: {
          academic_year_id?: string | null
          created_at?: string
          display_order?: number
          end_date: string
          id?: string
          label: string
          period_type: string
          school_id?: string | null
          semester?: string
          start_date: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string | null
          created_at?: string
          display_order?: number
          end_date?: string
          id?: string
          label?: string
          period_type?: string
          school_id?: string | null
          semester?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_periods_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academic_periods_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      academic_years: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_current: boolean | null
          school_id: string | null
          start_date: string
          year_name: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_current?: boolean | null
          school_id?: string | null
          start_date: string
          year_name: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_current?: boolean | null
          school_id?: string | null
          start_date?: string
          year_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_years_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_types: {
        Row: {
          created_at: string
          department_id: string | null
          display_order: number
          id: string
          max_points: number
          name: string
          school_id: string | null
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          display_order?: number
          id?: string
          max_points?: number
          name: string
          school_id?: string | null
        }
        Update: {
          created_at?: string
          department_id?: string | null
          display_order?: number
          id?: string
          max_points?: number
          name?: string
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_types_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_types_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          created_at: string
          id: string
          note: string | null
          school_id: string | null
          session_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          school_id?: string | null
          session_id: string
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          school_id?: string | null
          session_id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "attendance_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_sessions: {
        Row: {
          class_id: string
          class_subject_id: string | null
          created_at: string
          date: string
          id: string
          notes: string | null
          school_id: string | null
          taken_by: string | null
          updated_at: string
        }
        Insert: {
          class_id: string
          class_subject_id?: string | null
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          school_id?: string | null
          taken_by?: string | null
          updated_at?: string
        }
        Update: {
          class_id?: string
          class_subject_id?: string | null
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          school_id?: string | null
          taken_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_class_subject_id_fkey"
            columns: ["class_subject_id"]
            isOneToOne: false
            referencedRelation: "class_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          school_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          school_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      class_schedules: {
        Row: {
          class_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          school_id: string | null
          start_time: string
          subject_id: string | null
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          school_id?: string | null
          start_time: string
          subject_id?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          school_id?: string | null
          start_time?: string
          subject_id?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_schedules_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_schedules_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_schedules_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_schedules_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_subjects: {
        Row: {
          class_id: string
          created_at: string
          id: string
          period_number: number | null
          school_id: string | null
          subject_id: string
          teacher_id: string | null
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          period_number?: number | null
          school_id?: string | null
          subject_id: string
          teacher_id?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          period_number?: number | null
          school_id?: string | null
          subject_id?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_subjects_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year_id: string
          created_at: string
          department_id: string
          display_order: number
          grading_mode: string
          id: string
          name: string
          school_id: string | null
          teacher_id: string | null
        }
        Insert: {
          academic_year_id: string
          created_at?: string
          department_id: string
          display_order?: number
          grading_mode?: string
          id?: string
          name: string
          school_id?: string | null
          teacher_id?: string | null
        }
        Update: {
          academic_year_id?: string
          created_at?: string
          department_id?: string
          display_order?: number
          grading_mode?: string
          id?: string
          name?: string
          school_id?: string | null
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      department_report_colors: {
        Row: {
          accent_color: string | null
          created_at: string
          department_id: string
          general_average_text_color: string | null
          header_bg_color: string | null
          header_chip_color: string | null
          header_meta_text_color: string | null
          id: string
          school_id: string
          secondary_bg_color: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          created_at?: string
          department_id: string
          general_average_text_color?: string | null
          header_bg_color?: string | null
          header_chip_color?: string | null
          header_meta_text_color?: string | null
          id?: string
          school_id: string
          secondary_bg_color?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          created_at?: string
          department_id?: string
          general_average_text_color?: string | null
          header_bg_color?: string | null
          header_chip_color?: string | null
          header_meta_text_color?: string | null
          id?: string
          school_id?: string
          secondary_bg_color?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_report_colors_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_report_colors_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          name: string
          school_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name: string
          school_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name?: string
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      division_fee_rates: {
        Row: {
          academic_year_id: string | null
          amount: number
          created_at: string
          department_id: string
          fee_category_id: string
          id: string
          school_id: string | null
          updated_at: string
        }
        Insert: {
          academic_year_id?: string | null
          amount?: number
          created_at?: string
          department_id: string
          fee_category_id: string
          id?: string
          school_id?: string | null
          updated_at?: string
        }
        Update: {
          academic_year_id?: string | null
          amount?: number
          created_at?: string
          department_id?: string
          fee_category_id?: string
          id?: string
          school_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "division_fee_rates_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "division_fee_rates_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "division_fee_rates_fee_category_id_fkey"
            columns: ["fee_category_id"]
            isOneToOne: false
            referencedRelation: "fee_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "division_fee_rates_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          expense_date: string
          id: string
          paid_to: string | null
          payment_method: string | null
          receipt_url: string | null
          school_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          paid_to?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          school_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          paid_to?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          school_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_assignments: {
        Row: {
          amount_due: number
          amount_paid: number
          created_at: string
          due_date: string | null
          fee_structure_id: string
          id: string
          school_id: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          amount_due?: number
          amount_paid?: number
          created_at?: string
          due_date?: string | null
          fee_structure_id: string
          id?: string
          school_id?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          created_at?: string
          due_date?: string | null
          fee_structure_id?: string
          id?: string
          school_id?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_assignments_fee_structure_id_fkey"
            columns: ["fee_structure_id"]
            isOneToOne: false
            referencedRelation: "fee_structures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_assignments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_categories: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_registration: boolean
          name: string
          school_id: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_registration?: boolean
          name: string
          school_id?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_registration?: boolean
          name?: string
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_categories_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structures: {
        Row: {
          academic_year_id: string | null
          amount: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          school_id: string | null
          updated_at: string
        }
        Insert: {
          academic_year_id?: string | null
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          school_id?: string | null
          updated_at?: string
        }
        Update: {
          academic_year_id?: string | null
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          school_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_structures_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_locks: {
        Row: {
          class_subject_id: string
          created_at: string
          id: string
          is_locked: boolean
          is_released: boolean
          locked_at: string | null
          locked_by: string | null
          period: Database["public"]["Enums"]["period_type"]
          released_at: string | null
          released_by: string | null
          school_id: string | null
          updated_at: string
        }
        Insert: {
          class_subject_id: string
          created_at?: string
          id?: string
          is_locked?: boolean
          is_released?: boolean
          locked_at?: string | null
          locked_by?: string | null
          period: Database["public"]["Enums"]["period_type"]
          released_at?: string | null
          released_by?: string | null
          school_id?: string | null
          updated_at?: string
        }
        Update: {
          class_subject_id?: string
          created_at?: string
          id?: string
          is_locked?: boolean
          is_released?: boolean
          locked_at?: string | null
          locked_by?: string | null
          period?: Database["public"]["Enums"]["period_type"]
          released_at?: string | null
          released_by?: string | null
          school_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grade_locks_class_subject_id_fkey"
            columns: ["class_subject_id"]
            isOneToOne: false
            referencedRelation: "class_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_locks_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      installment_plans: {
        Row: {
          academic_year_id: string | null
          amount: number
          created_at: string
          department_id: string
          due_date: string | null
          id: string
          installment_number: number
          label: string
          period_label: string
          school_id: string | null
        }
        Insert: {
          academic_year_id?: string | null
          amount?: number
          created_at?: string
          department_id: string
          due_date?: string | null
          id?: string
          installment_number: number
          label: string
          period_label: string
          school_id?: string | null
        }
        Update: {
          academic_year_id?: string | null
          amount?: number
          created_at?: string
          department_id?: string
          due_date?: string | null
          id?: string
          installment_number?: number
          label?: string
          period_label?: string
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installment_plans_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installment_plans_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installment_plans_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_read: boolean
          message: string
          recipient_user_id: string | null
          school_id: string | null
          target_role: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_read?: boolean
          message: string
          recipient_user_id?: string | null
          school_id?: string | null
          target_role?: string | null
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_read?: boolean
          message?: string
          recipient_user_id?: string | null
          school_id?: string | null
          target_role?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_student_assignments: {
        Row: {
          created_at: string
          id: string
          parent_user_id: string
          school_id: string | null
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parent_user_id: string
          school_id?: string | null
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parent_user_id?: string
          school_id?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_student_assignments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_student_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          fee_assignment_id: string
          id: string
          notes: string | null
          payment_date: string
          payment_method: string
          receipt_number: string | null
          school_id: string | null
          student_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          fee_assignment_id: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          receipt_number?: string | null
          school_id?: string | null
          student_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          fee_assignment_id?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          receipt_number?: string | null
          school_id?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_fee_assignment_id_fkey"
            columns: ["fee_assignment_id"]
            isOneToOne: false
            referencedRelation: "fee_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          school_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id: string
          school_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          school_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      report_card_settings: {
        Row: {
          accent_color: string
          admin_signature_url: string | null
          administrator_role_label: string
          administrator_subtitle: string | null
          class_teacher_role_label: string
          class_teacher_subtitle: string | null
          created_at: string
          default_administrator_name: string | null
          default_class_teacher_name: string | null
          footer_note: string | null
          general_average_text_color: string
          grade_a_label: string
          grade_a_min: number
          grade_b_label: string
          grade_b_min: number
          grade_c_label: string
          grade_c_min: number
          grade_d_label: string
          grade_d_min: number
          grade_f_label: string
          header_address: string | null
          header_bg_color: string
          header_chip_color: string
          header_contact: string | null
          header_meta_text_color: string
          header_subtitle: string | null
          header_title: string | null
          header_website: string | null
          id: string
          kg_a_label: string
          kg_a_plus_label: string
          kg_b_label: string
          kg_b_plus_label: string
          kg_c_label: string
          kg_c_plus_label: string
          kg_d_label: string
          kg_f_label: string
          logo_url: string | null
          pass_mark: number
          school_id: string
          seal_url: string | null
          secondary_bg_color: string
          updated_at: string
        }
        Insert: {
          accent_color?: string
          admin_signature_url?: string | null
          administrator_role_label?: string
          administrator_subtitle?: string | null
          class_teacher_role_label?: string
          class_teacher_subtitle?: string | null
          created_at?: string
          default_administrator_name?: string | null
          default_class_teacher_name?: string | null
          footer_note?: string | null
          general_average_text_color?: string
          grade_a_label?: string
          grade_a_min?: number
          grade_b_label?: string
          grade_b_min?: number
          grade_c_label?: string
          grade_c_min?: number
          grade_d_label?: string
          grade_d_min?: number
          grade_f_label?: string
          header_address?: string | null
          header_bg_color?: string
          header_chip_color?: string
          header_contact?: string | null
          header_meta_text_color?: string
          header_subtitle?: string | null
          header_title?: string | null
          header_website?: string | null
          id?: string
          kg_a_label?: string
          kg_a_plus_label?: string
          kg_b_label?: string
          kg_b_plus_label?: string
          kg_c_label?: string
          kg_c_plus_label?: string
          kg_d_label?: string
          kg_f_label?: string
          logo_url?: string | null
          pass_mark?: number
          school_id: string
          seal_url?: string | null
          secondary_bg_color?: string
          updated_at?: string
        }
        Update: {
          accent_color?: string
          admin_signature_url?: string | null
          administrator_role_label?: string
          administrator_subtitle?: string | null
          class_teacher_role_label?: string
          class_teacher_subtitle?: string | null
          created_at?: string
          default_administrator_name?: string | null
          default_class_teacher_name?: string | null
          footer_note?: string | null
          general_average_text_color?: string
          grade_a_label?: string
          grade_a_min?: number
          grade_b_label?: string
          grade_b_min?: number
          grade_c_label?: string
          grade_c_min?: number
          grade_d_label?: string
          grade_d_min?: number
          grade_f_label?: string
          header_address?: string | null
          header_bg_color?: string
          header_chip_color?: string
          header_contact?: string | null
          header_meta_text_color?: string
          header_subtitle?: string | null
          header_title?: string | null
          header_website?: string | null
          id?: string
          kg_a_label?: string
          kg_a_plus_label?: string
          kg_b_label?: string
          kg_b_plus_label?: string
          kg_c_label?: string
          kg_c_plus_label?: string
          kg_d_label?: string
          kg_f_label?: string
          logo_url?: string | null
          pass_mark?: number
          school_id?: string
          seal_url?: string | null
          secondary_bg_color?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_card_settings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          created_at: string
          date: string
          description: string | null
          end_time: string
          id: string
          location: string | null
          school_id: string | null
          start_time: string
          subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          description?: string | null
          end_time: string
          id?: string
          location?: string | null
          school_id?: string | null
          start_time: string
          subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          end_time?: string
          id?: string
          location?: string | null
          school_id?: string | null
          start_time?: string
          subject?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          billable_student_count: number
          country: string | null
          created_at: string
          email: string | null
          id: string
          last_billing_snapshot_at: string | null
          lockout_started_at: string | null
          lockout_state: string
          logo_url: string | null
          max_students: number
          name: string
          owner_user_id: string | null
          phone: string | null
          primary_color: string | null
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_plan: string
          subscription_status: string
          subscription_tier: string
          trial_ends_at: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          billable_student_count?: number
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_billing_snapshot_at?: string | null
          lockout_started_at?: string | null
          lockout_state?: string
          logo_url?: string | null
          max_students?: number
          name: string
          owner_user_id?: string | null
          phone?: string | null
          primary_color?: string | null
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_plan?: string
          subscription_status?: string
          subscription_tier?: string
          trial_ends_at?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          billable_student_count?: number
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_billing_snapshot_at?: string | null
          lockout_started_at?: string | null
          lockout_state?: string
          logo_url?: string | null
          max_students?: number
          name?: string
          owner_user_id?: string | null
          phone?: string | null
          primary_color?: string | null
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_plan?: string
          subscription_status?: string
          subscription_tier?: string
          trial_ends_at?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      sponsor_class_assignments: {
        Row: {
          class_id: string
          created_at: string
          id: string
          school_id: string | null
          user_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          school_id?: string | null
          user_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          school_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_class_assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_class_assignments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      student_bill_items: {
        Row: {
          amount: number
          bill_id: string
          created_at: string
          id: string
          item_name: string
          item_type: string
          school_id: string | null
        }
        Insert: {
          amount?: number
          bill_id: string
          created_at?: string
          id?: string
          item_name: string
          item_type?: string
          school_id?: string | null
        }
        Update: {
          amount?: number
          bill_id?: string
          created_at?: string
          id?: string
          item_name?: string
          item_type?: string
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_bill_items_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "student_bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_bill_items_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      student_bills: {
        Row: {
          academic_year_id: string
          amount_paid: number
          balance: number
          created_at: string
          grand_total: number
          id: string
          registration_total: number
          school_id: string | null
          status: string
          student_id: string
          tuition_total: number
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          amount_paid?: number
          balance?: number
          created_at?: string
          grand_total?: number
          id?: string
          registration_total?: number
          school_id?: string | null
          status?: string
          student_id: string
          tuition_total?: number
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          amount_paid?: number
          balance?: number
          created_at?: string
          grand_total?: number
          id?: string
          registration_total?: number
          school_id?: string | null
          status?: string
          student_id?: string
          tuition_total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_bills_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_bills_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_bills_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_data_exports: {
        Row: {
          created_at: string
          created_by: string | null
          download_count: number
          expires_at: string
          export_type: string
          id: string
          school_id: string | null
          share_token: string | null
          storage_path: string | null
          student_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          download_count?: number
          expires_at?: string
          export_type?: string
          id?: string
          school_id?: string | null
          share_token?: string | null
          storage_path?: string | null
          student_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          download_count?: number
          expires_at?: string
          export_type?: string
          id?: string
          school_id?: string | null
          share_token?: string | null
          storage_path?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_data_exports_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_data_exports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_enrollments: {
        Row: {
          academic_year_id: string
          class_id: string
          created_at: string
          ended_at: string | null
          enrolled_at: string
          final_average: number | null
          id: string
          reason: string | null
          school_id: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          class_id: string
          created_at?: string
          ended_at?: string | null
          enrolled_at?: string
          final_average?: number | null
          id?: string
          reason?: string | null
          school_id?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          class_id?: string
          created_at?: string
          ended_at?: string | null
          enrolled_at?: string
          final_average?: number | null
          id?: string
          reason?: string | null
          school_id?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_grades: {
        Row: {
          assessment_type_id: string
          class_subject_id: string
          created_at: string
          id: string
          is_locked: boolean | null
          max_score: number
          period: Database["public"]["Enums"]["period_type"]
          school_id: string | null
          score: number | null
          student_id: string
          updated_at: string
        }
        Insert: {
          assessment_type_id: string
          class_subject_id: string
          created_at?: string
          id?: string
          is_locked?: boolean | null
          max_score: number
          period: Database["public"]["Enums"]["period_type"]
          school_id?: string | null
          score?: number | null
          student_id: string
          updated_at?: string
        }
        Update: {
          assessment_type_id?: string
          class_subject_id?: string
          created_at?: string
          id?: string
          is_locked?: boolean | null
          max_score?: number
          period?: Database["public"]["Enums"]["period_type"]
          school_id?: string | null
          score?: number | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_grades_assessment_type_id_fkey"
            columns: ["assessment_type_id"]
            isOneToOne: false
            referencedRelation: "assessment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_grades_class_subject_id_fkey"
            columns: ["class_subject_id"]
            isOneToOne: false
            referencedRelation: "class_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_grades_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_payments: {
        Row: {
          amount: number
          bill_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          payment_date: string
          payment_method: string
          receipt_number: string | null
          school_id: string | null
          student_id: string
        }
        Insert: {
          amount: number
          bill_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          receipt_number?: string | null
          school_id?: string | null
          student_id: string
        }
        Update: {
          amount?: number
          bill_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          receipt_number?: string | null
          school_id?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_payments_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "student_bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_payments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_period_totals: {
        Row: {
          class_rank: number | null
          class_subject_id: string
          created_at: string
          id: string
          period: Database["public"]["Enums"]["period_type"]
          school_id: string | null
          student_id: string
          total_score: number
          updated_at: string
        }
        Insert: {
          class_rank?: number | null
          class_subject_id: string
          created_at?: string
          id?: string
          period: Database["public"]["Enums"]["period_type"]
          school_id?: string | null
          student_id: string
          total_score?: number
          updated_at?: string
        }
        Update: {
          class_rank?: number | null
          class_subject_id?: string
          created_at?: string
          id?: string
          period?: Database["public"]["Enums"]["period_type"]
          school_id?: string | null
          student_id?: string
          total_score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_period_totals_class_subject_id_fkey"
            columns: ["class_subject_id"]
            isOneToOne: false
            referencedRelation: "class_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_period_totals_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_period_totals_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_report_inputs: {
        Row: {
          academic_year_id: string
          administrator_name: string | null
          behavior: string | null
          can_improve_in: string | null
          class_teacher_name: string | null
          created_at: string
          excels_in: string | null
          homework: string | null
          id: string
          participation: string | null
          period: string
          promotion_condition: string | null
          promotion_status: string | null
          punctuality: string | null
          school_id: string | null
          student_id: string
          teacher_comment: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          academic_year_id: string
          administrator_name?: string | null
          behavior?: string | null
          can_improve_in?: string | null
          class_teacher_name?: string | null
          created_at?: string
          excels_in?: string | null
          homework?: string | null
          id?: string
          participation?: string | null
          period: string
          promotion_condition?: string | null
          promotion_status?: string | null
          punctuality?: string | null
          school_id?: string | null
          student_id: string
          teacher_comment?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          academic_year_id?: string
          administrator_name?: string | null
          behavior?: string | null
          can_improve_in?: string | null
          class_teacher_name?: string | null
          created_at?: string
          excels_in?: string | null
          homework?: string | null
          id?: string
          participation?: string | null
          period?: string
          promotion_condition?: string | null
          promotion_status?: string | null
          punctuality?: string | null
          school_id?: string | null
          student_id?: string
          teacher_comment?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_report_inputs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_report_inputs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_yearly_totals: {
        Row: {
          class_rank: number | null
          class_subject_id: string
          created_at: string
          id: string
          school_id: string | null
          semester1_avg: number | null
          semester2_avg: number | null
          student_id: string
          updated_at: string
          yearly_avg: number | null
        }
        Insert: {
          class_rank?: number | null
          class_subject_id: string
          created_at?: string
          id?: string
          school_id?: string | null
          semester1_avg?: number | null
          semester2_avg?: number | null
          student_id: string
          updated_at?: string
          yearly_avg?: number | null
        }
        Update: {
          class_rank?: number | null
          class_subject_id?: string
          created_at?: string
          id?: string
          school_id?: string | null
          semester1_avg?: number | null
          semester2_avg?: number | null
          student_id?: string
          updated_at?: string
          yearly_avg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_yearly_totals_class_subject_id_fkey"
            columns: ["class_subject_id"]
            isOneToOne: false
            referencedRelation: "class_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_yearly_totals_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_yearly_totals_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          archive_summary: Json | null
          archived_at: string | null
          class_id: string
          country: string | null
          county: string | null
          created_at: string
          date_of_birth: string | null
          department_id: string
          departure_date: string | null
          departure_reason: string | null
          disability: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          ethnicity: string | null
          export_reminded_at: string | null
          father_contact: string | null
          father_name: string | null
          full_name: string
          gender: string | null
          health_issues: string | null
          id: string
          is_active: boolean
          mother_contact: string | null
          mother_name: string | null
          nationality: string | null
          phone_number: string | null
          photo_url: string | null
          previous_class: string | null
          previous_school: string | null
          religion: string | null
          retention_expires_at: string | null
          school_id: string | null
          status: Database["public"]["Enums"]["student_status"]
          student_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          archive_summary?: Json | null
          archived_at?: string | null
          class_id: string
          country?: string | null
          county?: string | null
          created_at?: string
          date_of_birth?: string | null
          department_id: string
          departure_date?: string | null
          departure_reason?: string | null
          disability?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          ethnicity?: string | null
          export_reminded_at?: string | null
          father_contact?: string | null
          father_name?: string | null
          full_name: string
          gender?: string | null
          health_issues?: string | null
          id?: string
          is_active?: boolean
          mother_contact?: string | null
          mother_name?: string | null
          nationality?: string | null
          phone_number?: string | null
          photo_url?: string | null
          previous_class?: string | null
          previous_school?: string | null
          religion?: string | null
          retention_expires_at?: string | null
          school_id?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          student_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          archive_summary?: Json | null
          archived_at?: string | null
          class_id?: string
          country?: string | null
          county?: string | null
          created_at?: string
          date_of_birth?: string | null
          department_id?: string
          departure_date?: string | null
          departure_reason?: string | null
          disability?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          ethnicity?: string | null
          export_reminded_at?: string | null
          father_contact?: string | null
          father_name?: string | null
          full_name?: string
          gender?: string | null
          health_issues?: string | null
          id?: string
          is_active?: boolean
          mother_contact?: string | null
          mother_name?: string | null
          nationality?: string | null
          phone_number?: string | null
          photo_url?: string | null
          previous_class?: string | null
          previous_school?: string | null
          religion?: string | null
          retention_expires_at?: string | null
          school_id?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          student_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_departments: {
        Row: {
          created_at: string
          department_id: string
          id: string
          school_id: string | null
          subject_id: string
        }
        Insert: {
          created_at?: string
          department_id: string
          id?: string
          school_id?: string | null
          subject_id: string
        }
        Update: {
          created_at?: string
          department_id?: string
          id?: string
          school_id?: string | null
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subject_departments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_departments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_departments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string
          created_at: string
          department_id: string | null
          description: string | null
          id: string
          name: string
          school_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          name: string
          school_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          name?: string
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subjects_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          school_id: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          school_id?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id?: string
          paddle_subscription_id?: string
          price_id?: string
          product_id?: string
          school_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
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
      user_schools: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          school_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          school_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          school_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_schools_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      archive_expired_students: { Args: never; Returns: number }
      can_manage_class_attendance: {
        Args: { _class_id: string }
        Returns: boolean
      }
      count_active_students: { Args: { p_school_id: string }; Returns: number }
      current_school_id: { Args: never; Returns: string }
      expire_stale_subscription_for_user: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      generate_all_student_bills: { Args: never; Returns: number }
      generate_student_bill: {
        Args: { p_student_id: string }
        Returns: undefined
      }
      get_billable_seats: { Args: { p_school_id: string }; Returns: number }
      get_student_period_ranks: {
        Args: {
          p_periods: Database["public"]["Enums"]["period_type"][]
          p_student_id: string
        }
        Returns: {
          class_rank: number
          is_incomplete: boolean
          period: Database["public"]["Enums"]["period_type"]
          total_score: number
          total_students: number
        }[]
      }
      get_student_period_ranks_for_class: {
        Args: {
          p_class_id: string
          p_periods: Database["public"]["Enums"]["period_type"][]
          p_student_id: string
        }
        Returns: {
          class_rank: number
          is_incomplete: boolean
          period: Database["public"]["Enums"]["period_type"]
          total_score: number
          total_students: number
        }[]
      }
      get_teacher_students: {
        Args: never
        Returns: {
          class_id: string
          created_at: string
          date_of_birth: string
          department_id: string
          full_name: string
          gender: string
          id: string
          photo_url: string
          student_id: string
          updated_at: string
          user_id: string
        }[]
      }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_grade_locked: {
        Args: {
          _class_subject_id: string
          _period: Database["public"]["Enums"]["period_type"]
        }
        Returns: boolean
      }
      is_super_admin: { Args: never; Returns: boolean }
      mark_student_departed: {
        Args: {
          p_departure_date?: string
          p_reason?: string
          p_status: Database["public"]["Enums"]["student_status"]
          p_student_id: string
        }
        Returns: undefined
      }
      students_expiring_within: {
        Args: { p_days: number }
        Returns: {
          days_left: number
          full_name: string
          retention_expires_at: string
          school_id: string
          student_id: string
        }[]
      }
      write_audit_log: {
        Args: {
          p_action: string
          p_entity_id: string
          p_entity_type: string
          p_metadata?: Json
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "teacher"
        | "student"
        | "parent"
        | "super_admin"
        | "registrar"
        | "vpi"
      attendance_status: "present" | "absent" | "excused"
      department_type: "elementary" | "junior_high" | "senior_high"
      period_type:
        | "p1"
        | "p2"
        | "p3"
        | "p4"
        | "p5"
        | "p6"
        | "exam_s1"
        | "exam_s2"
        | "semester1"
        | "semester2"
        | "yearly"
      semester_type: "semester1" | "semester2"
      student_status:
        | "active"
        | "graduated"
        | "transferred"
        | "withdrawn"
        | "expelled"
        | "archived"
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
        "teacher",
        "student",
        "parent",
        "super_admin",
        "registrar",
        "vpi",
      ],
      attendance_status: ["present", "absent", "excused"],
      department_type: ["elementary", "junior_high", "senior_high"],
      period_type: [
        "p1",
        "p2",
        "p3",
        "p4",
        "p5",
        "p6",
        "exam_s1",
        "exam_s2",
        "semester1",
        "semester2",
        "yearly",
      ],
      semester_type: ["semester1", "semester2"],
      student_status: [
        "active",
        "graduated",
        "transferred",
        "withdrawn",
        "expelled",
        "archived",
      ],
    },
  },
} as const
