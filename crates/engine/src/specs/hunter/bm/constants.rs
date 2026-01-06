use crate::types::{SpellIdx, AuraIdx, ProcIdx};

// ============================================================================
// Spell IDs - Core Abilities
// ============================================================================

/// Kill Command
pub const KILL_COMMAND: SpellIdx = SpellIdx(34026);
/// Cobra Shot
pub const COBRA_SHOT: SpellIdx = SpellIdx(193455);
/// Barbed Shot
pub const BARBED_SHOT: SpellIdx = SpellIdx(217200);
/// Bestial Wrath
pub const BESTIAL_WRATH: SpellIdx = SpellIdx(19574);
/// Multi-Shot
pub const MULTI_SHOT: SpellIdx = SpellIdx(2643);
/// Beast Cleave
pub const BEAST_CLEAVE_SPELL: SpellIdx = SpellIdx(115939);
/// Kill Shot
pub const KILL_SHOT: SpellIdx = SpellIdx(53351);

// ============================================================================
// Spell IDs - Major Cooldowns
// ============================================================================

/// A Murder of Crows
pub const MURDER_OF_CROWS: SpellIdx = SpellIdx(131894);
/// Bloodshed
pub const BLOODSHED: SpellIdx = SpellIdx(321530);
/// Call of the Wild
pub const CALL_OF_THE_WILD: SpellIdx = SpellIdx(359844);
/// Dire Beast
pub const DIRE_BEAST: SpellIdx = SpellIdx(120679);
/// Explosive Shot (from Thundering Hooves)
pub const EXPLOSIVE_SHOT: SpellIdx = SpellIdx(212431);

// ============================================================================
// Spell IDs - Pet Abilities
// ============================================================================

/// Pet auto-attack
pub const PET_MELEE: SpellIdx = SpellIdx(100001);
/// Pet Kill Command damage
pub const PET_KILL_COMMAND: SpellIdx = SpellIdx(100002);
/// Pet Stomp
pub const PET_STOMP: SpellIdx = SpellIdx(201754);
/// Pet Claw/Bite/Smack
pub const PET_BASIC_ATTACK: SpellIdx = SpellIdx(16827);
/// Kill Cleave (KC cleaves during Beast Cleave)
pub const KILL_CLEAVE: SpellIdx = SpellIdx(100003);
/// Dire Beast attack
pub const DIRE_BEAST_ATTACK: SpellIdx = SpellIdx(100004);
/// Animal Companion pet KC
pub const ANIMAL_COMPANION_KC: SpellIdx = SpellIdx(100005);

// ============================================================================
// Spell IDs - Hero Talents (Pack Leader)
// ============================================================================

/// Howl of the Pack Leader
pub const HOWL_OF_THE_PACK_LEADER: SpellIdx = SpellIdx(471878);
/// Boar Charge
pub const BOAR_CHARGE: SpellIdx = SpellIdx(471936);
/// Boar Charge Cleave
pub const BOAR_CHARGE_CLEAVE: SpellIdx = SpellIdx(471938);

// ============================================================================
// Spell IDs - Hero Talents (Dark Ranger)
// ============================================================================

/// Black Arrow
pub const BLACK_ARROW: SpellIdx = SpellIdx(467902);
/// Black Arrow DoT
pub const BLACK_ARROW_DOT_SPELL: SpellIdx = SpellIdx(468572);
/// Shadow Hound attack
pub const SHADOW_HOUND_ATTACK: SpellIdx = SpellIdx(100010);

// ============================================================================
// Aura IDs - Core Buffs
// ============================================================================

/// Bestial Wrath buff
pub const BESTIAL_WRATH_BUFF: AuraIdx = AuraIdx(19574);
/// Frenzy (pet attack speed stacks)
pub const FRENZY: AuraIdx = AuraIdx(272790);
/// Barbed Shot DoT
pub const BARBED_SHOT_DOT: AuraIdx = AuraIdx(217200);
/// Beast Cleave buff
pub const BEAST_CLEAVE: AuraIdx = AuraIdx(118455);
/// Call of the Wild buff
pub const CALL_OF_THE_WILD_BUFF: AuraIdx = AuraIdx(359844);
/// Bloodshed debuff
pub const BLOODSHED_DEBUFF: AuraIdx = AuraIdx(321538);
/// A Murder of Crows debuff
pub const MURDER_OF_CROWS_DEBUFF: AuraIdx = AuraIdx(131894);
/// Aspect of the Wild buff
pub const ASPECT_OF_THE_WILD: AuraIdx = AuraIdx(193530);

// ============================================================================
// Aura IDs - Talent Buffs
// ============================================================================

/// Thrill of the Hunt (crit stacks)
pub const THRILL_OF_THE_HUNT: AuraIdx = AuraIdx(257946);
/// Thrill of the Hunt (pet crit buff)
pub const THRILL_OF_THE_HUNT_PET: AuraIdx = AuraIdx(312365);
/// Serpentine Rhythm stacks
pub const SERPENTINE_RHYTHM: AuraIdx = AuraIdx(459631);
/// Piercing Fangs (pet crit during BW)
pub const PIERCING_FANGS: AuraIdx = AuraIdx(392054);
/// Serpent Sting (from Poisoned Barbs)
pub const SERPENT_STING: AuraIdx = AuraIdx(271788);
/// Laceration bleed
pub const LACERATION: AuraIdx = AuraIdx(459655);
/// Free Cobra Shot proc (Snakeskin Quiver)
pub const SNAKESKIN_QUIVER_PROC: AuraIdx = AuraIdx(459636);
/// Wild Instincts debuff (during CotW)
pub const WILD_INSTINCTS: AuraIdx = AuraIdx(469885);
/// Brutal Companion buff
pub const BRUTAL_COMPANION_BUFF: AuraIdx = AuraIdx(459729);

// ============================================================================
// Aura IDs - Hero Talent Buffs (Pack Leader)
// ============================================================================

/// Wyvern Ready
pub const WYVERN_READY: AuraIdx = AuraIdx(471878);
/// Boar Ready
pub const BOAR_READY: AuraIdx = AuraIdx(472324);
/// Bear Ready
pub const BEAR_READY: AuraIdx = AuraIdx(472325);
/// Mongoose Fury (from hogstrider)
pub const MONGOOSE_FURY: AuraIdx = AuraIdx(471939);
/// Pack Mentality buff
pub const PACK_MENTALITY: AuraIdx = AuraIdx(471935);
/// Envenomed Fangs DoT
pub const ENVENOMED_FANGS: AuraIdx = AuraIdx(471944);

// ============================================================================
// Aura IDs - Hero Talent Buffs (Dark Ranger)
// ============================================================================

/// Black Arrow DoT
pub const BLACK_ARROW_DOT: AuraIdx = AuraIdx(468572);
/// Phantom Pain buff (damage replication)
pub const PHANTOM_PAIN: AuraIdx = AuraIdx(468560);
/// Withering Fire buff
pub const WITHERING_FIRE: AuraIdx = AuraIdx(468566);

// ============================================================================
// Proc IDs - Base Procs
// ============================================================================

/// Wild Call (Barbed Shot reset)
pub const WILD_CALL: ProcIdx = ProcIdx(1);
/// Barbed Wrath CDR
pub const BARBED_WRATH: ProcIdx = ProcIdx(2);

// ============================================================================
// Proc IDs - Talent Procs
// ============================================================================

/// War Orders (KC reset on Barbed Shot)
pub const WAR_ORDERS: ProcIdx = ProcIdx(10);
/// Thrill of the Hunt proc
pub const THRILL_OF_THE_HUNT_PROC: ProcIdx = ProcIdx(11);
/// Go for the Throat (KC crit damage)
pub const GO_FOR_THE_THROAT: ProcIdx = ProcIdx(12);
/// Laceration (bleed on crits)
pub const LACERATION_PROC: ProcIdx = ProcIdx(13);
/// Barbed Scales (Cobra Shot reduces BS CD)
pub const BARBED_SCALES: ProcIdx = ProcIdx(14);
/// Snakeskin Quiver (free Cobra Shot)
pub const SNAKESKIN_QUIVER: ProcIdx = ProcIdx(15);
/// Cobra Senses (extra Cobra on KC)
pub const COBRA_SENSES: ProcIdx = ProcIdx(16);
/// Alpha Predator (extra BS charge)
pub const ALPHA_PREDATOR: ProcIdx = ProcIdx(17);
/// Hunter's Prey (Kill Shot CDR)
pub const HUNTERS_PREY: ProcIdx = ProcIdx(18);
/// Dire Command (KC spawns Dire Beast)
pub const DIRE_COMMAND: ProcIdx = ProcIdx(19);
/// Huntmaster's Call (summon Fenryr/Hati)
pub const HUNTSMASTERS_CALL: ProcIdx = ProcIdx(20);
/// Killer Instinct (+50% dmg vs low HP)
pub const KILLER_INSTINCT: ProcIdx = ProcIdx(21);
/// Master Handler (BS ticks reduce KC CD)
pub const MASTER_HANDLER: ProcIdx = ProcIdx(22);
/// Thundering Hooves (Explosive Shot during BW)
pub const THUNDERING_HOOVES: ProcIdx = ProcIdx(23);
/// Killer Cobra (KC reset during BW)
pub const KILLER_COBRA: ProcIdx = ProcIdx(24);
/// Scent of Blood (BW resets BS charges)
pub const SCENT_OF_BLOOD: ProcIdx = ProcIdx(25);
/// Brutal Companion (extra attack at max Frenzy)
pub const BRUTAL_COMPANION: ProcIdx = ProcIdx(26);
/// Stomp (pet AoE on Barbed Shot)
pub const STOMP_PROC: ProcIdx = ProcIdx(27);
/// Bloodshed Dire Beast spawn
pub const BLOODSHED_DIRE_BEAST: ProcIdx = ProcIdx(28);

// ============================================================================
// Proc IDs - Hero Talents
// ============================================================================

/// Lead from the Front
pub const LEAD_FROM_THE_FRONT: ProcIdx = ProcIdx(40);
/// Covering Fire (Multi-Shot extends Beast Cleave)
pub const COVERING_FIRE: ProcIdx = ProcIdx(41);
/// Ursine Fury (Bear reduces KC CD)
pub const URSINE_FURY: ProcIdx = ProcIdx(42);
/// Bleak Powder (Black Arrow spread)
pub const BLEAK_POWDER: ProcIdx = ProcIdx(43);
/// Withering Fire proc
pub const WITHERING_FIRE_PROC: ProcIdx = ProcIdx(44);

// ============================================================================
// Talent Flags (bitflags for enabled talents)
// ============================================================================

bitflags::bitflags! {
    /// BM Hunter talent flags
    #[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
    pub struct TalentFlags: u64 {
        // Spec Talents - Row 1
        const ANIMAL_COMPANION = 1 << 0;
        const SOLITARY_COMPANION = 1 << 1;
        const PACK_TACTICS = 1 << 2;
        const ASPECT_OF_THE_BEAST = 1 << 3;

        // Spec Talents - Row 2
        const WAR_ORDERS = 1 << 4;
        const THRILL_OF_THE_HUNT = 1 << 5;
        const GO_FOR_THE_THROAT = 1 << 6;
        const LACERATION = 1 << 7;

        // Spec Talents - Row 3
        const BARBED_SCALES = 1 << 8;
        const SNAKESKIN_QUIVER = 1 << 9;
        const COBRA_SENSES = 1 << 10;
        const ALPHA_PREDATOR = 1 << 11;
        const HUNTERS_PREY = 1 << 12;

        // Spec Talents - Row 4
        const POISONED_BARBS = 1 << 13;
        const STOMP = 1 << 14;
        const SERPENTINE_RHYTHM = 1 << 15;
        const KILL_CLEAVE = 1 << 16;
        const TRAINING_EXPERT = 1 << 17;

        // Spec Talents - Row 5
        const DIRE_COMMAND = 1 << 18;
        const HUNTMASTERS_CALL = 1 << 19;
        const DIRE_CLEAVE = 1 << 20;
        const KILLER_INSTINCT = 1 << 21;

        // Spec Talents - Row 6
        const MASTER_HANDLER = 1 << 22;
        const THUNDERING_HOOVES = 1 << 23;
        const DIRE_FRENZY = 1 << 24;

        // Spec Talents - Row 7
        const KILLER_COBRA = 1 << 25;
        const SCENT_OF_BLOOD = 1 << 26;
        const BRUTAL_COMPANION = 1 << 27;

        // Spec Talents - Row 8
        const WILD_INSTINCTS = 1 << 28;
        const BLOODY_FRENZY = 1 << 29;
        const PIERCING_FANGS = 1 << 30;
        const WILDSPEAKER = 1 << 31;

        // Major Cooldowns
        const BLOODSHED = 1 << 32;
        const CALL_OF_THE_WILD = 1 << 33;
        const DIRE_BEAST = 1 << 34;
        const MURDER_OF_CROWS = 1 << 35;

        // Hero Talents - Pack Leader
        const HOWL_OF_THE_PACK_LEADER = 1 << 40;
        const PACK_MENTALITY = 1 << 41;
        const URSINE_FURY = 1 << 42;
        const ENVENOMED_FANGS = 1 << 43;
        const LEAD_FROM_THE_FRONT = 1 << 44;
        const COVERING_FIRE = 1 << 45;

        // Hero Talents - Dark Ranger
        const BLACK_ARROW = 1 << 48;
        const PHANTOM_PAIN = 1 << 49;
        const WITHERING_FIRE = 1 << 50;
        const BLEAK_POWDER = 1 << 51;
    }
}

// ============================================================================
// Tuning Constants - Core
// ============================================================================

/// Focus regeneration per second (base)
pub const FOCUS_REGEN_BASE: f32 = 5.0;
/// Kill Command Focus cost
pub const KILL_COMMAND_COST: f32 = 30.0;
/// Cobra Shot Focus cost
pub const COBRA_SHOT_COST: f32 = 35.0;
/// Barbed Shot charges
pub const BARBED_SHOT_CHARGES: u8 = 2;
/// Barbed Shot recharge time (seconds)
pub const BARBED_SHOT_RECHARGE: f32 = 12.0;
/// Frenzy max stacks
pub const FRENZY_MAX_STACKS: u8 = 3;
/// Frenzy duration (seconds)
pub const FRENZY_DURATION: f32 = 8.0;
/// Bestial Wrath duration (seconds)
pub const BESTIAL_WRATH_DURATION: f32 = 15.0;
/// Bestial Wrath cooldown (seconds)
pub const BESTIAL_WRATH_COOLDOWN: f32 = 90.0;
/// Beast Cleave duration (seconds)
pub const BEAST_CLEAVE_DURATION: f32 = 4.0;
/// Wild Call proc chance
pub const WILD_CALL_CHANCE: f32 = 0.20;
/// Cobra Shot CDR for Kill Command
pub const COBRA_SHOT_CDR: f32 = 1.0;
/// Player ranged attack speed (ms)
pub const RANGED_ATTACK_SPEED: f32 = 2600.0;

// ============================================================================
// Tuning Constants - Major Cooldowns
// ============================================================================

/// Call of the Wild duration
pub const CALL_OF_THE_WILD_DURATION: f32 = 20.0;
/// Call of the Wild cooldown
pub const CALL_OF_THE_WILD_COOLDOWN: f32 = 120.0;
/// Call of the Wild pet spawn interval
pub const CALL_OF_THE_WILD_INTERVAL: f32 = 4.0;
/// Call of the Wild CDR per summon (25%)
pub const CALL_OF_THE_WILD_CDR_PERCENT: f32 = 0.25;

/// Bloodshed duration
pub const BLOODSHED_DURATION: f32 = 12.0;
/// Bloodshed cooldown
pub const BLOODSHED_COOLDOWN: f32 = 60.0;
/// Bloodshed AP coefficient
pub const BLOODSHED_AP_COEF: f32 = 1.2;
/// Bloodshed Dire Beast proc chance
pub const BLOODSHED_DIRE_BEAST_CHANCE: f32 = 0.10;

/// Dire Beast duration
pub const DIRE_BEAST_DURATION: f32 = 8.0;
/// Dire Beast cooldown
pub const DIRE_BEAST_COOLDOWN: f32 = 10.0;
/// Dire Beast AP coefficient
pub const DIRE_BEAST_AP_COEF: f32 = 1.0;
/// Hati/Fenryr AP coefficient (2x)
pub const SPECIAL_BEAST_AP_COEF: f32 = 2.0;

/// A Murder of Crows duration
pub const MURDER_OF_CROWS_DURATION: f32 = 15.0;
/// A Murder of Crows cooldown
pub const MURDER_OF_CROWS_COOLDOWN: f32 = 60.0;
/// A Murder of Crows tick interval
pub const MURDER_OF_CROWS_TICK: f32 = 1.0;

// ============================================================================
// Tuning Constants - Talent Effects
// ============================================================================

/// War Orders KC reset chance
pub const WAR_ORDERS_CHANCE: f32 = 0.50;
/// War Orders Barbed Shot damage bonus
pub const WAR_ORDERS_DAMAGE_BONUS: f32 = 0.10;

/// Thrill of the Hunt crit per stack
pub const THRILL_OF_THE_HUNT_CRIT: f32 = 0.02;
/// Thrill of the Hunt max stacks
pub const THRILL_OF_THE_HUNT_STACKS: u8 = 3;
/// Thrill of the Hunt duration
pub const THRILL_OF_THE_HUNT_DURATION: f32 = 12.0;

/// Go for the Throat crit damage scaling
pub const GO_FOR_THE_THROAT_SCALING: f32 = 0.02; // Per 1% crit

/// Laceration AP coefficient
pub const LACERATION_AP_COEF: f32 = 0.10;
/// Laceration duration
pub const LACERATION_DURATION: f32 = 4.0;

/// Barbed Scales CDR
pub const BARBED_SCALES_CDR: f32 = 1.0;

/// Snakeskin Quiver proc chance
pub const SNAKESKIN_QUIVER_CHANCE: f32 = 0.20;

/// Alpha Predator extra KC damage
pub const ALPHA_PREDATOR_KC_BONUS: f32 = 0.30;

/// Hunter's Prey KC crit Kill Shot CDR
pub const HUNTERS_PREY_CDR: f32 = 2.0;

/// Poisoned Barbs Serpent Sting duration
pub const SERPENT_STING_DURATION: f32 = 12.0;

/// Stomp AP coefficient
pub const STOMP_AP_COEF: f32 = 0.25;

/// Serpentine Rhythm damage per stack
pub const SERPENTINE_RHYTHM_DAMAGE: f32 = 0.05;
/// Serpentine Rhythm max stacks
pub const SERPENTINE_RHYTHM_STACKS: u8 = 4;
/// Serpentine Rhythm duration
pub const SERPENTINE_RHYTHM_DURATION: f32 = 10.0;

/// Kill Cleave damage percent
pub const KILL_CLEAVE_DAMAGE: f32 = 0.60;

/// Training Expert pet damage bonus
pub const TRAINING_EXPERT_BONUS: f32 = 0.10;

/// Dire Command proc chance
pub const DIRE_COMMAND_CHANCE: f32 = 0.10;

/// Huntmaster's Call stack requirement
pub const HUNTSMASTERS_CALL_STACKS: u8 = 3;

/// Killer Instinct health threshold
pub const KILLER_INSTINCT_THRESHOLD: f32 = 0.35;
/// Killer Instinct damage bonus
pub const KILLER_INSTINCT_BONUS: f32 = 0.50;

/// Master Handler KC CDR per tick
pub const MASTER_HANDLER_CDR: f32 = 0.5;

/// Dire Frenzy duration extension
pub const DIRE_FRENZY_EXTENSION: f32 = 1.0;

/// Scent of Blood charge restore
pub const SCENT_OF_BLOOD_CHARGES: u8 = 2;

/// Piercing Fangs pet crit bonus
pub const PIERCING_FANGS_CRIT: f32 = 0.10;
/// Piercing Fangs pet crit damage bonus
pub const PIERCING_FANGS_CRIT_DAMAGE: f32 = 0.20;

// ============================================================================
// Tuning Constants - Hero Talents (Pack Leader)
// ============================================================================

/// Pack Mentality KC damage bonus
pub const PACK_MENTALITY_BONUS: f32 = 0.10;

/// Ursine Fury KC CDR
pub const URSINE_FURY_CDR: f32 = 1.0;

/// Envenomed Fangs duration
pub const ENVENOMED_FANGS_DURATION: f32 = 6.0;
/// Envenomed Fangs tick interval
pub const ENVENOMED_FANGS_TICK: f32 = 2.0;

/// Covering Fire Beast Cleave extension
pub const COVERING_FIRE_EXTENSION: f32 = 2.0;

// ============================================================================
// Tuning Constants - Hero Talents (Dark Ranger)
// ============================================================================

/// Black Arrow duration
pub const BLACK_ARROW_DURATION: f32 = 18.0;
/// Black Arrow cooldown
pub const BLACK_ARROW_COOLDOWN: f32 = 30.0;
/// Black Arrow tick interval
pub const BLACK_ARROW_TICK: f32 = 3.0;
/// Black Arrow AP coefficient
pub const BLACK_ARROW_AP_COEF: f32 = 0.20;

/// Phantom Pain damage replication
pub const PHANTOM_PAIN_REPLICATION: f32 = 0.10;

/// Withering Fire free cast threshold
pub const WITHERING_FIRE_THRESHOLD: f32 = 0.20;

/// Bleak Powder spread targets
pub const BLEAK_POWDER_TARGETS: u8 = 2;
/// Bleak Powder damage reduction
pub const BLEAK_POWDER_REDUCTION: f32 = 0.30;
