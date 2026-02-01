export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  game: {
    Tables: {
      auras: {
        Row: {
          base_duration_ms: number;
          duration_hasted: boolean;
          hasted_ticks: boolean;
          max_duration_ms: number;
          max_stacks: number;
          pandemic_refresh: boolean;
          patch_version: string;
          periodic_type: string | null;
          refresh_behavior: string;
          rolling_periodic: boolean;
          spell_id: number;
          tick_may_crit: boolean;
          tick_on_application: boolean;
          tick_period_ms: number;
          updated_at: string;
        };
        Insert: {
          base_duration_ms?: number;
          duration_hasted?: boolean;
          hasted_ticks?: boolean;
          max_duration_ms?: number;
          max_stacks?: number;
          pandemic_refresh?: boolean;
          patch_version: string;
          periodic_type?: string | null;
          refresh_behavior?: string;
          rolling_periodic?: boolean;
          spell_id: number;
          tick_may_crit?: boolean;
          tick_on_application?: boolean;
          tick_period_ms?: number;
          updated_at?: string;
        };
        Update: {
          base_duration_ms?: number;
          duration_hasted?: boolean;
          hasted_ticks?: boolean;
          max_duration_ms?: number;
          max_stacks?: number;
          pandemic_refresh?: boolean;
          patch_version?: string;
          periodic_type?: string | null;
          refresh_behavior?: string;
          rolling_periodic?: boolean;
          spell_id?: number;
          tick_may_crit?: boolean;
          tick_on_application?: boolean;
          tick_period_ms?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      classes: {
        Row: {
          color: string;
          file_name: string;
          filename: string;
          icon_file_id: number;
          id: number;
          name: string;
          patch_version: string;
          primary_stat_priority: number;
          roles_mask: number;
          spell_class_set: number;
          updated_at: string | null;
        };
        Insert: {
          color?: string;
          file_name?: string;
          filename?: string;
          icon_file_id?: number;
          id: number;
          name: string;
          patch_version: string;
          primary_stat_priority?: number;
          roles_mask?: number;
          spell_class_set?: number;
          updated_at?: string | null;
        };
        Update: {
          color?: string;
          file_name?: string;
          filename?: string;
          icon_file_id?: number;
          id?: number;
          name?: string;
          patch_version?: string;
          primary_stat_priority?: number;
          roles_mask?: number;
          spell_class_set?: number;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      curve_points: {
        Row: {
          curve_id: number;
          id: number;
          order_index: number;
          patch_version: string;
          pos_0: number;
          pos_1: number;
          pos_pre_squish_0: number;
          pos_pre_squish_1: number;
          updated_at: string;
        };
        Insert: {
          curve_id: number;
          id: number;
          order_index?: number;
          patch_version: string;
          pos_0?: number;
          pos_1?: number;
          pos_pre_squish_0?: number;
          pos_pre_squish_1?: number;
          updated_at?: string;
        };
        Update: {
          curve_id?: number;
          id?: number;
          order_index?: number;
          patch_version?: string;
          pos_0?: number;
          pos_1?: number;
          pos_pre_squish_0?: number;
          pos_pre_squish_1?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      curves: {
        Row: {
          flags: number;
          id: number;
          patch_version: string;
          type: number;
          updated_at: string;
        };
        Insert: {
          flags?: number;
          id: number;
          patch_version: string;
          type?: number;
          updated_at?: string;
        };
        Update: {
          flags?: number;
          id?: number;
          patch_version?: string;
          type?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      global_colors: {
        Row: {
          color: string;
          id: number;
          name: string;
          patch_version: string;
          updated_at: string | null;
        };
        Insert: {
          color?: string;
          id: number;
          name: string;
          patch_version: string;
          updated_at?: string | null;
        };
        Update: {
          color?: string;
          id?: number;
          name?: string;
          patch_version?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      global_strings: {
        Row: {
          flags: number;
          id: number;
          patch_version: string;
          tag: string;
          updated_at: string | null;
          value: string;
        };
        Insert: {
          flags?: number;
          id: number;
          patch_version: string;
          tag: string;
          updated_at?: string | null;
          value?: string;
        };
        Update: {
          flags?: number;
          id?: number;
          patch_version?: string;
          tag?: string;
          updated_at?: string | null;
          value?: string;
        };
        Relationships: [];
      };
      item_bonuses: {
        Row: {
          id: number;
          order_index: number;
          parent_item_bonus_list_id: number;
          patch_version: string;
          type: number;
          updated_at: string;
          value_0: number;
          value_1: number;
          value_2: number;
          value_3: number;
        };
        Insert: {
          id: number;
          order_index?: number;
          parent_item_bonus_list_id?: number;
          patch_version: string;
          type?: number;
          updated_at?: string;
          value_0?: number;
          value_1?: number;
          value_2?: number;
          value_3?: number;
        };
        Update: {
          id?: number;
          order_index?: number;
          parent_item_bonus_list_id?: number;
          patch_version?: string;
          type?: number;
          updated_at?: string;
          value_0?: number;
          value_1?: number;
          value_2?: number;
          value_3?: number;
        };
        Relationships: [];
      };
      items: {
        Row: {
          allowable_class: number;
          allowable_race: number;
          binding: number;
          buy_price: number;
          class_id: number;
          classification: Json | null;
          description: string;
          dmg_variance: number;
          drop_sources: Json;
          effects: Json;
          expansion_id: number;
          file_name: string;
          flags: number[];
          gem_properties: number;
          id: number;
          inventory_type: number;
          item_level: number;
          item_set_id: number;
          max_count: number;
          modified_crafting_reagent_item_id: number;
          name: string;
          patch_version: string;
          quality: number;
          required_level: number;
          sell_price: number;
          set_info: Json | null;
          socket_bonus_enchant_id: number;
          sockets: number[];
          speed: number;
          stackable: number;
          stats: Json;
          subclass_id: number;
          updated_at: string;
        };
        Insert: {
          allowable_class?: number;
          allowable_race?: number;
          binding?: number;
          buy_price?: number;
          class_id?: number;
          classification?: Json | null;
          description?: string;
          dmg_variance?: number;
          drop_sources?: Json;
          effects?: Json;
          expansion_id?: number;
          file_name?: string;
          flags?: number[];
          gem_properties?: number;
          id: number;
          inventory_type?: number;
          item_level?: number;
          item_set_id?: number;
          max_count?: number;
          modified_crafting_reagent_item_id?: number;
          name: string;
          patch_version: string;
          quality?: number;
          required_level?: number;
          sell_price?: number;
          set_info?: Json | null;
          socket_bonus_enchant_id?: number;
          sockets?: number[];
          speed?: number;
          stackable?: number;
          stats?: Json;
          subclass_id?: number;
          updated_at?: string;
        };
        Update: {
          allowable_class?: number;
          allowable_race?: number;
          binding?: number;
          buy_price?: number;
          class_id?: number;
          classification?: Json | null;
          description?: string;
          dmg_variance?: number;
          drop_sources?: Json;
          effects?: Json;
          expansion_id?: number;
          file_name?: string;
          flags?: number[];
          gem_properties?: number;
          id?: number;
          inventory_type?: number;
          item_level?: number;
          item_set_id?: number;
          max_count?: number;
          modified_crafting_reagent_item_id?: number;
          name?: string;
          patch_version?: string;
          quality?: number;
          required_level?: number;
          sell_price?: number;
          set_info?: Json | null;
          socket_bonus_enchant_id?: number;
          sockets?: number[];
          speed?: number;
          stackable?: number;
          stats?: Json;
          subclass_id?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      rand_prop_points: {
        Row: {
          damage_replace_stat: number;
          damage_replace_stat_f: number;
          damage_secondary: number;
          damage_secondary_f: number;
          epic_0: number;
          epic_1: number;
          epic_2: number;
          epic_3: number;
          epic_4: number;
          epic_f_0: number;
          epic_f_1: number;
          epic_f_2: number;
          epic_f_3: number;
          epic_f_4: number;
          good_0: number;
          good_1: number;
          good_2: number;
          good_3: number;
          good_4: number;
          good_f_0: number;
          good_f_1: number;
          good_f_2: number;
          good_f_3: number;
          good_f_4: number;
          id: number;
          patch_version: string;
          superior_0: number;
          superior_1: number;
          superior_2: number;
          superior_3: number;
          superior_4: number;
          superior_f_0: number;
          superior_f_1: number;
          superior_f_2: number;
          superior_f_3: number;
          superior_f_4: number;
          updated_at: string;
        };
        Insert: {
          damage_replace_stat?: number;
          damage_replace_stat_f?: number;
          damage_secondary?: number;
          damage_secondary_f?: number;
          epic_0?: number;
          epic_1?: number;
          epic_2?: number;
          epic_3?: number;
          epic_4?: number;
          epic_f_0?: number;
          epic_f_1?: number;
          epic_f_2?: number;
          epic_f_3?: number;
          epic_f_4?: number;
          good_0?: number;
          good_1?: number;
          good_2?: number;
          good_3?: number;
          good_4?: number;
          good_f_0?: number;
          good_f_1?: number;
          good_f_2?: number;
          good_f_3?: number;
          good_f_4?: number;
          id: number;
          patch_version: string;
          superior_0?: number;
          superior_1?: number;
          superior_2?: number;
          superior_3?: number;
          superior_4?: number;
          superior_f_0?: number;
          superior_f_1?: number;
          superior_f_2?: number;
          superior_f_3?: number;
          superior_f_4?: number;
          updated_at?: string;
        };
        Update: {
          damage_replace_stat?: number;
          damage_replace_stat_f?: number;
          damage_secondary?: number;
          damage_secondary_f?: number;
          epic_0?: number;
          epic_1?: number;
          epic_2?: number;
          epic_3?: number;
          epic_4?: number;
          epic_f_0?: number;
          epic_f_1?: number;
          epic_f_2?: number;
          epic_f_3?: number;
          epic_f_4?: number;
          good_0?: number;
          good_1?: number;
          good_2?: number;
          good_3?: number;
          good_4?: number;
          good_f_0?: number;
          good_f_1?: number;
          good_f_2?: number;
          good_f_3?: number;
          good_f_4?: number;
          id?: number;
          patch_version?: string;
          superior_0?: number;
          superior_1?: number;
          superior_2?: number;
          superior_3?: number;
          superior_4?: number;
          superior_f_0?: number;
          superior_f_1?: number;
          superior_f_2?: number;
          superior_f_3?: number;
          superior_f_4?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      specs: {
        Row: {
          class_id: number;
          class_name: string;
          description: string;
          file_name: string;
          icon_file_id: number;
          id: number;
          mastery_spell_id_0: number;
          mastery_spell_id_1: number;
          name: string;
          order_index: number;
          patch_version: string;
          primary_stat_priority: number;
          role: number;
          updated_at: string;
        };
        Insert: {
          class_id: number;
          class_name?: string;
          description?: string;
          file_name?: string;
          icon_file_id?: number;
          id: number;
          mastery_spell_id_0?: number;
          mastery_spell_id_1?: number;
          name: string;
          order_index?: number;
          patch_version: string;
          primary_stat_priority?: number;
          role?: number;
          updated_at?: string;
        };
        Update: {
          class_id?: number;
          class_name?: string;
          description?: string;
          file_name?: string;
          icon_file_id?: number;
          id?: number;
          mastery_spell_id_0?: number;
          mastery_spell_id_1?: number;
          name?: string;
          order_index?: number;
          patch_version?: string;
          primary_stat_priority?: number;
          role?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      specs_traits: {
        Row: {
          all_node_ids: number[];
          class_name: string;
          edges: Json;
          nodes: Json;
          patch_version: string;
          point_limits: Json;
          spec_id: number;
          spec_name: string;
          sub_trees: Json;
          tree_id: number;
          updated_at: string;
        };
        Insert: {
          all_node_ids?: number[];
          class_name: string;
          edges?: Json;
          nodes?: Json;
          patch_version: string;
          point_limits?: Json;
          spec_id: number;
          spec_name: string;
          sub_trees?: Json;
          tree_id: number;
          updated_at?: string;
        };
        Update: {
          all_node_ids?: number[];
          class_name?: string;
          edges?: Json;
          nodes?: Json;
          patch_version?: string;
          point_limits?: Json;
          spec_id?: number;
          spec_name?: string;
          sub_trees?: Json;
          tree_id?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      spells: {
        Row: {
          attributes: number[];
          aura_description: string;
          base_level: number;
          bonus_coefficient_from_ap: number;
          can_empower: boolean;
          cast_time: number;
          caster_aura_spell: number;
          caster_aura_state: number;
          charge_recovery_time: number;
          cone_degrees: number;
          defense_type: number;
          description: string;
          description_variables: string;
          dispel_type: number;
          duration: number;
          effect_bonus_coefficient: number;
          effect_trigger_spell: number[];
          effects: Json;
          empower_stages: Json;
          exclude_caster_aura_spell: number;
          exclude_caster_aura_state: number;
          exclude_target_aura_spell: number;
          exclude_target_aura_state: number;
          facing_caster_flags: number;
          file_name: string;
          id: number;
          implicit_target: number[];
          interrupt_aura_0: number;
          interrupt_aura_1: number;
          interrupt_channel_0: number;
          interrupt_channel_1: number;
          interrupt_flags: number;
          is_passive: boolean;
          knowledge_source: Json;
          learn_spells: Json;
          mana_cost: number;
          max_charges: number;
          max_duration: number;
          max_level: number;
          max_passive_aura_level: number;
          name: string;
          patch_version: string;
          power_cost: number;
          power_cost_pct: number;
          power_type: number;
          radius_max: number;
          radius_min: number;
          range_max_0: number;
          range_max_1: number;
          range_min_0: number;
          range_min_1: number;
          recovery_time: number;
          replacement_spell_id: number;
          required_totem_category_0: number;
          required_totem_category_1: number;
          school_mask: number;
          shapeshift_exclude_0: number;
          shapeshift_exclude_1: number;
          shapeshift_mask_0: number;
          shapeshift_mask_1: number;
          speed: number;
          spell_class_mask_1: number;
          spell_class_mask_2: number;
          spell_class_mask_3: number;
          spell_class_mask_4: number;
          spell_class_set: number;
          spell_level: number;
          stance_bar_order: number;
          start_recovery_time: number;
          target_aura_spell: number;
          target_aura_state: number;
          totem_0: number;
          totem_1: number;
          updated_at: string;
        };
        Insert: {
          attributes?: number[];
          aura_description?: string;
          base_level?: number;
          bonus_coefficient_from_ap?: number;
          can_empower?: boolean;
          cast_time?: number;
          caster_aura_spell?: number;
          caster_aura_state?: number;
          charge_recovery_time?: number;
          cone_degrees?: number;
          defense_type?: number;
          description?: string;
          description_variables?: string;
          dispel_type?: number;
          duration?: number;
          effect_bonus_coefficient?: number;
          effect_trigger_spell?: number[];
          effects?: Json;
          empower_stages?: Json;
          exclude_caster_aura_spell?: number;
          exclude_caster_aura_state?: number;
          exclude_target_aura_spell?: number;
          exclude_target_aura_state?: number;
          facing_caster_flags?: number;
          file_name?: string;
          id: number;
          implicit_target?: number[];
          interrupt_aura_0?: number;
          interrupt_aura_1?: number;
          interrupt_channel_0?: number;
          interrupt_channel_1?: number;
          interrupt_flags?: number;
          is_passive?: boolean;
          knowledge_source?: Json;
          learn_spells?: Json;
          mana_cost?: number;
          max_charges?: number;
          max_duration?: number;
          max_level?: number;
          max_passive_aura_level?: number;
          name: string;
          patch_version: string;
          power_cost?: number;
          power_cost_pct?: number;
          power_type?: number;
          radius_max?: number;
          radius_min?: number;
          range_max_0?: number;
          range_max_1?: number;
          range_min_0?: number;
          range_min_1?: number;
          recovery_time?: number;
          replacement_spell_id?: number;
          required_totem_category_0?: number;
          required_totem_category_1?: number;
          school_mask?: number;
          shapeshift_exclude_0?: number;
          shapeshift_exclude_1?: number;
          shapeshift_mask_0?: number;
          shapeshift_mask_1?: number;
          speed?: number;
          spell_class_mask_1?: number;
          spell_class_mask_2?: number;
          spell_class_mask_3?: number;
          spell_class_mask_4?: number;
          spell_class_set?: number;
          spell_level?: number;
          stance_bar_order?: number;
          start_recovery_time?: number;
          target_aura_spell?: number;
          target_aura_state?: number;
          totem_0?: number;
          totem_1?: number;
          updated_at?: string;
        };
        Update: {
          attributes?: number[];
          aura_description?: string;
          base_level?: number;
          bonus_coefficient_from_ap?: number;
          can_empower?: boolean;
          cast_time?: number;
          caster_aura_spell?: number;
          caster_aura_state?: number;
          charge_recovery_time?: number;
          cone_degrees?: number;
          defense_type?: number;
          description?: string;
          description_variables?: string;
          dispel_type?: number;
          duration?: number;
          effect_bonus_coefficient?: number;
          effect_trigger_spell?: number[];
          effects?: Json;
          empower_stages?: Json;
          exclude_caster_aura_spell?: number;
          exclude_caster_aura_state?: number;
          exclude_target_aura_spell?: number;
          exclude_target_aura_state?: number;
          facing_caster_flags?: number;
          file_name?: string;
          id?: number;
          implicit_target?: number[];
          interrupt_aura_0?: number;
          interrupt_aura_1?: number;
          interrupt_channel_0?: number;
          interrupt_channel_1?: number;
          interrupt_flags?: number;
          is_passive?: boolean;
          knowledge_source?: Json;
          learn_spells?: Json;
          mana_cost?: number;
          max_charges?: number;
          max_duration?: number;
          max_level?: number;
          max_passive_aura_level?: number;
          name?: string;
          patch_version?: string;
          power_cost?: number;
          power_cost_pct?: number;
          power_type?: number;
          radius_max?: number;
          radius_min?: number;
          range_max_0?: number;
          range_max_1?: number;
          range_min_0?: number;
          range_min_1?: number;
          recovery_time?: number;
          replacement_spell_id?: number;
          required_totem_category_0?: number;
          required_totem_category_1?: number;
          school_mask?: number;
          shapeshift_exclude_0?: number;
          shapeshift_exclude_1?: number;
          shapeshift_mask_0?: number;
          shapeshift_mask_1?: number;
          speed?: number;
          spell_class_mask_1?: number;
          spell_class_mask_2?: number;
          spell_class_mask_3?: number;
          spell_class_mask_4?: number;
          spell_class_set?: number;
          spell_level?: number;
          stance_bar_order?: number;
          start_recovery_time?: number;
          target_aura_spell?: number;
          target_aura_state?: number;
          totem_0?: number;
          totem_1?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      jobs: {
        Row: {
          access_type: string;
          completed_at: string | null;
          completed_iterations: number;
          config_hash: string;
          created_at: string;
          discord_server_id: string | null;
          id: string;
          result: Json | null;
          status: string;
          total_iterations: number;
          user_id: string;
        };
        Insert: {
          access_type?: string;
          completed_at?: string | null;
          completed_iterations?: number;
          config_hash: string;
          created_at?: string;
          discord_server_id?: string | null;
          id?: string;
          result?: Json | null;
          status?: string;
          total_iterations: number;
          user_id: string;
        };
        Update: {
          access_type?: string;
          completed_at?: string | null;
          completed_iterations?: number;
          config_hash?: string;
          created_at?: string;
          discord_server_id?: string | null;
          id?: string;
          result?: Json | null;
          status?: string;
          total_iterations?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "jobs_config_hash_fkey";
            columns: ["config_hash"];
            isOneToOne: false;
            referencedRelation: "jobs_configs";
            referencedColumns: ["hash"];
          },
        ];
      };
      jobs_chunks: {
        Row: {
          claimed_at: string | null;
          completed_at: string | null;
          config_hash: string;
          created_at: string;
          id: string;
          iterations: number;
          job_id: string;
          node_id: string | null;
          result: Json | null;
          seed_offset: number;
          status: string;
        };
        Insert: {
          claimed_at?: string | null;
          completed_at?: string | null;
          config_hash: string;
          created_at?: string;
          id?: string;
          iterations: number;
          job_id: string;
          node_id?: string | null;
          result?: Json | null;
          seed_offset: number;
          status?: string;
        };
        Update: {
          claimed_at?: string | null;
          completed_at?: string | null;
          config_hash?: string;
          created_at?: string;
          id?: string;
          iterations?: number;
          job_id?: string;
          node_id?: string | null;
          result?: Json | null;
          seed_offset?: number;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "jobs_chunks_config_hash_fkey";
            columns: ["config_hash"];
            isOneToOne: false;
            referencedRelation: "jobs_configs";
            referencedColumns: ["hash"];
          },
          {
            foreignKeyName: "jobs_chunks_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "jobs_chunks_node_id_fkey";
            columns: ["node_id"];
            isOneToOne: false;
            referencedRelation: "nodes";
            referencedColumns: ["id"];
          },
        ];
      };
      jobs_configs: {
        Row: {
          config: Json;
          created_at: string;
          hash: string;
          last_used_at: string;
        };
        Insert: {
          config: Json;
          created_at?: string;
          hash: string;
          last_used_at?: string;
        };
        Update: {
          config?: Json;
          created_at?: string;
          hash?: string;
          last_used_at?: string;
        };
        Relationships: [];
      };
      nodes: {
        Row: {
          created_at: string;
          id: string;
          last_seen_at: string | null;
          max_parallel: number;
          name: string;
          platform: string;
          public_key: string;
          status: string;
          total_cores: number;
          user_id: string;
          version: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          last_seen_at?: string | null;
          max_parallel?: number;
          name?: string;
          platform?: string;
          public_key: string;
          status?: string;
          total_cores?: number;
          user_id: string;
          version?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          last_seen_at?: string | null;
          max_parallel?: number;
          name?: string;
          platform?: string;
          public_key?: string;
          status?: string;
          total_cores?: number;
          user_id?: string;
          version?: string;
        };
        Relationships: [];
      };
      nodes_permissions: {
        Row: {
          access_type: string;
          created_at: string;
          id: string;
          node_id: string;
          target_id: string | null;
        };
        Insert: {
          access_type: string;
          created_at?: string;
          id?: string;
          node_id: string;
          target_id?: string | null;
        };
        Update: {
          access_type?: string;
          created_at?: string;
          id?: string;
          node_id?: string;
          target_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "nodes_permissions_node_id_fkey";
            columns: ["node_id"];
            isOneToOne: false;
            referencedRelation: "nodes";
            referencedColumns: ["id"];
          },
        ];
      };
      rotations: {
        Row: {
          checksum: string | null;
          created_at: string;
          current_version: number;
          description: string | null;
          forked_from_id: string | null;
          id: string;
          is_public: boolean;
          name: string;
          script: string;
          slug: string;
          spec_id: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          checksum?: string | null;
          created_at?: string;
          current_version?: number;
          description?: string | null;
          forked_from_id?: string | null;
          id?: string;
          is_public?: boolean;
          name: string;
          script: string;
          slug: string;
          spec_id: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          checksum?: string | null;
          created_at?: string;
          current_version?: number;
          description?: string | null;
          forked_from_id?: string | null;
          id?: string;
          is_public?: boolean;
          name?: string;
          script?: string;
          slug?: string;
          spec_id?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rotations_forked_from_id_fkey";
            columns: ["forked_from_id"];
            isOneToOne: false;
            referencedRelation: "rotations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rotations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      rotations_versions: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          message: string | null;
          rotation_id: string;
          script: string;
          version: number;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          message?: string | null;
          rotation_id: string;
          script: string;
          version: number;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          message?: string | null;
          rotation_id?: string;
          script?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "rotations_versions_rotation_id_fkey";
            columns: ["rotation_id"];
            isOneToOne: false;
            referencedRelation: "rotations";
            referencedColumns: ["id"];
          },
        ];
      };
      sentinel_notification_subscriptions: {
        Row: {
          channel_id: string;
          created_at: string | null;
          created_by: string | null;
          event_type: string;
          guild_id: string;
          id: string;
        };
        Insert: {
          channel_id: string;
          created_at?: string | null;
          created_by?: string | null;
          event_type: string;
          guild_id: string;
          id?: string;
        };
        Update: {
          channel_id?: string;
          created_at?: string | null;
          created_by?: string | null;
          event_type?: string;
          guild_id?: string;
          id?: string;
        };
        Relationships: [];
      };
      short_urls: {
        Row: {
          created_at: string;
          slug: string;
          target_url: string;
        };
        Insert: {
          created_at?: string;
          slug: string;
          target_url: string;
        };
        Update: {
          created_at?: string;
          slug?: string;
          target_url?: string;
        };
        Relationships: [];
      };
      sim_profiles: {
        Row: {
          category: string;
          description: string;
          id: string;
          label: string;
          order: number;
        };
        Insert: {
          category: string;
          description: string;
          id: string;
          label: string;
          order?: number;
        };
        Update: {
          category?: string;
          description?: string;
          id?: string;
          label?: string;
          order?: number;
        };
        Relationships: [];
      };
      user_profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          handle: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          handle: string;
          id: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          handle?: string;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_reserved_handles: {
        Row: {
          created_at: string;
          handle: string;
          reason: string | null;
        };
        Insert: {
          created_at?: string;
          handle: string;
          reason?: string | null;
        };
        Update: {
          created_at?: string;
          handle?: string;
          reason?: string | null;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          claim_token: string;
          compact_mode: boolean;
          created_at: string;
          default_fight_duration: number;
          default_iterations: number;
          id: string;
          show_tooltips: boolean;
          theme: string;
          updated_at: string;
        };
        Insert: {
          claim_token?: string;
          compact_mode?: boolean;
          created_at?: string;
          default_fight_duration?: number;
          default_iterations?: number;
          id: string;
          show_tooltips?: boolean;
          theme?: string;
          updated_at?: string;
        };
        Update: {
          claim_token?: string;
          compact_mode?: boolean;
          created_at?: string;
          default_fight_duration?: number;
          default_iterations?: number;
          id?: string;
          show_tooltips?: boolean;
          theme?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_job:
        | {
            Args: {
              p_access_type?: string;
              p_config: Json;
              p_discord_server_id?: string;
              p_iterations: number;
            };
            Returns: Json;
          }
        | {
            Args: {
              p_access_type?: string;
              p_config_hash: string;
              p_discord_server_id?: string;
              p_iterations: number;
            };
            Returns: Json;
          };
      delete_own_account: { Args: never; Returns: undefined };
      generate_claim_token: { Args: never; Returns: string };
      generate_default_handle: { Args: { user_id: string }; Returns: string };
      generate_random_seed: { Args: never; Returns: string };
      get_or_create_short_url: {
        Args: { p_target_url: string; p_user_id?: string };
        Returns: string;
      };
      regenerate_claim_token: { Args: never; Returns: string };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export const Constants = {
  game: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
