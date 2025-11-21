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
      changelog: {
        Row: {
          changes: Json
          createdAt: string
          id: string
          updatedAt: string
          version: string
        }
        Insert: {
          changes: Json
          createdAt?: string
          id?: string
          updatedAt?: string
          version: string
        }
        Update: {
          changes?: Json
          createdAt?: string
          id?: string
          updatedAt?: string
          version?: string
        }
        Relationships: []
      }
      item_data: {
        Row: {
          allowableClass: string
          allowableRace: string
          classId: number
          createdAt: string
          description: string
          iconName: string
          id: number
          inventoryType: number
          itemLevel: number
          name: string
          quality: number
          requiredLevel: number
          subclassId: number
          updatedAt: string
        }
        Insert: {
          allowableClass?: string
          allowableRace?: string
          classId?: number
          createdAt?: string
          description?: string
          iconName?: string
          id: number
          inventoryType?: number
          itemLevel?: number
          name?: string
          quality?: number
          requiredLevel?: number
          subclassId?: number
          updatedAt?: string
        }
        Update: {
          allowableClass?: string
          allowableRace?: string
          classId?: number
          createdAt?: string
          description?: string
          iconName?: string
          id?: number
          inventoryType?: number
          itemLevel?: number
          name?: string
          quality?: number
          requiredLevel?: number
          subclassId?: number
          updatedAt?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatarUrl: string | null
          createdAt: string
          email: string
          handle: string
          id: string
          updatedAt: string
        }
        Insert: {
          avatarUrl?: string | null
          createdAt?: string
          email: string
          handle: string
          id: string
          updatedAt?: string
        }
        Update: {
          avatarUrl?: string | null
          createdAt?: string
          email?: string
          handle?: string
          id?: string
          updatedAt?: string
        }
        Relationships: []
      }
      reserved_handles: {
        Row: {
          createdAt: string
          handle: string
          reason: string | null
        }
        Insert: {
          createdAt?: string
          handle: string
          reason?: string | null
        }
        Update: {
          createdAt?: string
          handle?: string
          reason?: string | null
        }
        Relationships: []
      }
      rotation_sim_results: {
        Row: {
          createdAt: string
          duration: number
          fightType: string
          gearSet: string
          id: string
          iterations: number
          maxDps: number
          meanDps: number
          minDps: number
          patch: string
          rotationId: string
          scenario: string
          simVersion: string
          statWeights: Json | null
          stdDev: number | null
          timeline: Json | null
        }
        Insert: {
          createdAt?: string
          duration: number
          fightType: string
          gearSet?: string
          id?: string
          iterations: number
          maxDps: number
          meanDps: number
          minDps: number
          patch: string
          rotationId: string
          scenario?: string
          simVersion: string
          statWeights?: Json | null
          stdDev?: number | null
          timeline?: Json | null
        }
        Update: {
          createdAt?: string
          duration?: number
          fightType?: string
          gearSet?: string
          id?: string
          iterations?: number
          maxDps?: number
          meanDps?: number
          minDps?: number
          patch?: string
          rotationId?: string
          scenario?: string
          simVersion?: string
          statWeights?: Json | null
          stdDev?: number | null
          timeline?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "rotation_sim_results_rotation_id_fkey"
            columns: ["rotationId"]
            isOneToOne: false
            referencedRelation: "rotations"
            referencedColumns: ["id"]
          },
        ]
      }
      rotations: {
        Row: {
          class: string
          config: Json | null
          createdAt: string
          deletedAt: string | null
          description: string | null
          id: string
          name: string
          namespace: string
          parentId: string | null
          patchRange: string
          publishedAt: string | null
          script: string
          slug: string
          spec: string
          status: string
          updatedAt: string
          userId: string
          version: number
          visibility: string
        }
        Insert: {
          class: string
          config?: Json | null
          createdAt?: string
          deletedAt?: string | null
          description?: string | null
          id?: string
          name: string
          namespace: string
          parentId?: string | null
          patchRange?: string
          publishedAt?: string | null
          script: string
          slug: string
          spec: string
          status?: string
          updatedAt?: string
          userId: string
          version?: number
          visibility?: string
        }
        Update: {
          class?: string
          config?: Json | null
          createdAt?: string
          deletedAt?: string | null
          description?: string | null
          id?: string
          name?: string
          namespace?: string
          parentId?: string | null
          patchRange?: string
          publishedAt?: string | null
          script?: string
          slug?: string
          spec?: string
          status?: string
          updatedAt?: string
          userId?: string
          version?: number
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "rotations_parent_id_fkey"
            columns: ["parentId"]
            isOneToOne: false
            referencedRelation: "rotations"
            referencedColumns: ["id"]
          },
        ]
      }
      spell_data: {
        Row: {
          attributes: Json
          canEmpower: boolean
          castTime: number
          coneDegrees: number
          cooldown: number
          createdAt: string
          defenseType: number
          dispelType: number
          duration: number
          durationMax: number
          empowerStages: Json
          facingFlags: number
          gcd: number
          iconName: string
          id: number
          interruptAura0: number
          interruptAura1: number
          interruptChannel0: number
          interruptChannel1: number
          interruptFlags: number
          manaCost: number
          maxCharges: number
          missileSpeed: number
          name: string
          radiusMax: number
          radiusMin: number
          rangeAllyMax: number
          rangeAllyMin: number
          rangeEnemyMax: number
          rangeEnemyMin: number
          rechargeTime: number
          scalingAttackPower: number
          scalingSpellPower: number
          schoolMask: number
          targeting: Json
          triggers: Json
          updatedAt: string
        }
        Insert: {
          attributes?: Json
          canEmpower?: boolean
          castTime?: number
          coneDegrees?: number
          cooldown?: number
          createdAt?: string
          defenseType?: number
          dispelType?: number
          duration?: number
          durationMax?: number
          empowerStages?: Json
          facingFlags?: number
          gcd?: number
          iconName?: string
          id: number
          interruptAura0?: number
          interruptAura1?: number
          interruptChannel0?: number
          interruptChannel1?: number
          interruptFlags?: number
          manaCost?: number
          maxCharges?: number
          missileSpeed?: number
          name?: string
          radiusMax?: number
          radiusMin?: number
          rangeAllyMax?: number
          rangeAllyMin?: number
          rangeEnemyMax?: number
          rangeEnemyMin?: number
          rechargeTime?: number
          scalingAttackPower?: number
          scalingSpellPower?: number
          schoolMask?: number
          targeting?: Json
          triggers?: Json
          updatedAt?: string
        }
        Update: {
          attributes?: Json
          canEmpower?: boolean
          castTime?: number
          coneDegrees?: number
          cooldown?: number
          createdAt?: string
          defenseType?: number
          dispelType?: number
          duration?: number
          durationMax?: number
          empowerStages?: Json
          facingFlags?: number
          gcd?: number
          iconName?: string
          id?: number
          interruptAura0?: number
          interruptAura1?: number
          interruptChannel0?: number
          interruptChannel1?: number
          interruptFlags?: number
          manaCost?: number
          maxCharges?: number
          missileSpeed?: number
          name?: string
          radiusMax?: number
          radiusMin?: number
          rangeAllyMax?: number
          rangeAllyMin?: number
          rangeEnemyMax?: number
          rangeEnemyMin?: number
          rechargeTime?: number
          scalingAttackPower?: number
          scalingSpellPower?: number
          schoolMask?: number
          targeting?: Json
          triggers?: Json
          updatedAt?: string
        }
        Relationships: []
      }
    }
    Views: {
      spec_rankings_hourly: {
        Row: {
          avg_dps: number | null
          class: string | null
          last_updated: string | null
          max_dps: number | null
          median_dps: number | null
          min_dps: number | null
          sim_count: number | null
          spec: string | null
        }
        Relationships: []
      }
      top_sims_daily: {
        Row: {
          author: string | null
          class: string | null
          dps: number | null
          gear_set: string | null
          id: string | null
          last_updated: string | null
          rotation_name: string | null
          scenario: string | null
          sim_date: string | null
          spec: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_default_handle: { Args: { user_id: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
