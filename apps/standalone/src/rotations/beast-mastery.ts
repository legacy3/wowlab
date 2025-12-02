import * as Context from "@wowlab/rotation/Context";
import * as Effect from "effect/Effect";

import { tryCast } from "../framework/rotation-utils.js";
import { RotationDefinition } from "../framework/types.js";

// =============================================================================
// Beast Mastery Hunter Spell IDs
// =============================================================================

const SpellIds = {
  // Core Rotational Abilities
  KILL_COMMAND: 34026, // Pet ability trigger, 30 Focus, 7.5s CD (2 charges with Alpha Predator)
  BARBED_SHOT: 217200, // DoT + Frenzy trigger, 18s recharge (2 charges)
  COBRA_SHOT: 193455, // Focus spender, reduces Kill Command CD by 1s
  MULTI_SHOT: 2643, // AoE, triggers Beast Cleave

  // Major Cooldowns
  // NOTE: Bestial Wrath DBC shows startRecoveryTime=1500 but in-game it's off-GCD
  BESTIAL_WRATH: 19574, // 15s duration, 90s CD - damage buff for Hunter and pets
  CALL_OF_THE_WILD: 359844, // 20s duration, 120s CD - summons stable pets
  BLOODSHED: 321530, // Pet command, 60s CD - bleed DoT (321538 is the DoT effect, 321530 is the cast)

  // Execute / Utility
  KILL_SHOT: 53351, // Execute at 20% health, 10s recharge
  EXPLOSIVE_SHOT: 212431, // AoE damage, 30s CD
} as const;

// =============================================================================
// Beast Mastery Hunter Rotation
// =============================================================================

export const BeastMasteryRotation: RotationDefinition = {
  name: "Beast Mastery Hunter",

  spellIds: [
    SpellIds.COBRA_SHOT,
    SpellIds.BARBED_SHOT,
    SpellIds.KILL_COMMAND,
    SpellIds.MULTI_SHOT,
    SpellIds.BESTIAL_WRATH,
    SpellIds.CALL_OF_THE_WILD,
    SpellIds.BLOODSHED,
    SpellIds.KILL_SHOT,
    SpellIds.EXPLOSIVE_SHOT,
  ],

  run: (playerId) =>
    Effect.gen(function* () {
      const rotation = yield* Context.RotationContext;

      // =======================================================================
      // Beast Mastery Single Target APL
      // Based on SimC APL structure: cds -> st priority
      // =======================================================================

      // -----------------------------------------------------------------------
      // Cooldowns (off-GCD abilities)
      // -----------------------------------------------------------------------

      // Bestial Wrath - Major offensive cooldown
      const bw = yield* tryCast(rotation, playerId, SpellIds.BESTIAL_WRATH);
      if (bw.cast && bw.consumedGCD) return;

      // Call of the Wild - Major cooldown, summons stable pets
      const cotw = yield* tryCast(
        rotation,
        playerId,
        SpellIds.CALL_OF_THE_WILD,
      );
      if (cotw.cast && cotw.consumedGCD) return;

      // -----------------------------------------------------------------------
      // Single Target Priority
      // -----------------------------------------------------------------------

      // Barbed Shot - Prevent charge cap
      // TODO: Add charge cap check (full_recharge_time<gcd)
      const bs = yield* tryCast(rotation, playerId, SpellIds.BARBED_SHOT);
      if (bs.cast && bs.consumedGCD) return;

      // Bloodshed - Use on cooldown
      const bloodshed = yield* tryCast(rotation, playerId, SpellIds.BLOODSHED);
      if (bloodshed.cast && bloodshed.consumedGCD) return;

      // Kill Shot - Execute phase
      // TODO: Add health threshold check (target below 20% or Deathblow proc)
      const ks = yield* tryCast(rotation, playerId, SpellIds.KILL_SHOT);
      if (ks.cast && ks.consumedGCD) return;

      // Kill Command - Core damage ability
      // TODO: Add charge comparison (charges_fractional>=barbed_shot.charges_fractional)
      const kc = yield* tryCast(rotation, playerId, SpellIds.KILL_COMMAND);
      if (kc.cast && kc.consumedGCD) return;

      // Explosive Shot - If talented with Thundering Hooves
      // TODO: Add talent check
      const es = yield* tryCast(rotation, playerId, SpellIds.EXPLOSIVE_SHOT);
      if (es.cast && es.consumedGCD) return;

      // Cobra Shot - Filler ability (reduces Kill Command CD by 1s)
      yield* tryCast(rotation, playerId, SpellIds.COBRA_SHOT);
    }),
};
