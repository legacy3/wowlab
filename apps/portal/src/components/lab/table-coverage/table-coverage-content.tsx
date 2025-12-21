"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Search, Check, X, ChevronDown, Download } from "lucide-react";
import { snakeCase } from "change-case";
import { DBC_TABLE_NAMES } from "@wowlab/core/DbcTableRegistry";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CopyButton } from "@/components/ui/copy-button";
import { useJsonExport } from "@/hooks/use-json-export";
import { GAME_CONFIG } from "@/lib/config/game";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFuzzySearch } from "@/hooks/use-fuzzy-search";
import { TableFieldsDialog, type SelectedTable } from "./table-fields-dialog";

// Generated via: pnpm cli list-tables --format ts
const ALL_DBC_TABLES = [
  "AccountStoreCategory",
  "AccountStoreItem",
  "Achievement",
  "Achievement_Category",
  "ActionBarGroup",
  "ActionBarGroupEntry",
  "AdventureJournal",
  "AdventureJournalItem",
  "AdventureMapPOI",
  "AlliedRace",
  "AltMinimap",
  "AltMinimapFiledata",
  "AltMinimapWMO",
  "AnimKit",
  "AnimKitBoneSet",
  "AnimKitBoneSetAlias",
  "AnimKitConfig",
  "AnimKitConfigBoneSet",
  "AnimKitPriority",
  "AnimKitReplacement",
  "AnimKitSegment",
  "AnimReplacement",
  "AnimReplacementSet",
  "AnimaCable",
  "AnimaCylinder",
  "AnimaMaterial",
  "AnimationData",
  "AreaConditionalData",
  "AreaFarClipOverride",
  "AreaGroupMember",
  "AreaPOI",
  "AreaPOIState",
  "AreaPOIUiWidgetSet",
  "AreaTable",
  "AreaTrigger",
  "AreaTriggerActionSet",
  "AreaTriggerBox",
  "AreaTriggerCreateProperties",
  "AreaTriggerCylinder",
  "AreaTriggerDisk",
  "AreaTriggerSphere",
  "ArenaTrackedItem",
  "ArmorLocation",
  "Artifact",
  "ArtifactAppearance",
  "ArtifactAppearanceSet",
  "ArtifactCategory",
  "ArtifactItemToTransmog",
  "ArtifactPower",
  "ArtifactPowerLink",
  "ArtifactPowerPicker",
  "ArtifactPowerRank",
  "ArtifactQuestXP",
  "ArtifactTier",
  "ArtifactUnlock",
  "AssistedCombat",
  "AssistedCombatRule",
  "AssistedCombatStep",
  "AuctionHouse",
  "AuctionHouseCategory",
  "AzeriteEmpoweredItem",
  "AzeriteEssence",
  "AzeriteEssencePower",
  "AzeriteItem",
  "AzeriteItemMilestonePower",
  "AzeriteKnowledgeMultiplier",
  "AzeriteLevelInfo",
  "AzeritePower",
  "AzeritePowerSetMember",
  "AzeriteTierUnlock",
  "AzeriteTierUnlockSet",
  "AzeriteUnlockMapping",
  "BankBagSlotPrices",
  "BankTab",
  "BannedAddons",
  "BarberShopStyle",
  "BarrageEffect",
  "BattlePetAbility",
  "BattlePetAbilityEffect",
  "BattlePetAbilityState",
  "BattlePetAbilityTurn",
  "BattlePetBreedQuality",
  "BattlePetBreedState",
  "BattlePetDisplayOverride",
  "BattlePetEffectProperties",
  "BattlePetSpecies",
  "BattlePetSpeciesState",
  "BattlePetSpeciesXAbility",
  "BattlePetState",
  "BattlePetVisual",
  "BattlemasterList",
  "BattlemasterListXMap",
  "BattlepayCurrency",
  "BeamEffect",
  "BoneWindModifierModel",
  "BoneWindModifiers",
  "BonusRoll",
  "Bounty",
  "BountySet",
  "BroadcastText",
  "BroadcastTextDuration",
  "CameraEffect",
  "CameraEffectEntry",
  "CameraMode",
  "Campaign",
  "CampaignXCondition",
  "CampaignXQuestLine",
  "CastableRaidBuffs",
  "CatalogShopGameTitleInfo",
  "CelestialBody",
  "Cfg_Categories",
  "Cfg_Configs",
  "Cfg_GameRules",
  "Cfg_Regions",
  "Cfg_TimeEventRegionGroup",
  "ChallengeModeItemBonusOverride",
  "CharBaseInfo",
  "CharBaseSection",
  "CharComponentTextureLayouts",
  "CharComponentTextureSections",
  "CharHairGeosets",
  "CharSectionCondition",
  "CharShipment",
  "CharShipmentContainer",
  "CharStartKit",
  "CharTitles",
  "CharacterFacialHairStyles",
  "CharacterLoadout",
  "CharacterLoadoutItem",
  "CharacterLoadoutPet",
  "CharacterServiceInfo",
  "ChatChannels",
  "ChatProfanity",
  "ChrClassRaceSex",
  "ChrClassTitle",
  "ChrClassUIChrModelInfo",
  "ChrClassUIDisplay",
  "ChrClassVillain",
  "ChrClasses",
  "ChrClassesXPowerTypes",
  "ChrCreateClassAnimTarget",
  "ChrCreateClassAnimTargetInfo",
  "ChrCustGeoComponentLink",
  "ChrCustItemGeoModify",
  "ChrCustomization",
  "ChrCustomizationBoneSet",
  "ChrCustomizationCategory",
  "ChrCustomizationChoice",
  "ChrCustomizationCondModel",
  "ChrCustomizationConversion",
  "ChrCustomizationDisplayInfo",
  "ChrCustomizationElement",
  "ChrCustomizationGeoset",
  "ChrCustomizationGlyphPet",
  "ChrCustomizationMaterial",
  "ChrCustomizationOption",
  "ChrCustomizationReq",
  "ChrCustomizationReqChoice",
  "ChrCustomizationSkinnedModel",
  "ChrCustomizationVisReq",
  "ChrCustomizationVoice",
  "ChrModel",
  "ChrModelMaterial",
  "ChrModelTextureLayer",
  "ChrRaceRacialAbility",
  "ChrRaceXChrModel",
  "ChrRaces",
  "ChrRacesCreateScreenIcon",
  "ChrSelectBackgroundCDI",
  "ChrSpecialization",
  "ChrUpgradeBucket",
  "ChrUpgradeBucketSpell",
  "ChrUpgradeTier",
  "CinematicCamera",
  "CinematicSequences",
  "ClientSceneEffect",
  "ClientSettings",
  "CloakDampening",
  "CollectableSourceEncounter",
  "CollectableSourceEncounterSparse",
  "CollectableSourceInfo",
  "CollectableSourceQuest",
  "CollectableSourceQuestSparse",
  "CollectableSourceVendor",
  "CollectableSourceVendorSparse",
  "CombatCondition",
  "CommentatorIndirectSpell",
  "CommentatorStartLocation",
  "CommentatorTrackedCooldown",
  "CommunityIcon",
  "ComponentModelFileData",
  "ComponentTextureFileData",
  "ConditionalChrModel",
  "ConditionalContentTuning",
  "ConditionalCreatureModelData",
  "ConditionalItemAppearance",
  "ConfigurationWarning",
  "ContentPush",
  "ContentRestrictionRule",
  "ContentRestrictionRuleSet",
  "ContentTuning",
  "ContentTuningXDifficulty",
  "ContentTuningXExpected",
  "ContentTuningXLabel",
  "Contribution",
  "ContributionStyle",
  "ContributionStyleContainer",
  "ConversationLine",
  "CooldownSet",
  "CooldownSetLinkedSpell",
  "CooldownSetSpell",
  "CorruptionEffects",
  "Covenant",
  "CraftingData",
  "CraftingDataEnchantQuality",
  "CraftingDataItemQuality",
  "CraftingDifficulty",
  "CraftingDifficultyQuality",
  "CraftingOrder",
  "CraftingOrderHouse",
  "CraftingOrderXLabel",
  "CraftingQuality",
  "CraftingReagentEffect",
  "CraftingReagentQuality",
  "CraftingReagentRequirement",
  "Creature",
  "CreatureDifficulty",
  "CreatureDifficultyTreasure",
  "CreatureDispXUiCamera",
  "CreatureDisplayInfo",
  "CreatureDisplayInfoCond",
  "CreatureDisplayInfoCondXChoice",
  "CreatureDisplayInfoEvt",
  "CreatureDisplayInfoExtra",
  "CreatureDisplayInfoGeosetData",
  "CreatureDisplayInfoOption",
  "CreatureDisplayInfoTrn",
  "CreatureDisplayXUIModelScene",
  "CreatureFamily",
  "CreatureFamilyXUIModelScene",
  "CreatureImmunities",
  "CreatureLabel",
  "CreatureModelData",
  "CreatureMovementInfo",
  "CreatureSoundData",
  "CreatureSoundFidget",
  "CreatureType",
  "CreatureXContribution",
  "CreatureXDisplayInfo",
  "CreatureXUiWidgetSet",
  "Criteria",
  "CriteriaTree",
  "CriteriaTreeXEffect",
  "CurrencyCategory",
  "CurrencyContainer",
  "CurrencyTypes",
  "Curve",
  "CurvePoint",
  "DeathThudLookups",
  "DecalProperties",
  "DelvesSeason",
  "DestructibleModelData",
  "Difficulty",
  "DisplaySeason",
  "DissolveEffect",
  "DriveCapability",
  "DriveCapabilityTier",
  "DungeonEncounter",
  "DurabilityCosts",
  "DurabilityQuality",
  "EdgeGlowEffect",
  "Emotes",
  "EmotesText",
  "EmotesTextData",
  "EmotesTextSound",
  "EnvironmentalDamage",
  "Exhaustion",
  "ExpectedStat",
  "ExpectedStatMod",
  "ExtraAbilityInfo",
  "Faction",
  "FactionGroup",
  "FactionTemplate",
  "FlightCapability",
  "FlightCapabilityXGlideEvent",
  "FootprintTextures",
  "FootstepTerrainLookup",
  "FriendshipRepReaction",
  "FriendshipReputation",
  "FullScreenEffect",
  "GMSurveyAnswers",
  "GMSurveyCurrentSurvey",
  "GMSurveyQuestions",
  "GMSurveySurveys",
  "GameMode",
  "GameObjectAnimGroupMember",
  "GameObjectArtKit",
  "GameObjectDiffAnimMap",
  "GameObjectDisplayCondition",
  "GameObjectDisplayInfo",
  "GameObjectDisplayInfoXSoundKit",
  "GameObjectLabel",
  "GameObjects",
  "GameParameter",
  "GameTips",
  "GarrAbility",
  "GarrAbilityCategory",
  "GarrAbilityEffect",
  "GarrAutoCombatant",
  "GarrAutoSpell",
  "GarrAutoSpellEffect",
  "GarrBuilding",
  "GarrBuildingDoodadSet",
  "GarrBuildingPlotInst",
  "GarrClassSpec",
  "GarrClassSpecPlayerCond",
  "GarrEncounter",
  "GarrEncounterSetXEncounter",
  "GarrEncounterXMechanic",
  "GarrFollItemSetMember",
  "GarrFollSupportSpell",
  "GarrFollower",
  "GarrFollowerLevelXP",
  "GarrFollowerQuality",
  "GarrFollowerSetXFollower",
  "GarrFollowerType",
  "GarrFollowerUICreature",
  "GarrFollowerXAbility",
  "GarrItemLevelUpgradeData",
  "GarrMechanic",
  "GarrMechanicSetXMechanic",
  "GarrMechanicType",
  "GarrMission",
  "GarrMissionSet",
  "GarrMissionTexture",
  "GarrMissionType",
  "GarrMissionXEncounter",
  "GarrMissionXFollower",
  "GarrMssnBonusAbility",
  "GarrPlot",
  "GarrPlotBuilding",
  "GarrPlotInstance",
  "GarrPlotUICategory",
  "GarrSiteLevel",
  "GarrSiteLevelPlotInst",
  "GarrSpecialization",
  "GarrString",
  "GarrTalTreeXGarrTalResearch",
  "GarrTalent",
  "GarrTalentCost",
  "GarrTalentMapPOI",
  "GarrTalentRank",
  "GarrTalentRankGroupEntry",
  "GarrTalentRankGroupResearchMod",
  "GarrTalentResearch",
  "GarrTalentSocketProperties",
  "GarrTalentTree",
  "GarrType",
  "GarrUiAnimClassInfo",
  "GarrUiAnimRaceInfo",
  "GemProperties",
  "GlideEvent",
  "GlideEventBlendTimes",
  "GlobalColor",
  "GlobalCurve",
  "GlobalGameContentTuning",
  "GlobalPlayerCondition",
  "GlobalPlayerConditionSet",
  "GlobalStrings",
  "GlyphBindableSpell",
  "GlyphExclusiveCategory",
  "GlyphProperties",
  "GlyphRequiredSpec",
  "GossipNPCOption",
  "GossipNPCOptionDisplayInfo",
  "GossipOptionXUIWidgetSet",
  "GossipUIDisplayInfoCondition",
  "GossipXGarrTalentTrees",
  "GossipXUIDisplayInfo",
  "GradientEffect",
  "GroundEffectDoodad",
  "GroundEffectTexture",
  "GroupFinderActivity",
  "GroupFinderActivityGrp",
  "GroupFinderActivityXPvpBracket",
  "GroupFinderCategory",
  "GuildColorBackground",
  "GuildColorBorder",
  "GuildColorEmblem",
  "GuildEmblem",
  "GuildPerkSpells",
  "GuildShirtBackground",
  "GuildShirtBorder",
  "GuildTabardBackground",
  "GuildTabardBorder",
  "GuildTabardEmblem",
  "Heirloom",
  "HelmetAnimScaling",
  "HelmetGeosetData",
  "HighlightColor",
  "HolidayDescriptions",
  "HolidayNames",
  "HolidayXTimeEvent",
  "Holidays",
  "HouseDecor",
  "ImportPriceArmor",
  "ImportPriceQuality",
  "ImportPriceShield",
  "ImportPriceWeapon",
  "InvasionClientData",
  "Item",
  "ItemAppearance",
  "ItemAppearanceXUiCamera",
  "ItemArmorQuality",
  "ItemArmorShield",
  "ItemArmorTotal",
  "ItemBagFamily",
  "ItemBonus",
  "ItemBonusList",
  "ItemBonusListGroup",
  "ItemBonusListGroupEntry",
  "ItemBonusListLevelDelta",
  "ItemBonusListWarforgeLevelDelta",
  "ItemBonusSeason",
  "ItemBonusSeasonBonusListGroup",
  "ItemBonusSeasonUpgradeCost",
  "ItemBonusSequenceSpell",
  "ItemBonusTree",
  "ItemBonusTreeGroupEntry",
  "ItemBonusTreeNode",
  "ItemChildEquipment",
  "ItemClass",
  "ItemCondition",
  "ItemContextPickerEntry",
  "ItemConversion",
  "ItemConversionEntry",
  "ItemCreationContext",
  "ItemCreationContextGroup",
  "ItemCurrencyCost",
  "ItemCurrencyValue",
  "ItemDamageAmmo",
  "ItemDamageOneHand",
  "ItemDamageOneHandCaster",
  "ItemDamageTwoHand",
  "ItemDamageTwoHandCaster",
  "ItemDisenchantLoot",
  "ItemDisplayInfo",
  "ItemDisplayInfoMaterialRes",
  "ItemDisplayInfoModelMatRes",
  "ItemEffect",
  "ItemExtendedCost",
  "ItemFixup",
  "ItemFixupAction",
  "ItemGroupIlvlScalingEntry",
  "ItemGroupSounds",
  "ItemLevelSelector",
  "ItemLevelSelectorQuality",
  "ItemLevelSelectorQualitySet",
  "ItemLevelWatermark",
  "ItemLimitCategory",
  "ItemLimitCategoryCondition",
  "ItemLogicalCost",
  "ItemLogicalCostGroup",
  "ItemModifiedAppearance",
  "ItemModifiedAppearanceExtra",
  "ItemNameDescription",
  "ItemNameSlotOverride",
  "ItemOffsetCurve",
  "ItemPetFood",
  "ItemPriceBase",
  "ItemRangedDisplayInfo",
  "ItemRecraft",
  "ItemReforge",
  "ItemSalvage",
  "ItemSalvageLoot",
  "ItemScalingConfig",
  "ItemSearchName",
  "ItemSet",
  "ItemSetSpell",
  "ItemSparse",
  "ItemSpec",
  "ItemSpecOverride",
  "ItemSquishEra",
  "ItemSubClass",
  "ItemSubClassMask",
  "ItemVisuals",
  "ItemVisualsXEffect",
  "ItemXBonusTree",
  "ItemXItemEffect",
  "ItemXTraitSystem",
  "JournalEncounter",
  "JournalEncounterCreature",
  "JournalEncounterItem",
  "JournalEncounterSection",
  "JournalEncounterXDifficulty",
  "JournalEncounterXMapLoc",
  "JournalInstance",
  "JournalInstanceEntrance",
  "JournalInstanceQueueLoc",
  "JournalItemXDifficulty",
  "JournalSectionXDifficulty",
  "JournalTier",
  "JournalTierXInstance",
  "Keychain",
  "KeystoneAffix",
  "LFGDungeonGroup",
  "LFGDungeons",
  "LFGRoleRequirement",
  "LabelXContentRestrictRuleSet",
  "LanguageWords",
  "Languages",
  "LfgDungeonsGroupingMap",
  "Light",
  "LightData",
  "LightParams",
  "LightParamsLightShaft",
  "LightShaft",
  "LightSkybox",
  "LightWorldShadow",
  "Lightning",
  "LiquidMaterial",
  "LiquidObject",
  "LiquidType",
  "LiquidTypeXTexture",
  "LivingWorldObjectTemplate",
  "LoadingScreenSkin",
  "LoadingScreenTaxiSplines",
  "LoadingScreens",
  "Locale",
  "Location",
  "Lock",
  "LockType",
  "LookAtController",
  "LoreText",
  "LoreTextPublic",
  "MCRSlotXMCRCategory",
  "MailTemplate",
  "ManagedWorldState",
  "ManagedWorldStateBuff",
  "ManagedWorldStateInput",
  "ManifestInterfaceActionIcon",
  "ManifestInterfaceData",
  "ManifestInterfaceItemIcon",
  "Map",
  "MapCelestialBody",
  "MapChallengeMode",
  "MapChallengeModeAffixCriteria",
  "MapDifficulty",
  "MapDifficultyXCondition",
  "MapLoadingScreen",
  "MapRenderScale",
  "MarketingPromotionsXLocale",
  "Material",
  "MawPower",
  "MawPowerRarity",
  "MinorTalent",
  "MissileTargeting",
  "ModelAnimCloakDampening",
  "ModelFileData",
  "ModelRibbonQuality",
  "ModifiedCraftingCategory",
  "ModifiedCraftingItem",
  "ModifiedCraftingReagentItem",
  "ModifiedCraftingReagentSlot",
  "ModifiedCraftingSpellSlot",
  "ModifierTree",
  "Mount",
  "MountCapability",
  "MountEquipment",
  "MountType",
  "MountTypeXCapability",
  "MountXDisplay",
  "MountXSpellVisualKitPicker",
  "Movie",
  "MovieFileData",
  "MovieVariation",
  "MultiStateProperties",
  "MultiTransitionProperties",
  "MusicOverride",
  "MythicPlusSeason",
  "MythicPlusSeasonKeyFloor",
  "MythicPlusSeasonRewardLevels",
  "MythicPlusSeasonTrackedAffix",
  "MythicPlusSeasonTrackedMap",
  "NPCCraftingOrderCustomer",
  "NPCCraftingOrderCustomerXLabel",
  "NPCCraftingOrderSet",
  "NPCCraftingOrderSetXCraftOrder",
  "NPCCraftingOrderSetXCustomer",
  "NPCCraftingOrderSetXTreasure",
  "NPCModelItemSlotDisplayInfo",
  "NPCSounds",
  "NameGen",
  "NamesProfanity",
  "NamesReserved",
  "NamesReservedLocale",
  "NumTalentsAtLevel",
  "ObjectEffect",
  "ObjectEffectModifier",
  "ObjectEffectPackageElem",
  "Occluder",
  "OccluderCurtain",
  "OccluderLocation",
  "OccluderNode",
  "OutlineEffect",
  "OverrideSpellData",
  "PVPBracketTypes",
  "PVPDifficulty",
  "PVPScoreboardCellInfo",
  "PVPScoreboardColumnHeader",
  "PVPScoreboardLayout",
  "PVPStat",
  "PageTextMaterial",
  "PaperDollItemFrame",
  "ParagonReputation",
  "ParticleColor",
  "Particulate",
  "ParticulateSound",
  "Path",
  "PathEdge",
  "PathNode",
  "PathNodeProperty",
  "PathProperty",
  "PerksActivity",
  "PerksActivityCondition",
  "PerksActivityTag",
  "PerksActivityThreshold",
  "PerksActivityThresholdGroup",
  "PerksActivityXHolidays",
  "PerksActivityXInterval",
  "PerksActivityXTag",
  "PerksUITheme",
  "PerksVendorCategory",
  "PerksVendorItem",
  "PerksVendorItemUIGroup",
  "PerksVendorItemUIInfo",
  "PerksVendorItemXInterval",
  "Phase",
  "PhaseShiftZoneSounds",
  "PhaseXPhaseGroup",
  "PingType",
  "PlayerCompanionInfo",
  "PlayerCondition",
  "PlayerDataElementAccount",
  "PlayerDataElementCharacter",
  "PlayerDataFlagAccount",
  "PlayerDataFlagCharacter",
  "PlayerInteractionInfo",
  "PointLightConditionMap",
  "Positioner",
  "PositionerState",
  "PositionerStateEntry",
  "PowerDisplay",
  "PowerType",
  "PrestigeLevelInfo",
  "ProfTraitPathNode",
  "ProfTraitPerkNode",
  "ProfTraitTree",
  "ProfTraitTreeHighlight",
  "Profession",
  "ProfessionEffect",
  "ProfessionEffectType",
  "ProfessionExpansion",
  "ProfessionPropPoints",
  "ProfessionRating",
  "ProfessionTrait",
  "ProfessionTraitXEffect",
  "ProfessionTraitXLabel",
  "ProfessionXRating",
  "PvpBrawl",
  "PvpRating",
  "PvpScalingEffect",
  "PvpScalingEffectType",
  "PvpSeason",
  "PvpSeasonRewardLevels",
  "PvpTalent",
  "PvpTalentCategory",
  "PvpTalentSlotUnlock",
  "PvpTier",
  "QuestDrivenScenario",
  "QuestFactionReward",
  "QuestFeedbackEffect",
  "QuestHub",
  "QuestInfo",
  "QuestLabel",
  "QuestLine",
  "QuestLineXQuest",
  "QuestMoneyReward",
  "QuestObjective",
  "QuestPOIBlob",
  "QuestPOIPoint",
  "QuestPackageItem",
  "QuestSort",
  "QuestV2",
  "QuestV2CliTask",
  "QuestXGroupActivity",
  "QuestXP",
  "QuestXUIQuestDetailsTheme",
  "QuestXUiWidgetSet",
  "RTPC",
  "RTPCData",
  "RafActivity",
  "RandPropPoints",
  "RecipeProgressionGroupEntry",
  "RelicSlotTierRequirement",
  "RelicTalent",
  "RenownRewards",
  "RenownRewardsPlunderstorm",
  "ResearchBranch",
  "ResearchField",
  "ResearchProject",
  "ResearchSite",
  "Resistances",
  "RewardPack",
  "RewardPackXCurrencyType",
  "RewardPackXItem",
  "RibbonQuality",
  "RolodexType",
  "RopeEffect",
  "RuneforgeLegendaryAbility",
  "SSAOSettings",
  "Scenario",
  "ScenarioEventEntry",
  "ScenarioStep",
  "SceneScript",
  "SceneScriptGlobalText",
  "SceneScriptPackage",
  "SceneScriptPackageMember",
  "SceneScriptText",
  "ScheduledInterval",
  "ScreenEffect",
  "ScreenEffectType",
  "ScreenLocation",
  "SeamlessSite",
  "ServerMessages",
  "ShadowyEffect",
  "SharedString",
  "SiegeableProperties",
  "SkillLine",
  "SkillLineAbility",
  "SkillLineXTraitTree",
  "SkillRaceClassInfo",
  "SkySceneXPlayerCondition",
  "Soulbind",
  "SoulbindConduit",
  "SoulbindConduitEnhancedSocket",
  "SoulbindConduitItem",
  "SoulbindConduitRank",
  "SoulbindConduitRankProperties",
  "SoulbindUIDisplayInfo",
  "SoundAmbience",
  "SoundAmbienceFlavor",
  "SoundBus",
  "SoundBusOverride",
  "SoundEmitterPillPoints",
  "SoundEmitters",
  "SoundEnvelope",
  "SoundFilter",
  "SoundFilterElem",
  "SoundKit",
  "SoundKitAdvanced",
  "SoundKitChild",
  "SoundKitEntry",
  "SoundKitFallback",
  "SoundMixGroup",
  "SoundOverride",
  "SoundParameter",
  "SoundProviderPreferences",
  "SoundWaterfallEmitter",
  "SourceInfo",
  "SpamMessages",
  "SpecSetMember",
  "SpecializationSpells",
  "SpecializationSpellsDisplay",
  "Spell",
  "SpellActionBarPref",
  "SpellActivationOverlay",
  "SpellAuraOptions",
  "SpellAuraRestrictions",
  "SpellAuraVisXChrSpec",
  "SpellAuraVisibility",
  "SpellCastTimes",
  "SpellCastingRequirements",
  "SpellCategories",
  "SpellCategory",
  "SpellChainEffects",
  "SpellClassOptions",
  "SpellClutterAreaEffectCounts",
  "SpellClutterFrameRates",
  "SpellClutterImpactModelCounts",
  "SpellClutterKitDistances",
  "SpellClutterMissileDist",
  "SpellClutterWeaponTrailDist",
  "SpellCooldowns",
  "SpellDescriptionVariables",
  "SpellDispelType",
  "SpellDuration",
  "SpellEffect",
  "SpellEffectAutoDescription",
  "SpellEffectEmission",
  "SpellEmpower",
  "SpellEmpowerStage",
  "SpellEquippedItems",
  "SpellFlyout",
  "SpellFlyoutItem",
  "SpellFocusObject",
  "SpellInterrupts",
  "SpellItemEnchantment",
  "SpellKeyboundOverride",
  "SpellLabel",
  "SpellLearnSpell",
  "SpellLevels",
  "SpellMechanic",
  "SpellMisc",
  "SpellMissile",
  "SpellMissileMotion",
  "SpellName",
  "SpellOverrideName",
  "SpellPower",
  "SpellPowerDifficulty",
  "SpellProceduralEffect",
  "SpellProcsPerMinute",
  "SpellProcsPerMinuteMod",
  "SpellRadius",
  "SpellRange",
  "SpellReagents",
  "SpellReagentsCurrency",
  "SpellReplacement",
  "SpellScaling",
  "SpellScript",
  "SpellShapeshift",
  "SpellShapeshiftForm",
  "SpellSpecialUnitEffect",
  "SpellTargetRestrictions",
  "SpellTotems",
  "SpellVisual",
  "SpellVisualAnim",
  "SpellVisualColorEffect",
  "SpellVisualEffectName",
  "SpellVisualEvent",
  "SpellVisualKit",
  "SpellVisualKitAreaModel",
  "SpellVisualKitEffect",
  "SpellVisualKitModelAttach",
  "SpellVisualKitPicker",
  "SpellVisualKitPickerEntry",
  "SpellVisualMissile",
  "SpellVisualScreenEffect",
  "SpellXDescriptionVariables",
  "SpellXSpellVisual",
  "SpotLightConditionMap",
  "StartupFiles",
  "Stationery",
  "SummonProperties",
  "TactKey",
  "TactKeyLookup",
  "Talent",
  "TalentTab",
  "TaxiNodes",
  "TaxiPath",
  "TaxiPathNode",
  "TerrainColorGradingRamp",
  "TerrainMaterial",
  "TerrainType",
  "TerrainTypeSounds",
  "TextureBlendSet",
  "TextureFileData",
  "TierTransition",
  "TimeEventData",
  "TotemCategory",
  "Toy",
  "TradeSkillCategory",
  "TradeSkillItem",
  "TraitCond",
  "TraitCondAccountElement",
  "TraitCost",
  "TraitCurrency",
  "TraitCurrencySource",
  "TraitDefinition",
  "TraitDefinitionEffectPoints",
  "TraitEdge",
  "TraitNode",
  "TraitNodeEntry",
  "TraitNodeEntryXTraitCond",
  "TraitNodeEntryXTraitCost",
  "TraitNodeGroup",
  "TraitNodeGroupXTraitCond",
  "TraitNodeGroupXTraitCost",
  "TraitNodeGroupXTraitNode",
  "TraitNodeXTraitCond",
  "TraitNodeXTraitCost",
  "TraitNodeXTraitNodeEntry",
  "TraitSubTree",
  "TraitSystem",
  "TraitTree",
  "TraitTreeLoadout",
  "TraitTreeLoadoutEntry",
  "TraitTreeXTraitCurrency",
  "TransformMatrix",
  "TransmogDefaultLevel",
  "TransmogHoliday",
  "TransmogIllusion",
  "TransmogSet",
  "TransmogSetGroup",
  "TransmogSetItem",
  "TransportAnimation",
  "TransportPhysics",
  "TransportRotation",
  "Trophy",
  "UIArrowCallout",
  "UIButton",
  "UIChromieTimeExpansionInfo",
  "UICinematicIntroInfo",
  "UICovenantAbility",
  "UICovenantPreview",
  "UIDeadlyDebuff",
  "UIDungeonScoreRarity",
  "UIEventToast",
  "UIExpansionDisplayInfo",
  "UIExpansionDisplayInfoIcon",
  "UIGenericWidgetDisplay",
  "UIMapPinInfo",
  "UIModifiedInstance",
  "UIScriptedAnimationEffect",
  "UISplashScreen",
  "UiCamFbackTalkingHeadChrRace",
  "UiCamFbackTransmogChrRace",
  "UiCamFbackTransmogWeapon",
  "UiCamera",
  "UiCameraType",
  "UiCanvas",
  "UiCovenantDisplayInfo",
  "UiItemInteraction",
  "UiMap",
  "UiMapArt",
  "UiMapArtStyleLayer",
  "UiMapArtTile",
  "UiMapAssignment",
  "UiMapFogOfWar",
  "UiMapFogOfWarVisualization",
  "UiMapGroup",
  "UiMapGroupMember",
  "UiMapLink",
  "UiMapXMapArt",
  "UiModelScene",
  "UiModelSceneActor",
  "UiModelSceneActorDisplay",
  "UiModelSceneCamera",
  "UiPartyPose",
  "UiQuestDetailsTheme",
  "UiTextureAtlas",
  "UiTextureAtlasElement",
  "UiTextureAtlasElementSliceData",
  "UiTextureAtlasMember",
  "UiTextureKit",
  "UiWeeklyReward",
  "UiWidget",
  "UiWidgetConstantSource",
  "UiWidgetDataSource",
  "UiWidgetMap",
  "UiWidgetSet",
  "UiWidgetStringSource",
  "UiWidgetVisTypeDataReq",
  "UiWidgetVisualization",
  "UiWidgetXWidgetSet",
  "UnitBlood",
  "UnitBloodLevels",
  "UnitCondition",
  "UnitPowerBar",
  "Vehicle",
  "VehiclePOIType",
  "VehicleSeat",
  "VehicleUIIndSeat",
  "VehicleUIIndicator",
  "Vignette",
  "VignetteUiWidgetSet",
  "VirtualAttachment",
  "VirtualAttachmentCustomization",
  "VocalUISounds",
  "VoiceOverPriority",
  "VolumeFogCondition",
  "WMOAreaTable",
  "WMOMinimapTexture",
  "WarbandPlacementDisplayInfo",
  "WarbandScene",
  "WarbandSceneAnimChrSpec",
  "WarbandSceneAnimation",
  "WarbandScenePlacement",
  "WarbandScenePlacementFilterReq",
  "WarbandScenePlacementOption",
  "WarbandSceneSourceInfo",
  "WaypointEdge",
  "WaypointMapVolume",
  "WaypointNode",
  "WaypointSafeLocs",
  "WbAccessControlList",
  "WeaponImpactSounds",
  "WeaponSwingSounds2",
  "WeaponTrail",
  "WeaponTrailModelDef",
  "WeaponTrailParam",
  "Weather",
  "WeatherXParticulate",
  "WeeklyRewardChestActivityTier",
  "WeeklyRewardChestThreshold",
  "WindSettings",
  "WorldBossLockout",
  "WorldChunkSounds",
  "WorldEffect",
  "WorldElapsedTimer",
  "WorldMapOverlay",
  "WorldMapOverlayTile",
  "WorldShadow",
  "WorldStateExpression",
  "WorldStateZoneSounds",
  "World_PVP_Area",
  "ZoneIntroMusicTable",
  "ZoneLight",
  "ZoneLightPoint",
  "ZoneMusic",
  "ZoneStory",
] as const;

type FilterMode = "all" | "supported" | "unsupported";

type TableEntry = {
  name: string;
  snakeName: string;
  supported: boolean;
  prefix: string;
};

// Pre-compute all table data once
const TABLE_DATA: TableEntry[] = ALL_DBC_TABLES.map((name) => {
  const snakeName = snakeCase(name);
  return {
    name,
    snakeName,
    supported: false, // Will be updated
    prefix: snakeName.split("_")[0] ?? "other",
  };
});

const PREFIXES = [...new Set(TABLE_DATA.map((t) => t.prefix))].sort();

function useTableData(supportedSet: Set<string>) {
  return useMemo(() => {
    const tables = TABLE_DATA.map((t) => ({
      ...t,
      supported: supportedSet.has(t.snakeName),
    }));

    const totalSupported = tables.filter((t) => t.supported).length;
    const coveragePercent = (totalSupported / tables.length) * 100;

    return { tables, totalSupported, coveragePercent };
  }, [supportedSet]);
}

function TableRow({
  table,
  onClick,
}: {
  table: TableEntry;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-2 border-b border-border/50 w-full text-left hover:bg-muted/50 transition-colors cursor-pointer",
        !table.supported && "opacity-50",
      )}
    >
      {table.supported ? (
        <Check className="h-4 w-4 text-green-500 shrink-0" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground shrink-0" />
      )}
      <code className="text-sm flex-1">{table.name}</code>
      <Badge variant="outline" className="text-xs font-normal">
        {table.prefix}
      </Badge>
    </button>
  );
}

export function TableCoverageContent() {
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [selectedPrefix, setSelectedPrefix] = useState<string>("all");
  const [selectedTable, setSelectedTable] = useState<SelectedTable | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  const supportedSet = useMemo(
    () => new Set(DBC_TABLE_NAMES as readonly string[]),
    [],
  );

  const { tables, totalSupported, coveragePercent } =
    useTableData(supportedSet);

  const exportData = useMemo(
    () => ({
      total: ALL_DBC_TABLES.length,
      supported: totalSupported,
      unsupported: ALL_DBC_TABLES.length - totalSupported,
      coveragePercent: Math.round(coveragePercent * 100) / 100,
      tables: tables.map((t) => ({
        name: t.name,
        snakeName: t.snakeName,
        supported: t.supported,
        prefix: t.prefix,
      })),
      supportedTables: tables
        .filter((t) => t.supported)
        .map((t) => t.snakeName),
      unsupportedTables: tables
        .filter((t) => !t.supported)
        .map((t) => t.snakeName),
    }),
    [tables, totalSupported, coveragePercent],
  );

  const { exportJson, downloadJson } = useJsonExport({
    data: exportData,
    filenamePrefix: "dbc-table-coverage",
    patchVersion: GAME_CONFIG.patchVersion,
    label: "Table Coverage",
  });

  const preFilteredTables = useMemo(() => {
    let result = tables;

    if (filterMode === "supported") {
      result = result.filter((t) => t.supported);
    } else if (filterMode === "unsupported") {
      result = result.filter((t) => !t.supported);
    }

    if (selectedPrefix !== "all") {
      result = result.filter((t) => t.prefix === selectedPrefix);
    }

    return result;
  }, [tables, filterMode, selectedPrefix]);

  const { results: filteredTables } = useFuzzySearch({
    items: preFilteredTables,
    query: search,
    keys: ["name", "snakeName"],
    threshold: 0.3,
  });

  const rowVirtualizer = useVirtualizer({
    count: filteredTables.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 44, []),
    overscan: 20,
  });

  const handleTableClick = (table: TableEntry) => {
    setSelectedTable({
      name: table.name,
      snakeName: table.snakeName,
      supported: table.supported,
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Stats Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-2xl font-bold">
                {totalSupported} / {ALL_DBC_TABLES.length}
              </p>
              <p className="text-sm text-muted-foreground">
                tables supported ({coveragePercent.toFixed(1)}%)
              </p>
            </div>
            {exportJson && (
              <div className="flex items-center gap-1">
                <CopyButton
                  value={exportJson}
                  label="table coverage"
                  title="Copy table coverage"
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  onClick={downloadJson}
                  title="Download coverage JSON"
                >
                  <Download />
                </Button>
              </div>
            )}
          </div>
          <Progress value={coveragePercent} className="h-2" />
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tables..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              {filterMode === "all"
                ? "All"
                : filterMode === "supported"
                  ? "Supported"
                  : "Unsupported"}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup
              value={filterMode}
              onValueChange={(v) => setFilterMode(v as FilterMode)}
            >
              <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="supported">
                Supported
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="unsupported">
                Unsupported
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              {selectedPrefix === "all"
                ? "All prefixes"
                : `${selectedPrefix}_*`}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-[300px] overflow-y-auto">
            <DropdownMenuRadioGroup
              value={selectedPrefix}
              onValueChange={setSelectedPrefix}
            >
              <DropdownMenuRadioItem value="all">
                All prefixes
              </DropdownMenuRadioItem>
              {PREFIXES.map((prefix) => (
                <DropdownMenuRadioItem key={prefix} value={prefix}>
                  {prefix}_*
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="text-sm text-muted-foreground ml-auto">
          {totalSupported}/{ALL_DBC_TABLES.length} supported (
          {filteredTables.length} shown)
        </span>
      </div>

      {/* Virtualized Table List */}
      <Card>
        <div ref={parentRef} className="h-[600px] overflow-auto">
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const table = filteredTables[virtualRow.index];
              if (!table) {
                return null;
              }
              return (
                <div
                  key={table.name}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <TableRow
                    table={table}
                    onClick={() => handleTableClick(table)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {filteredTables.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No tables match your filters
        </div>
      )}

      <TableFieldsDialog
        table={selectedTable}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
