// Beast Mastery Hunter - Single Target Rotation
//
// Based on SimulationCraft APL (TWW Season 3)
// Priority-based rotation for maximum single-target DPS.

// ============================================================================
// COOLDOWNS - Use on cooldown
// ============================================================================

// Major cooldowns (off-GCD)
if bestial_wrath.ready() { cast("bestial_wrath") }

// On-GCD cooldowns
if call_of_the_wild.ready() { cast("call_of_the_wild") }
if bloodshed.ready() { cast("bloodshed") }

// ============================================================================
// CORE ROTATION
// ============================================================================

// Kill Command - highest priority rotational ability
if kill_command.ready() { cast("kill_command") }

// Barbed Shot - maintain Frenzy stacks and avoid capping charges
if barbed_shot.ready() { cast("barbed_shot") }

// ============================================================================
// EXECUTE
// ============================================================================

// Kill Shot - use during execute phase (handled by spell availability)
if kill_shot.ready() { cast("kill_shot") }

// ============================================================================
// FILLERS
// ============================================================================

// Cobra Shot - primary focus dump
if cobra_shot.ready() { cast("cobra_shot") }

// Multi-Shot - fallback (should rarely reach this in ST)
if multi_shot.ready() { cast("multi_shot") }
