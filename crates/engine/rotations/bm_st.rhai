// Beast Mastery Hunter - Single Target Rotation
//
// Priority-based rotation for maximum single-target DPS.
// Uses predictive gating for efficient condition evaluation.

// ============================================================================
// COOLDOWNS - Use on cooldown
// ============================================================================

// Major cooldowns (off-GCD)
if bestial_wrath.ready() { cast("bestial_wrath") }
if aspect_of_the_wild.ready() { cast("aspect_of_the_wild") }

// On-GCD cooldowns
if call_of_the_wild.ready() { cast("call_of_the_wild") }
if bloodshed.ready() { cast("bloodshed") }

// ============================================================================
// CORE ROTATION
// ============================================================================

// Kill Command - highest priority rotational ability
if kill_command.ready() { cast("kill_command") }

// Barbed Shot - maintain Frenzy stacks and use charges
if barbed_shot.ready() { cast("barbed_shot") }

// ============================================================================
// TALENTS
// ============================================================================

// A Murder of Crows - use on cooldown
if a_murder_of_crows.ready() { cast("a_murder_of_crows") }

// Dire Beast - use on cooldown
if dire_beast.ready() { cast("dire_beast") }

// ============================================================================
// FILLERS
// ============================================================================

// Chimaera Shot (if talented)
if chimaera_shot.ready() { cast("chimaera_shot") }

// Cobra Shot - primary focus dump
if cobra_shot.ready() { cast("cobra_shot") }

// Multi-Shot - fallback (should rarely reach this)
if multi_shot.ready() { cast("multi_shot") }
