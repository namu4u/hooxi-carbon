// ──────────────────────────────────────────────────────────────────────────────
// Supabase 스키마 타입
// 실제 DB와 동기화: supabase gen types typescript --project-id <id> > src/types/supabase.ts
// NOTE: GenericTable 호환을 위해 Relationships: [] 필드 필수 포함
// ──────────────────────────────────────────────────────────────────────────────
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// ─── Enum 타입 ───────────────────────────────────────────────────────────────
export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "contracted"
  | "processing"
  | "completed"
  | "disqualified";

export type CertStage =
  | "draft"
  | "field_verify"
  | "moe_submitted"
  | "moe_approved"
  | "issued"
  | "sold"
  | "settled";

export type ContractStatus = "pending" | "signed" | "cancelled";

export type LeadTier = "A" | "B" | "C" | "D";

// ─── Database 인터페이스 ──────────────────────────────────────────────────────
export interface Database {
  public: {
    Tables: {
      // ── leads ──────────────────────────────────────────────
      leads: {
        Row: {
          id: string;
          company_name: string;
          contact_name: string;
          contact_title: string | null;
          email: string;
          phone: string;
          sector_code: string | null;
          equip_types: Json;
          elec_tier: number | null;
          employee_tier: number | null;
          kcu_history: number | null;
          ets_allocated: boolean;
          score: number;
          tier: LeadTier | null;
          status: LeadStatus;
          est_net_value: number | null;
          consultant_id: string | null;
          stibee_subscriber_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_name: string;
          contact_name: string;
          contact_title?: string | null;
          email: string;
          phone: string;
          sector_code?: string | null;
          equip_types?: Json;
          elec_tier?: number | null;
          employee_tier?: number | null;
          kcu_history?: number | null;
          ets_allocated?: boolean;
          score?: number;
          tier?: LeadTier | null;
          status?: LeadStatus;
          est_net_value?: number | null;
          consultant_id?: string | null;
          stibee_subscriber_id?: string | null;
          notes?: string | null;
        };
        Update: {
          company_name?: string;
          contact_name?: string;
          contact_title?: string | null;
          email?: string;
          phone?: string;
          sector_code?: string | null;
          equip_types?: Json;
          elec_tier?: number | null;
          employee_tier?: number | null;
          kcu_history?: number | null;
          ets_allocated?: boolean;
          score?: number;
          tier?: LeadTier | null;
          status?: LeadStatus;
          est_net_value?: number | null;
          consultant_id?: string | null;
          stibee_subscriber_id?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ── kcu_certifications ─────────────────────────────────
      kcu_certifications: {
        Row: {
          id: string;
          lead_id: string;
          equip_code: string;
          install_year: number | null;
          stage: CertStage;
          stage_updated_at: string;
          est_kcu_volume: number | null;
          actual_kcu_volume: number | null;
          kcu_price: number | null;
          gross_value: number | null;
          fee_rate: number;
          net_value: number | null;
          settlement_date: string | null;
          moe_receipt_no: string | null;
          field_verify_date: string | null;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          equip_code: string;
          install_year?: number | null;
          stage?: CertStage;
          stage_updated_at?: string;
          est_kcu_volume?: number | null;
          actual_kcu_volume?: number | null;
          kcu_price?: number | null;
          gross_value?: number | null;
          fee_rate?: number;
          net_value?: number | null;
          settlement_date?: string | null;
          moe_receipt_no?: string | null;
          field_verify_date?: string | null;
          note?: string | null;
        };
        Update: {
          equip_code?: string;
          install_year?: number | null;
          stage?: CertStage;
          stage_updated_at?: string;
          est_kcu_volume?: number | null;
          actual_kcu_volume?: number | null;
          kcu_price?: number | null;
          gross_value?: number | null;
          fee_rate?: number;
          net_value?: number | null;
          settlement_date?: string | null;
          moe_receipt_no?: string | null;
          field_verify_date?: string | null;
          note?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "kcu_certifications_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          }
        ];
      };

      // ── algo_params ────────────────────────────────────────
      algo_params: {
        Row: {
          id: string;
          sector_code: string;
          equip_code: string;
          alpha: number;
          beta: number;
          kcu_price_ref: number;
          eligible: boolean;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          sector_code: string;
          equip_code: string;
          alpha: number;
          beta: number;
          kcu_price_ref: number;
          eligible?: boolean;
          updated_by?: string | null;
        };
        Update: {
          sector_code?: string;
          equip_code?: string;
          alpha?: number;
          beta?: number;
          kcu_price_ref?: number;
          eligible?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };

      // ── contracts ──────────────────────────────────────────
      contracts: {
        Row: {
          id: string;
          lead_id: string;
          fee_rate: number;
          signed_at: string | null;
          signature_data: Json | null;
          pdf_url: string | null;
          status: ContractStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          fee_rate?: number;
          signed_at?: string | null;
          signature_data?: Json | null;
          pdf_url?: string | null;
          status?: ContractStatus;
        };
        Update: {
          fee_rate?: number;
          signed_at?: string | null;
          signature_data?: Json | null;
          pdf_url?: string | null;
          status?: ContractStatus;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contracts_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          }
        ];
      };

      // ── magic_links ────────────────────────────────────────
      magic_links: {
        Row: {
          id: string;
          lead_id: string;
          token: string;
          expires_at: string;
          used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          token: string;
          expires_at: string;
          used_at?: string | null;
        };
        Update: {
          used_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "magic_links_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          }
        ];
      };
    };

    Views: { [_ in never]: never };
    Functions: {
      current_lead_id: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: {
      lead_status: LeadStatus;
      cert_stage: CertStage;
      contract_status: ContractStatus;
    };
  };
}
