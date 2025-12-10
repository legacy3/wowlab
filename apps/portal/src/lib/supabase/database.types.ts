export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      changelog: {
        Row: {
          changes: Json;
          createdAt: string;
          id: string;
          updatedAt: string;
          version: string;
        };
        Insert: {
          changes: Json;
          createdAt?: string;
          id?: string;
          updatedAt?: string;
          version: string;
        };
        Update: {
          changes?: Json;
          createdAt?: string;
          id?: string;
          updatedAt?: string;
          version?: string;
        };
        Relationships: [];
      };
      fight_profiles: {
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
      reserved_handles: {
        Row: {
          createdAt: string;
          handle: string;
          reason: string | null;
        };
        Insert: {
          createdAt?: string;
          handle: string;
          reason?: string | null;
        };
        Update: {
          createdAt?: string;
          handle?: string;
          reason?: string | null;
        };
        Relationships: [];
      };
      rotations: {
        Row: {
          class: string;
          createdAt: string;
          description: string | null;
          forkedFromId: string | null;
          id: string;
          isPublic: boolean;
          name: string;
          script: string;
          slug: string;
          spec: string;
          updatedAt: string;
          userId: string;
        };
        Insert: {
          class: string;
          createdAt?: string;
          description?: string | null;
          forkedFromId?: string | null;
          id?: string;
          isPublic?: boolean;
          name: string;
          script: string;
          slug: string;
          spec: string;
          updatedAt?: string;
          userId: string;
        };
        Update: {
          class?: string;
          createdAt?: string;
          description?: string | null;
          forkedFromId?: string | null;
          id?: string;
          isPublic?: boolean;
          name?: string;
          script?: string;
          slug?: string;
          spec?: string;
          updatedAt?: string;
          userId?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rotations_forkedFromId_fkey";
            columns: ["forkedFromId"];
            isOneToOne: false;
            referencedRelation: "rotations";
            referencedColumns: ["id"];
          },
        ];
      };
      user_profiles: {
        Row: {
          avatarUrl: string | null;
          createdAt: string;
          email: string;
          handle: string;
          id: string;
          updatedAt: string;
        };
        Insert: {
          avatarUrl?: string | null;
          createdAt?: string;
          email: string;
          handle: string;
          id: string;
          updatedAt?: string;
        };
        Update: {
          avatarUrl?: string | null;
          createdAt?: string;
          email?: string;
          handle?: string;
          id?: string;
          updatedAt?: string;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          compactMode: boolean | null;
          createdAt: string | null;
          defaultFightDuration: number | null;
          defaultIterations: number | null;
          id: string;
          showTooltips: boolean | null;
          theme: string | null;
          updatedAt: string | null;
        };
        Insert: {
          compactMode?: boolean | null;
          createdAt?: string | null;
          defaultFightDuration?: number | null;
          defaultIterations?: number | null;
          id: string;
          showTooltips?: boolean | null;
          theme?: string | null;
          updatedAt?: string | null;
        };
        Update: {
          compactMode?: boolean | null;
          createdAt?: string | null;
          defaultFightDuration?: number | null;
          defaultIterations?: number | null;
          id?: string;
          showTooltips?: boolean | null;
          theme?: string | null;
          updatedAt?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      // Materialized view - hardcoded VALUES, all columns non-null
      view_most_wanted_items: {
        Row: {
          classes: string[];
          dpsGain: number;
          id: number;
          itemLevel: number;
          name: string;
          quality: number;
          rank: number;
          slot: string;
          source: string;
        };
        Relationships: [];
      };
      // Materialized view - mock spec rankings
      view_spec_rankings_hourly: {
        Row: {
          avgDps: number;
          class: string;
          maxDps: number;
          medianDps: number;
          minDps: number;
          simCount: number;
          spec: string;
          updatedAt: string;
        };
        Relationships: [];
      };
      // Materialized view - mock top sims
      view_top_sims_daily: {
        Row: {
          author: string;
          class: string;
          dps: number;
          gearSet: string;
          id: string;
          rotationName: string;
          scenario: string;
          simDate: string;
          spec: string;
          updatedAt: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      generate_default_handle: { Args: { user_id: string }; Returns: string };
      generate_random_seed: { Args: never; Returns: string };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  raw_dbc: {
    Tables: {
      chr_classes: {
        Row: {
          AlteredFormCharacterCreationIdleVisualFallback: number | null;
          ArmorTypeMask: number | null;
          AttackPowerPerAgility: number | null;
          AttackPowerPerStrength: number | null;
          CharacterCreationAnimLoopWaitTimeMsFallback: number | null;
          CharacterCreationGroundVisualFallback: number | null;
          CharacterCreationIdleGroundVisualFallback: number | null;
          CinematicSequenceID: number | null;
          ClassColorB: number | null;
          ClassColorG: number | null;
          ClassColorR: number | null;
          CreateScreenFileDataID: number | null;
          DamageBonusStat: number | null;
          DefaultSpec: number | null;
          Description_lang: string | null;
          DisabledString_lang: string | null;
          DisplayPower: number | null;
          FemaleCharacterCreationIdleVisualFallback: number | null;
          FemaleCharacterCreationVisualFallback: number | null;
          Field_9_0_1_34490_018: number | null;
          Filename: string | null;
          Flags: number | null;
          HasRelicSlot: number | null;
          HasStrengthAttackBonus: number | null;
          Hyphenated_name_female_lang: string | null;
          Hyphenated_name_male_lang: string | null;
          IconFileDataID: number | null;
          ID: number;
          LowResScreenFileDataID: number | null;
          MaleCharacterCreationIdleVisualFallback: number | null;
          MaleCharacterCreationVisualFallback: number | null;
          Name_female_lang: string | null;
          Name_lang: string | null;
          Name_male_lang: string | null;
          PetNameToken: string | null;
          PrimaryStatPriority: number | null;
          RangedAttackPowerPerAgility: number | null;
          RoleInfoString_lang: string | null;
          RolesMask: number | null;
          SelectScreenFileDataID: number | null;
          SpellClassSet: number | null;
          SpellTextureBlobFileDataID: number | null;
          StartingLevel: number | null;
        };
        Insert: {
          AlteredFormCharacterCreationIdleVisualFallback?: number | null;
          ArmorTypeMask?: number | null;
          AttackPowerPerAgility?: number | null;
          AttackPowerPerStrength?: number | null;
          CharacterCreationAnimLoopWaitTimeMsFallback?: number | null;
          CharacterCreationGroundVisualFallback?: number | null;
          CharacterCreationIdleGroundVisualFallback?: number | null;
          CinematicSequenceID?: number | null;
          ClassColorB?: number | null;
          ClassColorG?: number | null;
          ClassColorR?: number | null;
          CreateScreenFileDataID?: number | null;
          DamageBonusStat?: number | null;
          DefaultSpec?: number | null;
          Description_lang?: string | null;
          DisabledString_lang?: string | null;
          DisplayPower?: number | null;
          FemaleCharacterCreationIdleVisualFallback?: number | null;
          FemaleCharacterCreationVisualFallback?: number | null;
          Field_9_0_1_34490_018?: number | null;
          Filename?: string | null;
          Flags?: number | null;
          HasRelicSlot?: number | null;
          HasStrengthAttackBonus?: number | null;
          Hyphenated_name_female_lang?: string | null;
          Hyphenated_name_male_lang?: string | null;
          IconFileDataID?: number | null;
          ID: number;
          LowResScreenFileDataID?: number | null;
          MaleCharacterCreationIdleVisualFallback?: number | null;
          MaleCharacterCreationVisualFallback?: number | null;
          Name_female_lang?: string | null;
          Name_lang?: string | null;
          Name_male_lang?: string | null;
          PetNameToken?: string | null;
          PrimaryStatPriority?: number | null;
          RangedAttackPowerPerAgility?: number | null;
          RoleInfoString_lang?: string | null;
          RolesMask?: number | null;
          SelectScreenFileDataID?: number | null;
          SpellClassSet?: number | null;
          SpellTextureBlobFileDataID?: number | null;
          StartingLevel?: number | null;
        };
        Update: {
          AlteredFormCharacterCreationIdleVisualFallback?: number | null;
          ArmorTypeMask?: number | null;
          AttackPowerPerAgility?: number | null;
          AttackPowerPerStrength?: number | null;
          CharacterCreationAnimLoopWaitTimeMsFallback?: number | null;
          CharacterCreationGroundVisualFallback?: number | null;
          CharacterCreationIdleGroundVisualFallback?: number | null;
          CinematicSequenceID?: number | null;
          ClassColorB?: number | null;
          ClassColorG?: number | null;
          ClassColorR?: number | null;
          CreateScreenFileDataID?: number | null;
          DamageBonusStat?: number | null;
          DefaultSpec?: number | null;
          Description_lang?: string | null;
          DisabledString_lang?: string | null;
          DisplayPower?: number | null;
          FemaleCharacterCreationIdleVisualFallback?: number | null;
          FemaleCharacterCreationVisualFallback?: number | null;
          Field_9_0_1_34490_018?: number | null;
          Filename?: string | null;
          Flags?: number | null;
          HasRelicSlot?: number | null;
          HasStrengthAttackBonus?: number | null;
          Hyphenated_name_female_lang?: string | null;
          Hyphenated_name_male_lang?: string | null;
          IconFileDataID?: number | null;
          ID?: number;
          LowResScreenFileDataID?: number | null;
          MaleCharacterCreationIdleVisualFallback?: number | null;
          MaleCharacterCreationVisualFallback?: number | null;
          Name_female_lang?: string | null;
          Name_lang?: string | null;
          Name_male_lang?: string | null;
          PetNameToken?: string | null;
          PrimaryStatPriority?: number | null;
          RangedAttackPowerPerAgility?: number | null;
          RoleInfoString_lang?: string | null;
          RolesMask?: number | null;
          SelectScreenFileDataID?: number | null;
          SpellClassSet?: number | null;
          SpellTextureBlobFileDataID?: number | null;
          StartingLevel?: number | null;
        };
        Relationships: [];
      };
      chr_specialization: {
        Row: {
          AnimReplacements: number | null;
          ClassID: number | null;
          Description_lang: string | null;
          FemaleName_lang: string | null;
          Flags: number | null;
          ID: number;
          MasterySpellID_0: number | null;
          MasterySpellID_1: number | null;
          Name_lang: string | null;
          OrderIndex: number | null;
          PetTalentType: number | null;
          PrimaryStatPriority: number | null;
          Role: number | null;
          SpellIconFileID: number | null;
        };
        Insert: {
          AnimReplacements?: number | null;
          ClassID?: number | null;
          Description_lang?: string | null;
          FemaleName_lang?: string | null;
          Flags?: number | null;
          ID: number;
          MasterySpellID_0?: number | null;
          MasterySpellID_1?: number | null;
          Name_lang?: string | null;
          OrderIndex?: number | null;
          PetTalentType?: number | null;
          PrimaryStatPriority?: number | null;
          Role?: number | null;
          SpellIconFileID?: number | null;
        };
        Update: {
          AnimReplacements?: number | null;
          ClassID?: number | null;
          Description_lang?: string | null;
          FemaleName_lang?: string | null;
          Flags?: number | null;
          ID?: number;
          MasterySpellID_0?: number | null;
          MasterySpellID_1?: number | null;
          Name_lang?: string | null;
          OrderIndex?: number | null;
          PetTalentType?: number | null;
          PrimaryStatPriority?: number | null;
          Role?: number | null;
          SpellIconFileID?: number | null;
        };
        Relationships: [];
      };
      content_tuning_x_expected: {
        Row: {
          ContentTuningID: number;
          ExpectedStatModID: number;
          ID: number;
          MaxMythicPlusSeasonID: number | null;
          MinMythicPlusSeasonID: number | null;
        };
        Insert: {
          ContentTuningID: number;
          ExpectedStatModID: number;
          ID: number;
          MaxMythicPlusSeasonID?: number | null;
          MinMythicPlusSeasonID?: number | null;
        };
        Update: {
          ContentTuningID?: number;
          ExpectedStatModID?: number;
          ID?: number;
          MaxMythicPlusSeasonID?: number | null;
          MinMythicPlusSeasonID?: number | null;
        };
        Relationships: [];
      };
      difficulty: {
        Row: {
          FallbackDifficultyID: number | null;
          Field_1_15_4_56400_013: number | null;
          Flags: number | null;
          GroupSizeDmgCurveID: number | null;
          GroupSizeHealthCurveID: number | null;
          GroupSizeSpellPointsCurveID: number | null;
          ID: number;
          InstanceType: number | null;
          ItemContext: number | null;
          MaxPlayers: number | null;
          MinPlayers: number | null;
          Name_lang: string;
          OldEnumValue: number | null;
          OrderIndex: number | null;
          ToggleDifficultyID: number | null;
        };
        Insert: {
          FallbackDifficultyID?: number | null;
          Field_1_15_4_56400_013?: number | null;
          Flags?: number | null;
          GroupSizeDmgCurveID?: number | null;
          GroupSizeHealthCurveID?: number | null;
          GroupSizeSpellPointsCurveID?: number | null;
          ID: number;
          InstanceType?: number | null;
          ItemContext?: number | null;
          MaxPlayers?: number | null;
          MinPlayers?: number | null;
          Name_lang: string;
          OldEnumValue?: number | null;
          OrderIndex?: number | null;
          ToggleDifficultyID?: number | null;
        };
        Update: {
          FallbackDifficultyID?: number | null;
          Field_1_15_4_56400_013?: number | null;
          Flags?: number | null;
          GroupSizeDmgCurveID?: number | null;
          GroupSizeHealthCurveID?: number | null;
          GroupSizeSpellPointsCurveID?: number | null;
          ID?: number;
          InstanceType?: number | null;
          ItemContext?: number | null;
          MaxPlayers?: number | null;
          MinPlayers?: number | null;
          Name_lang?: string;
          OldEnumValue?: number | null;
          OrderIndex?: number | null;
          ToggleDifficultyID?: number | null;
        };
        Relationships: [];
      };
      expected_stat: {
        Row: {
          ArmorConstant: number | null;
          ContentSetID: number | null;
          CreatureArmor: number | null;
          CreatureAutoAttackDps: number | null;
          CreatureHealth: number | null;
          CreatureSpellDamage: number | null;
          ExpansionID: number | null;
          ID: number;
          Lvl: number | null;
          PlayerHealth: number | null;
          PlayerMana: number | null;
          PlayerPrimaryStat: number | null;
          PlayerSecondaryStat: number | null;
        };
        Insert: {
          ArmorConstant?: number | null;
          ContentSetID?: number | null;
          CreatureArmor?: number | null;
          CreatureAutoAttackDps?: number | null;
          CreatureHealth?: number | null;
          CreatureSpellDamage?: number | null;
          ExpansionID?: number | null;
          ID: number;
          Lvl?: number | null;
          PlayerHealth?: number | null;
          PlayerMana?: number | null;
          PlayerPrimaryStat?: number | null;
          PlayerSecondaryStat?: number | null;
        };
        Update: {
          ArmorConstant?: number | null;
          ContentSetID?: number | null;
          CreatureArmor?: number | null;
          CreatureAutoAttackDps?: number | null;
          CreatureHealth?: number | null;
          CreatureSpellDamage?: number | null;
          ExpansionID?: number | null;
          ID?: number;
          Lvl?: number | null;
          PlayerHealth?: number | null;
          PlayerMana?: number | null;
          PlayerPrimaryStat?: number | null;
          PlayerSecondaryStat?: number | null;
        };
        Relationships: [];
      };
      expected_stat_mod: {
        Row: {
          ArmorConstantMod: number | null;
          CreatureArmorMod: number | null;
          CreatureAutoAttackDPSMod: number | null;
          CreatureHealthMod: number | null;
          CreatureSpellDamageMod: number | null;
          ID: number;
          PlayerHealthMod: number | null;
          PlayerManaMod: number | null;
          PlayerPrimaryStatMod: number | null;
          PlayerSecondaryStatMod: number | null;
        };
        Insert: {
          ArmorConstantMod?: number | null;
          CreatureArmorMod?: number | null;
          CreatureAutoAttackDPSMod?: number | null;
          CreatureHealthMod?: number | null;
          CreatureSpellDamageMod?: number | null;
          ID: number;
          PlayerHealthMod?: number | null;
          PlayerManaMod?: number | null;
          PlayerPrimaryStatMod?: number | null;
          PlayerSecondaryStatMod?: number | null;
        };
        Update: {
          ArmorConstantMod?: number | null;
          CreatureArmorMod?: number | null;
          CreatureAutoAttackDPSMod?: number | null;
          CreatureHealthMod?: number | null;
          CreatureSpellDamageMod?: number | null;
          ID?: number;
          PlayerHealthMod?: number | null;
          PlayerManaMod?: number | null;
          PlayerPrimaryStatMod?: number | null;
          PlayerSecondaryStatMod?: number | null;
        };
        Relationships: [];
      };
      item: {
        Row: {
          ClassID: number | null;
          ContentTuningID: number | null;
          CraftingQualityID: number | null;
          Field_12_0_0_63534_010: number | null;
          Field_12_0_0_63534_012: number | null;
          Field_12_0_0_63534_013: number | null;
          Field_12_0_0_63534_014: number | null;
          IconFileDataID: number | null;
          ID: number;
          InventoryType: number | null;
          ItemGroupSoundsID: number | null;
          Material: number | null;
          ModifiedCraftingReagentItemID: number | null;
          SheatheType: number | null;
          Sound_override_subclassID: number | null;
          SubclassID: number | null;
        };
        Insert: {
          ClassID?: number | null;
          ContentTuningID?: number | null;
          CraftingQualityID?: number | null;
          Field_12_0_0_63534_010?: number | null;
          Field_12_0_0_63534_012?: number | null;
          Field_12_0_0_63534_013?: number | null;
          Field_12_0_0_63534_014?: number | null;
          IconFileDataID?: number | null;
          ID: number;
          InventoryType?: number | null;
          ItemGroupSoundsID?: number | null;
          Material?: number | null;
          ModifiedCraftingReagentItemID?: number | null;
          SheatheType?: number | null;
          Sound_override_subclassID?: number | null;
          SubclassID?: number | null;
        };
        Update: {
          ClassID?: number | null;
          ContentTuningID?: number | null;
          CraftingQualityID?: number | null;
          Field_12_0_0_63534_010?: number | null;
          Field_12_0_0_63534_012?: number | null;
          Field_12_0_0_63534_013?: number | null;
          Field_12_0_0_63534_014?: number | null;
          IconFileDataID?: number | null;
          ID?: number;
          InventoryType?: number | null;
          ItemGroupSoundsID?: number | null;
          Material?: number | null;
          ModifiedCraftingReagentItemID?: number | null;
          SheatheType?: number | null;
          Sound_override_subclassID?: number | null;
          SubclassID?: number | null;
        };
        Relationships: [];
      };
      item_effect: {
        Row: {
          CategoryCoolDownMSec: number | null;
          Charges: number | null;
          ChrSpecializationID: number | null;
          CoolDownMSec: number | null;
          ID: number;
          LegacySlotIndex: number | null;
          PlayerConditionID: number | null;
          SpellCategoryID: number | null;
          SpellID: number;
          TriggerType: number | null;
        };
        Insert: {
          CategoryCoolDownMSec?: number | null;
          Charges?: number | null;
          ChrSpecializationID?: number | null;
          CoolDownMSec?: number | null;
          ID: number;
          LegacySlotIndex?: number | null;
          PlayerConditionID?: number | null;
          SpellCategoryID?: number | null;
          SpellID: number;
          TriggerType?: number | null;
        };
        Update: {
          CategoryCoolDownMSec?: number | null;
          Charges?: number | null;
          ChrSpecializationID?: number | null;
          CoolDownMSec?: number | null;
          ID?: number;
          LegacySlotIndex?: number | null;
          PlayerConditionID?: number | null;
          SpellCategoryID?: number | null;
          SpellID?: number;
          TriggerType?: number | null;
        };
        Relationships: [];
      };
      item_sparse: {
        Row: {
          AllowableClass: number | null;
          AllowableRace: number | null;
          ArtifactID: number | null;
          BagFamily: number | null;
          Bonding: number | null;
          BuyPrice: number | null;
          ContainerSlots: number | null;
          ContentTuningID: number | null;
          DamageType: number | null;
          Description_lang: string | null;
          Display_lang: string | null;
          Display1_lang: string | null;
          Display2_lang: string | null;
          Display3_lang: string | null;
          DmgVariance: number | null;
          DurationInInventory: number | null;
          ExpansionID: number | null;
          Field_12_0_0_63534_032: number | null;
          Field_12_0_0_63534_033: number | null;
          Field_12_0_0_63534_034: number | null;
          Flags_0: number | null;
          Flags_1: number | null;
          Flags_2: number | null;
          Flags_3: number | null;
          Flags_4: number | null;
          Gem_properties: number | null;
          ID: number;
          InstanceBound: number | null;
          InventoryType: number | null;
          ItemDelay: number | null;
          ItemLevel: number | null;
          ItemNameDescriptionID: number | null;
          ItemRange: number | null;
          ItemSet: number | null;
          LanguageID: number | null;
          LimitCategory: number | null;
          LockID: number | null;
          Material: number | null;
          MaxCount: number | null;
          MinFactionID: number | null;
          MinReputation: number | null;
          ModifiedCraftingReagentItemID: number | null;
          OppositeFactionItemID: number | null;
          OverallQualityID: number | null;
          PageID: number | null;
          PageMaterialID: number | null;
          PlayerLevelToItemLevelCurveID: number | null;
          PriceRandomValue: number | null;
          PriceVariance: number | null;
          QualityModifier: number | null;
          RequiredAbility: number | null;
          RequiredHoliday: number | null;
          RequiredLevel: number | null;
          RequiredPVPMedal: number | null;
          RequiredPVPRank: number | null;
          RequiredSkill: number | null;
          RequiredSkillRank: number | null;
          RequiredTransmogHoliday: number | null;
          SellPrice: number | null;
          SheatheType: number | null;
          Socket_match_enchantment_ID: number | null;
          SocketType_0: number | null;
          SocketType_1: number | null;
          SocketType_2: number | null;
          SpellWeight: number | null;
          SpellWeightCategory: number | null;
          Stackable: number | null;
          StartQuestID: number | null;
          StatModifier_bonusStat_0: number | null;
          StatModifier_bonusStat_1: number | null;
          StatModifier_bonusStat_2: number | null;
          StatModifier_bonusStat_3: number | null;
          StatModifier_bonusStat_4: number | null;
          StatModifier_bonusStat_5: number | null;
          StatModifier_bonusStat_6: number | null;
          StatModifier_bonusStat_7: number | null;
          StatModifier_bonusStat_8: number | null;
          StatModifier_bonusStat_9: number | null;
          StatPercentageOfSocket_0: number | null;
          StatPercentageOfSocket_1: number | null;
          StatPercentageOfSocket_2: number | null;
          StatPercentageOfSocket_3: number | null;
          StatPercentageOfSocket_4: number | null;
          StatPercentageOfSocket_5: number | null;
          StatPercentageOfSocket_6: number | null;
          StatPercentageOfSocket_7: number | null;
          StatPercentageOfSocket_8: number | null;
          StatPercentageOfSocket_9: number | null;
          StatPercentEditor_0: number | null;
          StatPercentEditor_1: number | null;
          StatPercentEditor_2: number | null;
          StatPercentEditor_3: number | null;
          StatPercentEditor_4: number | null;
          StatPercentEditor_5: number | null;
          StatPercentEditor_6: number | null;
          StatPercentEditor_7: number | null;
          StatPercentEditor_8: number | null;
          StatPercentEditor_9: number | null;
          TotemCategoryID: number | null;
          VendorStackCount: number | null;
          ZoneBound_0: number | null;
          ZoneBound_1: number | null;
        };
        Insert: {
          AllowableClass?: number | null;
          AllowableRace?: number | null;
          ArtifactID?: number | null;
          BagFamily?: number | null;
          Bonding?: number | null;
          BuyPrice?: number | null;
          ContainerSlots?: number | null;
          ContentTuningID?: number | null;
          DamageType?: number | null;
          Description_lang?: string | null;
          Display_lang?: string | null;
          Display1_lang?: string | null;
          Display2_lang?: string | null;
          Display3_lang?: string | null;
          DmgVariance?: number | null;
          DurationInInventory?: number | null;
          ExpansionID?: number | null;
          Field_12_0_0_63534_032?: number | null;
          Field_12_0_0_63534_033?: number | null;
          Field_12_0_0_63534_034?: number | null;
          Flags_0?: number | null;
          Flags_1?: number | null;
          Flags_2?: number | null;
          Flags_3?: number | null;
          Flags_4?: number | null;
          Gem_properties?: number | null;
          ID: number;
          InstanceBound?: number | null;
          InventoryType?: number | null;
          ItemDelay?: number | null;
          ItemLevel?: number | null;
          ItemNameDescriptionID?: number | null;
          ItemRange?: number | null;
          ItemSet?: number | null;
          LanguageID?: number | null;
          LimitCategory?: number | null;
          LockID?: number | null;
          Material?: number | null;
          MaxCount?: number | null;
          MinFactionID?: number | null;
          MinReputation?: number | null;
          ModifiedCraftingReagentItemID?: number | null;
          OppositeFactionItemID?: number | null;
          OverallQualityID?: number | null;
          PageID?: number | null;
          PageMaterialID?: number | null;
          PlayerLevelToItemLevelCurveID?: number | null;
          PriceRandomValue?: number | null;
          PriceVariance?: number | null;
          QualityModifier?: number | null;
          RequiredAbility?: number | null;
          RequiredHoliday?: number | null;
          RequiredLevel?: number | null;
          RequiredPVPMedal?: number | null;
          RequiredPVPRank?: number | null;
          RequiredSkill?: number | null;
          RequiredSkillRank?: number | null;
          RequiredTransmogHoliday?: number | null;
          SellPrice?: number | null;
          SheatheType?: number | null;
          Socket_match_enchantment_ID?: number | null;
          SocketType_0?: number | null;
          SocketType_1?: number | null;
          SocketType_2?: number | null;
          SpellWeight?: number | null;
          SpellWeightCategory?: number | null;
          Stackable?: number | null;
          StartQuestID?: number | null;
          StatModifier_bonusStat_0?: number | null;
          StatModifier_bonusStat_1?: number | null;
          StatModifier_bonusStat_2?: number | null;
          StatModifier_bonusStat_3?: number | null;
          StatModifier_bonusStat_4?: number | null;
          StatModifier_bonusStat_5?: number | null;
          StatModifier_bonusStat_6?: number | null;
          StatModifier_bonusStat_7?: number | null;
          StatModifier_bonusStat_8?: number | null;
          StatModifier_bonusStat_9?: number | null;
          StatPercentageOfSocket_0?: number | null;
          StatPercentageOfSocket_1?: number | null;
          StatPercentageOfSocket_2?: number | null;
          StatPercentageOfSocket_3?: number | null;
          StatPercentageOfSocket_4?: number | null;
          StatPercentageOfSocket_5?: number | null;
          StatPercentageOfSocket_6?: number | null;
          StatPercentageOfSocket_7?: number | null;
          StatPercentageOfSocket_8?: number | null;
          StatPercentageOfSocket_9?: number | null;
          StatPercentEditor_0?: number | null;
          StatPercentEditor_1?: number | null;
          StatPercentEditor_2?: number | null;
          StatPercentEditor_3?: number | null;
          StatPercentEditor_4?: number | null;
          StatPercentEditor_5?: number | null;
          StatPercentEditor_6?: number | null;
          StatPercentEditor_7?: number | null;
          StatPercentEditor_8?: number | null;
          StatPercentEditor_9?: number | null;
          TotemCategoryID?: number | null;
          VendorStackCount?: number | null;
          ZoneBound_0?: number | null;
          ZoneBound_1?: number | null;
        };
        Update: {
          AllowableClass?: number | null;
          AllowableRace?: number | null;
          ArtifactID?: number | null;
          BagFamily?: number | null;
          Bonding?: number | null;
          BuyPrice?: number | null;
          ContainerSlots?: number | null;
          ContentTuningID?: number | null;
          DamageType?: number | null;
          Description_lang?: string | null;
          Display_lang?: string | null;
          Display1_lang?: string | null;
          Display2_lang?: string | null;
          Display3_lang?: string | null;
          DmgVariance?: number | null;
          DurationInInventory?: number | null;
          ExpansionID?: number | null;
          Field_12_0_0_63534_032?: number | null;
          Field_12_0_0_63534_033?: number | null;
          Field_12_0_0_63534_034?: number | null;
          Flags_0?: number | null;
          Flags_1?: number | null;
          Flags_2?: number | null;
          Flags_3?: number | null;
          Flags_4?: number | null;
          Gem_properties?: number | null;
          ID?: number;
          InstanceBound?: number | null;
          InventoryType?: number | null;
          ItemDelay?: number | null;
          ItemLevel?: number | null;
          ItemNameDescriptionID?: number | null;
          ItemRange?: number | null;
          ItemSet?: number | null;
          LanguageID?: number | null;
          LimitCategory?: number | null;
          LockID?: number | null;
          Material?: number | null;
          MaxCount?: number | null;
          MinFactionID?: number | null;
          MinReputation?: number | null;
          ModifiedCraftingReagentItemID?: number | null;
          OppositeFactionItemID?: number | null;
          OverallQualityID?: number | null;
          PageID?: number | null;
          PageMaterialID?: number | null;
          PlayerLevelToItemLevelCurveID?: number | null;
          PriceRandomValue?: number | null;
          PriceVariance?: number | null;
          QualityModifier?: number | null;
          RequiredAbility?: number | null;
          RequiredHoliday?: number | null;
          RequiredLevel?: number | null;
          RequiredPVPMedal?: number | null;
          RequiredPVPRank?: number | null;
          RequiredSkill?: number | null;
          RequiredSkillRank?: number | null;
          RequiredTransmogHoliday?: number | null;
          SellPrice?: number | null;
          SheatheType?: number | null;
          Socket_match_enchantment_ID?: number | null;
          SocketType_0?: number | null;
          SocketType_1?: number | null;
          SocketType_2?: number | null;
          SpellWeight?: number | null;
          SpellWeightCategory?: number | null;
          Stackable?: number | null;
          StartQuestID?: number | null;
          StatModifier_bonusStat_0?: number | null;
          StatModifier_bonusStat_1?: number | null;
          StatModifier_bonusStat_2?: number | null;
          StatModifier_bonusStat_3?: number | null;
          StatModifier_bonusStat_4?: number | null;
          StatModifier_bonusStat_5?: number | null;
          StatModifier_bonusStat_6?: number | null;
          StatModifier_bonusStat_7?: number | null;
          StatModifier_bonusStat_8?: number | null;
          StatModifier_bonusStat_9?: number | null;
          StatPercentageOfSocket_0?: number | null;
          StatPercentageOfSocket_1?: number | null;
          StatPercentageOfSocket_2?: number | null;
          StatPercentageOfSocket_3?: number | null;
          StatPercentageOfSocket_4?: number | null;
          StatPercentageOfSocket_5?: number | null;
          StatPercentageOfSocket_6?: number | null;
          StatPercentageOfSocket_7?: number | null;
          StatPercentageOfSocket_8?: number | null;
          StatPercentageOfSocket_9?: number | null;
          StatPercentEditor_0?: number | null;
          StatPercentEditor_1?: number | null;
          StatPercentEditor_2?: number | null;
          StatPercentEditor_3?: number | null;
          StatPercentEditor_4?: number | null;
          StatPercentEditor_5?: number | null;
          StatPercentEditor_6?: number | null;
          StatPercentEditor_7?: number | null;
          StatPercentEditor_8?: number | null;
          StatPercentEditor_9?: number | null;
          TotemCategoryID?: number | null;
          VendorStackCount?: number | null;
          ZoneBound_0?: number | null;
          ZoneBound_1?: number | null;
        };
        Relationships: [];
      };
      item_x_item_effect: {
        Row: {
          ID: number;
          ItemEffectID: number;
          ItemID: number;
        };
        Insert: {
          ID: number;
          ItemEffectID: number;
          ItemID: number;
        };
        Update: {
          ID?: number;
          ItemEffectID?: number;
          ItemID?: number;
        };
        Relationships: [];
      };
      manifest_interface_data: {
        Row: {
          FileName: string;
          FilePath: string;
          ID: number;
        };
        Insert: {
          FileName: string;
          FilePath: string;
          ID: number;
        };
        Update: {
          FileName?: string;
          FilePath?: string;
          ID?: number;
        };
        Relationships: [];
      };
      skill_line_x_trait_tree: {
        Row: {
          ID: number;
          SkillLineID: number | null;
          TraitTreeID: number | null;
          Variant: number | null;
        };
        Insert: {
          ID: number;
          SkillLineID?: number | null;
          TraitTreeID?: number | null;
          Variant?: number | null;
        };
        Update: {
          ID?: number;
          SkillLineID?: number | null;
          TraitTreeID?: number | null;
          Variant?: number | null;
        };
        Relationships: [];
      };
      specialization_spells: {
        Row: {
          Description_lang: string | null;
          DisplayOrder: number | null;
          ID: number;
          OverridesSpellID: number | null;
          SpecID: number | null;
          SpellID: number | null;
        };
        Insert: {
          Description_lang?: string | null;
          DisplayOrder?: number | null;
          ID: number;
          OverridesSpellID?: number | null;
          SpecID?: number | null;
          SpellID?: number | null;
        };
        Update: {
          Description_lang?: string | null;
          DisplayOrder?: number | null;
          ID?: number;
          OverridesSpellID?: number | null;
          SpecID?: number | null;
          SpellID?: number | null;
        };
        Relationships: [];
      };
      spell: {
        Row: {
          AuraDescription_lang: string | null;
          Description_lang: string | null;
          ID: number;
          NameSubtext_lang: string | null;
        };
        Insert: {
          AuraDescription_lang?: string | null;
          Description_lang?: string | null;
          ID: number;
          NameSubtext_lang?: string | null;
        };
        Update: {
          AuraDescription_lang?: string | null;
          Description_lang?: string | null;
          ID?: number;
          NameSubtext_lang?: string | null;
        };
        Relationships: [];
      };
      spell_aura_options: {
        Row: {
          CumulativeAura: number | null;
          DifficultyID: number | null;
          ID: number;
          ProcCategoryRecovery: number | null;
          ProcChance: number | null;
          ProcCharges: number | null;
          ProcTypeMask_0: number | null;
          ProcTypeMask_1: number | null;
          SpellID: number;
          SpellProcsPerMinuteID: number | null;
        };
        Insert: {
          CumulativeAura?: number | null;
          DifficultyID?: number | null;
          ID: number;
          ProcCategoryRecovery?: number | null;
          ProcChance?: number | null;
          ProcCharges?: number | null;
          ProcTypeMask_0?: number | null;
          ProcTypeMask_1?: number | null;
          SpellID: number;
          SpellProcsPerMinuteID?: number | null;
        };
        Update: {
          CumulativeAura?: number | null;
          DifficultyID?: number | null;
          ID?: number;
          ProcCategoryRecovery?: number | null;
          ProcChance?: number | null;
          ProcCharges?: number | null;
          ProcTypeMask_0?: number | null;
          ProcTypeMask_1?: number | null;
          SpellID?: number;
          SpellProcsPerMinuteID?: number | null;
        };
        Relationships: [];
      };
      spell_aura_restrictions: {
        Row: {
          CasterAuraSpell: number | null;
          CasterAuraState: number | null;
          CasterAuraType: number | null;
          DifficultyID: number | null;
          ExcludeCasterAuraSpell: number | null;
          ExcludeCasterAuraState: number | null;
          ExcludeCasterAuraType: number | null;
          ExcludeTargetAuraSpell: number | null;
          ExcludeTargetAuraState: number | null;
          ExcludeTargetAuraType: number | null;
          ID: number;
          SpellID: number | null;
          TargetAuraSpell: number | null;
          TargetAuraState: number | null;
          TargetAuraType: number | null;
        };
        Insert: {
          CasterAuraSpell?: number | null;
          CasterAuraState?: number | null;
          CasterAuraType?: number | null;
          DifficultyID?: number | null;
          ExcludeCasterAuraSpell?: number | null;
          ExcludeCasterAuraState?: number | null;
          ExcludeCasterAuraType?: number | null;
          ExcludeTargetAuraSpell?: number | null;
          ExcludeTargetAuraState?: number | null;
          ExcludeTargetAuraType?: number | null;
          ID: number;
          SpellID?: number | null;
          TargetAuraSpell?: number | null;
          TargetAuraState?: number | null;
          TargetAuraType?: number | null;
        };
        Update: {
          CasterAuraSpell?: number | null;
          CasterAuraState?: number | null;
          CasterAuraType?: number | null;
          DifficultyID?: number | null;
          ExcludeCasterAuraSpell?: number | null;
          ExcludeCasterAuraState?: number | null;
          ExcludeCasterAuraType?: number | null;
          ExcludeTargetAuraSpell?: number | null;
          ExcludeTargetAuraState?: number | null;
          ExcludeTargetAuraType?: number | null;
          ID?: number;
          SpellID?: number | null;
          TargetAuraSpell?: number | null;
          TargetAuraState?: number | null;
          TargetAuraType?: number | null;
        };
        Relationships: [];
      };
      spell_cast_times: {
        Row: {
          Base: number | null;
          ID: number;
          Minimum: number | null;
        };
        Insert: {
          Base?: number | null;
          ID: number;
          Minimum?: number | null;
        };
        Update: {
          Base?: number | null;
          ID?: number;
          Minimum?: number | null;
        };
        Relationships: [];
      };
      spell_casting_requirements: {
        Row: {
          FacingCasterFlags: number | null;
          ID: number;
          MinFactionID: number | null;
          MinReputation: number | null;
          RequiredAreasID: number | null;
          RequiredAuraVision: number | null;
          RequiresSpellFocus: number | null;
          SpellID: number;
        };
        Insert: {
          FacingCasterFlags?: number | null;
          ID: number;
          MinFactionID?: number | null;
          MinReputation?: number | null;
          RequiredAreasID?: number | null;
          RequiredAuraVision?: number | null;
          RequiresSpellFocus?: number | null;
          SpellID: number;
        };
        Update: {
          FacingCasterFlags?: number | null;
          ID?: number;
          MinFactionID?: number | null;
          MinReputation?: number | null;
          RequiredAreasID?: number | null;
          RequiredAuraVision?: number | null;
          RequiresSpellFocus?: number | null;
          SpellID?: number;
        };
        Relationships: [];
      };
      spell_categories: {
        Row: {
          Category: number | null;
          ChargeCategory: number | null;
          DefenseType: number | null;
          DifficultyID: number | null;
          DiminishType: number | null;
          DispelType: number | null;
          ID: number;
          Mechanic: number | null;
          PreventionType: number | null;
          SpellID: number;
          StartRecoveryCategory: number | null;
        };
        Insert: {
          Category?: number | null;
          ChargeCategory?: number | null;
          DefenseType?: number | null;
          DifficultyID?: number | null;
          DiminishType?: number | null;
          DispelType?: number | null;
          ID: number;
          Mechanic?: number | null;
          PreventionType?: number | null;
          SpellID: number;
          StartRecoveryCategory?: number | null;
        };
        Update: {
          Category?: number | null;
          ChargeCategory?: number | null;
          DefenseType?: number | null;
          DifficultyID?: number | null;
          DiminishType?: number | null;
          DispelType?: number | null;
          ID?: number;
          Mechanic?: number | null;
          PreventionType?: number | null;
          SpellID?: number;
          StartRecoveryCategory?: number | null;
        };
        Relationships: [];
      };
      spell_category: {
        Row: {
          ChargeRecoveryTime: number | null;
          Flags: number | null;
          ID: number;
          MaxCharges: number | null;
          Name_lang: string | null;
          TypeMask: number | null;
          UsesPerWeek: number | null;
        };
        Insert: {
          ChargeRecoveryTime?: number | null;
          Flags?: number | null;
          ID: number;
          MaxCharges?: number | null;
          Name_lang?: string | null;
          TypeMask?: number | null;
          UsesPerWeek?: number | null;
        };
        Update: {
          ChargeRecoveryTime?: number | null;
          Flags?: number | null;
          ID?: number;
          MaxCharges?: number | null;
          Name_lang?: string | null;
          TypeMask?: number | null;
          UsesPerWeek?: number | null;
        };
        Relationships: [];
      };
      spell_class_options: {
        Row: {
          ID: number;
          ModalNextSpell: number | null;
          SpellClassMask_0: number | null;
          SpellClassMask_1: number | null;
          SpellClassMask_2: number | null;
          SpellClassMask_3: number | null;
          SpellClassSet: number | null;
          SpellID: number;
        };
        Insert: {
          ID: number;
          ModalNextSpell?: number | null;
          SpellClassMask_0?: number | null;
          SpellClassMask_1?: number | null;
          SpellClassMask_2?: number | null;
          SpellClassMask_3?: number | null;
          SpellClassSet?: number | null;
          SpellID: number;
        };
        Update: {
          ID?: number;
          ModalNextSpell?: number | null;
          SpellClassMask_0?: number | null;
          SpellClassMask_1?: number | null;
          SpellClassMask_2?: number | null;
          SpellClassMask_3?: number | null;
          SpellClassSet?: number | null;
          SpellID?: number;
        };
        Relationships: [];
      };
      spell_cooldowns: {
        Row: {
          AuraSpellID: number | null;
          CategoryRecoveryTime: number | null;
          DifficultyID: number | null;
          ID: number;
          RecoveryTime: number | null;
          SpellID: number;
          StartRecoveryTime: number | null;
        };
        Insert: {
          AuraSpellID?: number | null;
          CategoryRecoveryTime?: number | null;
          DifficultyID?: number | null;
          ID: number;
          RecoveryTime?: number | null;
          SpellID: number;
          StartRecoveryTime?: number | null;
        };
        Update: {
          AuraSpellID?: number | null;
          CategoryRecoveryTime?: number | null;
          DifficultyID?: number | null;
          ID?: number;
          RecoveryTime?: number | null;
          SpellID?: number;
          StartRecoveryTime?: number | null;
        };
        Relationships: [];
      };
      spell_description_variables: {
        Row: {
          ID: number;
          Variables: string | null;
        };
        Insert: {
          ID: number;
          Variables?: string | null;
        };
        Update: {
          ID?: number;
          Variables?: string | null;
        };
        Relationships: [];
      };
      spell_duration: {
        Row: {
          Duration: number | null;
          ID: number;
          MaxDuration: number | null;
        };
        Insert: {
          Duration?: number | null;
          ID: number;
          MaxDuration?: number | null;
        };
        Update: {
          Duration?: number | null;
          ID?: number;
          MaxDuration?: number | null;
        };
        Relationships: [];
      };
      spell_effect: {
        Row: {
          BonusCoefficientFromAP: number | null;
          Coefficient: number | null;
          DifficultyID: number | null;
          Effect: number | null;
          EffectAmplitude: number | null;
          EffectAttributes: number | null;
          EffectAura: number | null;
          EffectAuraPeriod: number | null;
          EffectBasePointsF: number | null;
          EffectBonusCoefficient: number | null;
          EffectChainAmplitude: number | null;
          EffectChainTargets: number | null;
          EffectIndex: number | null;
          EffectItemType: number | null;
          EffectMechanic: number | null;
          EffectMiscValue_0: number | null;
          EffectMiscValue_1: number | null;
          EffectPointsPerResource: number | null;
          EffectPos_facing: number | null;
          EffectRadiusIndex_0: number | null;
          EffectRadiusIndex_1: number | null;
          EffectRealPointsPerLevel: number | null;
          EffectSpellClassMask_0: number | null;
          EffectSpellClassMask_1: number | null;
          EffectSpellClassMask_2: number | null;
          EffectSpellClassMask_3: number | null;
          EffectTriggerSpell: number | null;
          GroupSizeBasePointsCoefficient: number | null;
          ID: number;
          ImplicitTarget_0: number | null;
          ImplicitTarget_1: number | null;
          Node__Field_12_0_0_63534_001: number | null;
          PvpMultiplier: number | null;
          ResourceCoefficient: number | null;
          ScalingClass: number | null;
          SpellID: number;
          Variance: number | null;
        };
        Insert: {
          BonusCoefficientFromAP?: number | null;
          Coefficient?: number | null;
          DifficultyID?: number | null;
          Effect?: number | null;
          EffectAmplitude?: number | null;
          EffectAttributes?: number | null;
          EffectAura?: number | null;
          EffectAuraPeriod?: number | null;
          EffectBasePointsF?: number | null;
          EffectBonusCoefficient?: number | null;
          EffectChainAmplitude?: number | null;
          EffectChainTargets?: number | null;
          EffectIndex?: number | null;
          EffectItemType?: number | null;
          EffectMechanic?: number | null;
          EffectMiscValue_0?: number | null;
          EffectMiscValue_1?: number | null;
          EffectPointsPerResource?: number | null;
          EffectPos_facing?: number | null;
          EffectRadiusIndex_0?: number | null;
          EffectRadiusIndex_1?: number | null;
          EffectRealPointsPerLevel?: number | null;
          EffectSpellClassMask_0?: number | null;
          EffectSpellClassMask_1?: number | null;
          EffectSpellClassMask_2?: number | null;
          EffectSpellClassMask_3?: number | null;
          EffectTriggerSpell?: number | null;
          GroupSizeBasePointsCoefficient?: number | null;
          ID: number;
          ImplicitTarget_0?: number | null;
          ImplicitTarget_1?: number | null;
          Node__Field_12_0_0_63534_001?: number | null;
          PvpMultiplier?: number | null;
          ResourceCoefficient?: number | null;
          ScalingClass?: number | null;
          SpellID: number;
          Variance?: number | null;
        };
        Update: {
          BonusCoefficientFromAP?: number | null;
          Coefficient?: number | null;
          DifficultyID?: number | null;
          Effect?: number | null;
          EffectAmplitude?: number | null;
          EffectAttributes?: number | null;
          EffectAura?: number | null;
          EffectAuraPeriod?: number | null;
          EffectBasePointsF?: number | null;
          EffectBonusCoefficient?: number | null;
          EffectChainAmplitude?: number | null;
          EffectChainTargets?: number | null;
          EffectIndex?: number | null;
          EffectItemType?: number | null;
          EffectMechanic?: number | null;
          EffectMiscValue_0?: number | null;
          EffectMiscValue_1?: number | null;
          EffectPointsPerResource?: number | null;
          EffectPos_facing?: number | null;
          EffectRadiusIndex_0?: number | null;
          EffectRadiusIndex_1?: number | null;
          EffectRealPointsPerLevel?: number | null;
          EffectSpellClassMask_0?: number | null;
          EffectSpellClassMask_1?: number | null;
          EffectSpellClassMask_2?: number | null;
          EffectSpellClassMask_3?: number | null;
          EffectTriggerSpell?: number | null;
          GroupSizeBasePointsCoefficient?: number | null;
          ID?: number;
          ImplicitTarget_0?: number | null;
          ImplicitTarget_1?: number | null;
          Node__Field_12_0_0_63534_001?: number | null;
          PvpMultiplier?: number | null;
          ResourceCoefficient?: number | null;
          ScalingClass?: number | null;
          SpellID?: number;
          Variance?: number | null;
        };
        Relationships: [];
      };
      spell_empower: {
        Row: {
          Field_10_0_0_44649_002: number | null;
          ID: number;
          SpellID: number;
        };
        Insert: {
          Field_10_0_0_44649_002?: number | null;
          ID: number;
          SpellID: number;
        };
        Update: {
          Field_10_0_0_44649_002?: number | null;
          ID?: number;
          SpellID?: number;
        };
        Relationships: [];
      };
      spell_empower_stage: {
        Row: {
          DurationMs: number | null;
          ID: number;
          SpellEmpowerID: number;
          Stage: number | null;
        };
        Insert: {
          DurationMs?: number | null;
          ID: number;
          SpellEmpowerID: number;
          Stage?: number | null;
        };
        Update: {
          DurationMs?: number | null;
          ID?: number;
          SpellEmpowerID?: number;
          Stage?: number | null;
        };
        Relationships: [];
      };
      spell_interrupts: {
        Row: {
          AuraInterruptFlags_0: number | null;
          AuraInterruptFlags_1: number | null;
          ChannelInterruptFlags_0: number | null;
          ChannelInterruptFlags_1: number | null;
          DifficultyID: number | null;
          ID: number;
          InterruptFlags: number | null;
          SpellID: number;
        };
        Insert: {
          AuraInterruptFlags_0?: number | null;
          AuraInterruptFlags_1?: number | null;
          ChannelInterruptFlags_0?: number | null;
          ChannelInterruptFlags_1?: number | null;
          DifficultyID?: number | null;
          ID: number;
          InterruptFlags?: number | null;
          SpellID: number;
        };
        Update: {
          AuraInterruptFlags_0?: number | null;
          AuraInterruptFlags_1?: number | null;
          ChannelInterruptFlags_0?: number | null;
          ChannelInterruptFlags_1?: number | null;
          DifficultyID?: number | null;
          ID?: number;
          InterruptFlags?: number | null;
          SpellID?: number;
        };
        Relationships: [];
      };
      spell_learn_spell: {
        Row: {
          ID: number;
          LearnSpellID: number | null;
          OverridesSpellID: number | null;
          SpellID: number | null;
        };
        Insert: {
          ID: number;
          LearnSpellID?: number | null;
          OverridesSpellID?: number | null;
          SpellID?: number | null;
        };
        Update: {
          ID?: number;
          LearnSpellID?: number | null;
          OverridesSpellID?: number | null;
          SpellID?: number | null;
        };
        Relationships: [];
      };
      spell_levels: {
        Row: {
          BaseLevel: number | null;
          DifficultyID: number | null;
          ID: number;
          MaxLevel: number | null;
          MaxPassiveAuraLevel: number | null;
          SpellID: number | null;
          SpellLevel: number | null;
        };
        Insert: {
          BaseLevel?: number | null;
          DifficultyID?: number | null;
          ID: number;
          MaxLevel?: number | null;
          MaxPassiveAuraLevel?: number | null;
          SpellID?: number | null;
          SpellLevel?: number | null;
        };
        Update: {
          BaseLevel?: number | null;
          DifficultyID?: number | null;
          ID?: number;
          MaxLevel?: number | null;
          MaxPassiveAuraLevel?: number | null;
          SpellID?: number | null;
          SpellLevel?: number | null;
        };
        Relationships: [];
      };
      spell_misc: {
        Row: {
          ActiveIconFileDataID: number | null;
          ActiveSpellVisualScript: number | null;
          Attributes_0: number | null;
          Attributes_1: number | null;
          Attributes_10: number | null;
          Attributes_11: number | null;
          Attributes_12: number | null;
          Attributes_13: number | null;
          Attributes_14: number | null;
          Attributes_15: number | null;
          Attributes_2: number | null;
          Attributes_3: number | null;
          Attributes_4: number | null;
          Attributes_5: number | null;
          Attributes_6: number | null;
          Attributes_7: number | null;
          Attributes_8: number | null;
          Attributes_9: number | null;
          CastingTimeIndex: number | null;
          ContentTuningID: number | null;
          DifficultyID: number | null;
          DurationIndex: number | null;
          ID: number;
          LaunchDelay: number | null;
          MinDuration: number | null;
          PvPDurationIndex: number | null;
          RangeIndex: number | null;
          SchoolMask: number | null;
          ShowFutureSpellPlayerConditionID: number | null;
          Speed: number | null;
          SpellIconFileDataID: number | null;
          SpellID: number;
          SpellVisualScript: number | null;
        };
        Insert: {
          ActiveIconFileDataID?: number | null;
          ActiveSpellVisualScript?: number | null;
          Attributes_0?: number | null;
          Attributes_1?: number | null;
          Attributes_10?: number | null;
          Attributes_11?: number | null;
          Attributes_12?: number | null;
          Attributes_13?: number | null;
          Attributes_14?: number | null;
          Attributes_15?: number | null;
          Attributes_2?: number | null;
          Attributes_3?: number | null;
          Attributes_4?: number | null;
          Attributes_5?: number | null;
          Attributes_6?: number | null;
          Attributes_7?: number | null;
          Attributes_8?: number | null;
          Attributes_9?: number | null;
          CastingTimeIndex?: number | null;
          ContentTuningID?: number | null;
          DifficultyID?: number | null;
          DurationIndex?: number | null;
          ID: number;
          LaunchDelay?: number | null;
          MinDuration?: number | null;
          PvPDurationIndex?: number | null;
          RangeIndex?: number | null;
          SchoolMask?: number | null;
          ShowFutureSpellPlayerConditionID?: number | null;
          Speed?: number | null;
          SpellIconFileDataID?: number | null;
          SpellID: number;
          SpellVisualScript?: number | null;
        };
        Update: {
          ActiveIconFileDataID?: number | null;
          ActiveSpellVisualScript?: number | null;
          Attributes_0?: number | null;
          Attributes_1?: number | null;
          Attributes_10?: number | null;
          Attributes_11?: number | null;
          Attributes_12?: number | null;
          Attributes_13?: number | null;
          Attributes_14?: number | null;
          Attributes_15?: number | null;
          Attributes_2?: number | null;
          Attributes_3?: number | null;
          Attributes_4?: number | null;
          Attributes_5?: number | null;
          Attributes_6?: number | null;
          Attributes_7?: number | null;
          Attributes_8?: number | null;
          Attributes_9?: number | null;
          CastingTimeIndex?: number | null;
          ContentTuningID?: number | null;
          DifficultyID?: number | null;
          DurationIndex?: number | null;
          ID?: number;
          LaunchDelay?: number | null;
          MinDuration?: number | null;
          PvPDurationIndex?: number | null;
          RangeIndex?: number | null;
          SchoolMask?: number | null;
          ShowFutureSpellPlayerConditionID?: number | null;
          Speed?: number | null;
          SpellIconFileDataID?: number | null;
          SpellID?: number;
          SpellVisualScript?: number | null;
        };
        Relationships: [];
      };
      spell_name: {
        Row: {
          ID: number;
          Name_lang: string;
        };
        Insert: {
          ID: number;
          Name_lang: string;
        };
        Update: {
          ID?: number;
          Name_lang?: string;
        };
        Relationships: [];
      };
      spell_power: {
        Row: {
          AltPowerBarID: number | null;
          ID: number;
          ManaCost: number | null;
          ManaCostPerLevel: number | null;
          ManaPerSecond: number | null;
          OptionalCost: number | null;
          OptionalCostPct: number | null;
          OrderIndex: number | null;
          PowerCostMaxPct: number | null;
          PowerCostPct: number | null;
          PowerDisplayID: number | null;
          PowerPctPerSecond: number | null;
          PowerType: number | null;
          RequiredAuraSpellID: number | null;
          SpellID: number;
        };
        Insert: {
          AltPowerBarID?: number | null;
          ID: number;
          ManaCost?: number | null;
          ManaCostPerLevel?: number | null;
          ManaPerSecond?: number | null;
          OptionalCost?: number | null;
          OptionalCostPct?: number | null;
          OrderIndex?: number | null;
          PowerCostMaxPct?: number | null;
          PowerCostPct?: number | null;
          PowerDisplayID?: number | null;
          PowerPctPerSecond?: number | null;
          PowerType?: number | null;
          RequiredAuraSpellID?: number | null;
          SpellID: number;
        };
        Update: {
          AltPowerBarID?: number | null;
          ID?: number;
          ManaCost?: number | null;
          ManaCostPerLevel?: number | null;
          ManaPerSecond?: number | null;
          OptionalCost?: number | null;
          OptionalCostPct?: number | null;
          OrderIndex?: number | null;
          PowerCostMaxPct?: number | null;
          PowerCostPct?: number | null;
          PowerDisplayID?: number | null;
          PowerPctPerSecond?: number | null;
          PowerType?: number | null;
          RequiredAuraSpellID?: number | null;
          SpellID?: number;
        };
        Relationships: [];
      };
      spell_procs_per_minute: {
        Row: {
          BaseProcRate: number | null;
          Flags: number | null;
          ID: number;
        };
        Insert: {
          BaseProcRate?: number | null;
          Flags?: number | null;
          ID: number;
        };
        Update: {
          BaseProcRate?: number | null;
          Flags?: number | null;
          ID?: number;
        };
        Relationships: [];
      };
      spell_procs_per_minute_mod: {
        Row: {
          Coeff: number | null;
          ID: number;
          Param: number | null;
          SpellProcsPerMinuteID: number;
          Type: number | null;
        };
        Insert: {
          Coeff?: number | null;
          ID: number;
          Param?: number | null;
          SpellProcsPerMinuteID: number;
          Type?: number | null;
        };
        Update: {
          Coeff?: number | null;
          ID?: number;
          Param?: number | null;
          SpellProcsPerMinuteID?: number;
          Type?: number | null;
        };
        Relationships: [];
      };
      spell_radius: {
        Row: {
          ID: number;
          Radius: number | null;
          RadiusMax: number | null;
          RadiusMin: number | null;
          RadiusPerLevel: number | null;
        };
        Insert: {
          ID: number;
          Radius?: number | null;
          RadiusMax?: number | null;
          RadiusMin?: number | null;
          RadiusPerLevel?: number | null;
        };
        Update: {
          ID?: number;
          Radius?: number | null;
          RadiusMax?: number | null;
          RadiusMin?: number | null;
          RadiusPerLevel?: number | null;
        };
        Relationships: [];
      };
      spell_range: {
        Row: {
          DisplayName_lang: string | null;
          DisplayNameShort_lang: string | null;
          Flags: number | null;
          ID: number;
          RangeMax_0: number | null;
          RangeMax_1: number | null;
          RangeMin_0: number | null;
          RangeMin_1: number | null;
        };
        Insert: {
          DisplayName_lang?: string | null;
          DisplayNameShort_lang?: string | null;
          Flags?: number | null;
          ID: number;
          RangeMax_0?: number | null;
          RangeMax_1?: number | null;
          RangeMin_0?: number | null;
          RangeMin_1?: number | null;
        };
        Update: {
          DisplayName_lang?: string | null;
          DisplayNameShort_lang?: string | null;
          Flags?: number | null;
          ID?: number;
          RangeMax_0?: number | null;
          RangeMax_1?: number | null;
          RangeMin_0?: number | null;
          RangeMin_1?: number | null;
        };
        Relationships: [];
      };
      spell_replacement: {
        Row: {
          ID: number;
          ReplacementSpellID: number | null;
          SpellID: number | null;
        };
        Insert: {
          ID: number;
          ReplacementSpellID?: number | null;
          SpellID?: number | null;
        };
        Update: {
          ID?: number;
          ReplacementSpellID?: number | null;
          SpellID?: number | null;
        };
        Relationships: [];
      };
      spell_shapeshift: {
        Row: {
          ID: number;
          ShapeshiftExclude_0: number | null;
          ShapeshiftExclude_1: number | null;
          ShapeshiftMask_0: number | null;
          ShapeshiftMask_1: number | null;
          SpellID: number | null;
          StanceBarOrder: number | null;
        };
        Insert: {
          ID: number;
          ShapeshiftExclude_0?: number | null;
          ShapeshiftExclude_1?: number | null;
          ShapeshiftMask_0?: number | null;
          ShapeshiftMask_1?: number | null;
          SpellID?: number | null;
          StanceBarOrder?: number | null;
        };
        Update: {
          ID?: number;
          ShapeshiftExclude_0?: number | null;
          ShapeshiftExclude_1?: number | null;
          ShapeshiftMask_0?: number | null;
          ShapeshiftMask_1?: number | null;
          SpellID?: number | null;
          StanceBarOrder?: number | null;
        };
        Relationships: [];
      };
      spell_shapeshift_form: {
        Row: {
          AttackIconFileID: number | null;
          BonusActionBar: number | null;
          CombatRoundTime: number | null;
          CreatureDisplayID: number | null;
          CreatureType: number | null;
          DamageVariance: number | null;
          Flags: number | null;
          ID: number;
          MountTypeID: number | null;
          Name_lang: string | null;
          PresetSpellID_0: number | null;
          PresetSpellID_1: number | null;
          PresetSpellID_2: number | null;
          PresetSpellID_3: number | null;
          PresetSpellID_4: number | null;
          PresetSpellID_5: number | null;
          PresetSpellID_6: number | null;
          PresetSpellID_7: number | null;
        };
        Insert: {
          AttackIconFileID?: number | null;
          BonusActionBar?: number | null;
          CombatRoundTime?: number | null;
          CreatureDisplayID?: number | null;
          CreatureType?: number | null;
          DamageVariance?: number | null;
          Flags?: number | null;
          ID: number;
          MountTypeID?: number | null;
          Name_lang?: string | null;
          PresetSpellID_0?: number | null;
          PresetSpellID_1?: number | null;
          PresetSpellID_2?: number | null;
          PresetSpellID_3?: number | null;
          PresetSpellID_4?: number | null;
          PresetSpellID_5?: number | null;
          PresetSpellID_6?: number | null;
          PresetSpellID_7?: number | null;
        };
        Update: {
          AttackIconFileID?: number | null;
          BonusActionBar?: number | null;
          CombatRoundTime?: number | null;
          CreatureDisplayID?: number | null;
          CreatureType?: number | null;
          DamageVariance?: number | null;
          Flags?: number | null;
          ID?: number;
          MountTypeID?: number | null;
          Name_lang?: string | null;
          PresetSpellID_0?: number | null;
          PresetSpellID_1?: number | null;
          PresetSpellID_2?: number | null;
          PresetSpellID_3?: number | null;
          PresetSpellID_4?: number | null;
          PresetSpellID_5?: number | null;
          PresetSpellID_6?: number | null;
          PresetSpellID_7?: number | null;
        };
        Relationships: [];
      };
      spell_target_restrictions: {
        Row: {
          ConeDegrees: number | null;
          DifficultyID: number | null;
          ID: number;
          MaxTargetLevel: number | null;
          MaxTargets: number | null;
          SpellID: number;
          TargetCreatureType: number | null;
          Targets: number | null;
          Width: number | null;
        };
        Insert: {
          ConeDegrees?: number | null;
          DifficultyID?: number | null;
          ID: number;
          MaxTargetLevel?: number | null;
          MaxTargets?: number | null;
          SpellID: number;
          TargetCreatureType?: number | null;
          Targets?: number | null;
          Width?: number | null;
        };
        Update: {
          ConeDegrees?: number | null;
          DifficultyID?: number | null;
          ID?: number;
          MaxTargetLevel?: number | null;
          MaxTargets?: number | null;
          SpellID?: number;
          TargetCreatureType?: number | null;
          Targets?: number | null;
          Width?: number | null;
        };
        Relationships: [];
      };
      spell_totems: {
        Row: {
          ID: number;
          RequiredTotemCategoryID_0: number | null;
          RequiredTotemCategoryID_1: number | null;
          SpellID: number | null;
          Totem_0: number | null;
          Totem_1: number | null;
        };
        Insert: {
          ID: number;
          RequiredTotemCategoryID_0?: number | null;
          RequiredTotemCategoryID_1?: number | null;
          SpellID?: number | null;
          Totem_0?: number | null;
          Totem_1?: number | null;
        };
        Update: {
          ID?: number;
          RequiredTotemCategoryID_0?: number | null;
          RequiredTotemCategoryID_1?: number | null;
          SpellID?: number | null;
          Totem_0?: number | null;
          Totem_1?: number | null;
        };
        Relationships: [];
      };
      spell_x_description_variables: {
        Row: {
          ID: number;
          SpellDescriptionVariablesID: number | null;
          SpellID: number | null;
        };
        Insert: {
          ID: number;
          SpellDescriptionVariablesID?: number | null;
          SpellID?: number | null;
        };
        Update: {
          ID?: number;
          SpellDescriptionVariablesID?: number | null;
          SpellID?: number | null;
        };
        Relationships: [];
      };
      talent: {
        Row: {
          CategoryMask_0: number | null;
          CategoryMask_1: number | null;
          ClassID: number | null;
          ColumnIndex: number | null;
          Description_lang: string | null;
          Flags: number | null;
          ID: number;
          OverridesSpellID: number | null;
          PrereqRank_0: number | null;
          PrereqRank_1: number | null;
          PrereqRank_2: number | null;
          PrereqTalent_0: number | null;
          PrereqTalent_1: number | null;
          PrereqTalent_2: number | null;
          RequiredSpellID: number | null;
          SpecID: number | null;
          SpellID: number | null;
          SpellRank_0: number | null;
          SpellRank_1: number | null;
          SpellRank_2: number | null;
          SpellRank_3: number | null;
          SpellRank_4: number | null;
          SpellRank_5: number | null;
          SpellRank_6: number | null;
          SpellRank_7: number | null;
          SpellRank_8: number | null;
          TabID: number | null;
          TierID: number | null;
        };
        Insert: {
          CategoryMask_0?: number | null;
          CategoryMask_1?: number | null;
          ClassID?: number | null;
          ColumnIndex?: number | null;
          Description_lang?: string | null;
          Flags?: number | null;
          ID: number;
          OverridesSpellID?: number | null;
          PrereqRank_0?: number | null;
          PrereqRank_1?: number | null;
          PrereqRank_2?: number | null;
          PrereqTalent_0?: number | null;
          PrereqTalent_1?: number | null;
          PrereqTalent_2?: number | null;
          RequiredSpellID?: number | null;
          SpecID?: number | null;
          SpellID?: number | null;
          SpellRank_0?: number | null;
          SpellRank_1?: number | null;
          SpellRank_2?: number | null;
          SpellRank_3?: number | null;
          SpellRank_4?: number | null;
          SpellRank_5?: number | null;
          SpellRank_6?: number | null;
          SpellRank_7?: number | null;
          SpellRank_8?: number | null;
          TabID?: number | null;
          TierID?: number | null;
        };
        Update: {
          CategoryMask_0?: number | null;
          CategoryMask_1?: number | null;
          ClassID?: number | null;
          ColumnIndex?: number | null;
          Description_lang?: string | null;
          Flags?: number | null;
          ID?: number;
          OverridesSpellID?: number | null;
          PrereqRank_0?: number | null;
          PrereqRank_1?: number | null;
          PrereqRank_2?: number | null;
          PrereqTalent_0?: number | null;
          PrereqTalent_1?: number | null;
          PrereqTalent_2?: number | null;
          RequiredSpellID?: number | null;
          SpecID?: number | null;
          SpellID?: number | null;
          SpellRank_0?: number | null;
          SpellRank_1?: number | null;
          SpellRank_2?: number | null;
          SpellRank_3?: number | null;
          SpellRank_4?: number | null;
          SpellRank_5?: number | null;
          SpellRank_6?: number | null;
          SpellRank_7?: number | null;
          SpellRank_8?: number | null;
          TabID?: number | null;
          TierID?: number | null;
        };
        Relationships: [];
      };
      trait_definition: {
        Row: {
          ID: number;
          OverrideDescription_lang: string | null;
          OverrideIcon: number | null;
          OverrideName_lang: string | null;
          OverridesSpellID: number | null;
          OverrideSubtext_lang: string | null;
          SpellID: number | null;
          VisibleSpellID: number | null;
        };
        Insert: {
          ID: number;
          OverrideDescription_lang?: string | null;
          OverrideIcon?: number | null;
          OverrideName_lang?: string | null;
          OverridesSpellID?: number | null;
          OverrideSubtext_lang?: string | null;
          SpellID?: number | null;
          VisibleSpellID?: number | null;
        };
        Update: {
          ID?: number;
          OverrideDescription_lang?: string | null;
          OverrideIcon?: number | null;
          OverrideName_lang?: string | null;
          OverridesSpellID?: number | null;
          OverrideSubtext_lang?: string | null;
          SpellID?: number | null;
          VisibleSpellID?: number | null;
        };
        Relationships: [];
      };
      trait_node_entry: {
        Row: {
          ID: number;
          MaxRanks: number | null;
          NodeEntryType: number | null;
          TraitDefinitionID: number | null;
          TraitSubTreeID: number | null;
        };
        Insert: {
          ID: number;
          MaxRanks?: number | null;
          NodeEntryType?: number | null;
          TraitDefinitionID?: number | null;
          TraitSubTreeID?: number | null;
        };
        Update: {
          ID?: number;
          MaxRanks?: number | null;
          NodeEntryType?: number | null;
          TraitDefinitionID?: number | null;
          TraitSubTreeID?: number | null;
        };
        Relationships: [];
      };
      trait_node_x_trait_node_entry: {
        Row: {
          _Index: number | null;
          ID: number;
          TraitNodeEntryID: number | null;
          TraitNodeID: number | null;
        };
        Insert: {
          _Index?: number | null;
          ID: number;
          TraitNodeEntryID?: number | null;
          TraitNodeID?: number | null;
        };
        Update: {
          _Index?: number | null;
          ID?: number;
          TraitNodeEntryID?: number | null;
          TraitNodeID?: number | null;
        };
        Relationships: [];
      };
      trait_sub_tree: {
        Row: {
          Description_lang: string | null;
          ID: number;
          Name_lang: string | null;
          TraitTreeID: number | null;
          UiTextureAtlasElementID: number | null;
        };
        Insert: {
          Description_lang?: string | null;
          ID: number;
          Name_lang?: string | null;
          TraitTreeID?: number | null;
          UiTextureAtlasElementID?: number | null;
        };
        Update: {
          Description_lang?: string | null;
          ID?: number;
          Name_lang?: string | null;
          TraitTreeID?: number | null;
          UiTextureAtlasElementID?: number | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_difficulty_chain: {
        Args: { start_id: number };
        Returns: {
          FallbackDifficultyID: number | null;
          Field_1_15_4_56400_013: number | null;
          Flags: number | null;
          GroupSizeDmgCurveID: number | null;
          GroupSizeHealthCurveID: number | null;
          GroupSizeSpellPointsCurveID: number | null;
          ID: number;
          InstanceType: number | null;
          ItemContext: number | null;
          MaxPlayers: number | null;
          MinPlayers: number | null;
          Name_lang: string;
          OldEnumValue: number | null;
          OrderIndex: number | null;
          ToggleDifficultyID: number | null;
        }[];
        SetofOptions: {
          from: "*";
          to: "difficulty";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

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

export const Constants = {
  public: {
    Enums: {},
  },
  raw_dbc: {
    Enums: {},
  },
} as const;
