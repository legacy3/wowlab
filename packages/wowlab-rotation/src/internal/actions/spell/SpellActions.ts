import * as Errors from "@wowlab/core/Errors";
import { Branded, CombatLog } from "@wowlab/core/Schemas";
import * as Accessors from "@wowlab/services/Accessors";
import * as CombatLogService from "@wowlab/services/CombatLog";
import * as State from "@wowlab/services/State";
import * as Unit from "@wowlab/services/Unit";
import * as Effect from "effect/Effect";

export class SpellActions extends Effect.Service<SpellActions>()(
  "SpellActions",
  {
    dependencies: [
      Unit.UnitService.Default,
      Accessors.UnitAccessor.Default,
      CombatLogService.CombatLogService.Default,
    ],
    effect: Effect.gen(function* () {
      const unitAccessor = yield* Accessors.UnitAccessor;
      const stateService = yield* State.StateService;
      const combatLog = yield* CombatLogService.CombatLogService;

      return {
        canCast: (unitId: Branded.UnitID, spellId: number) =>
          Effect.gen(function* () {
            const state = yield* stateService.getState();
            const currentTime = state.currentTime;

            const unit = yield* unitAccessor.get(unitId);
            const spell = unit.spells.all.get(Branded.SpellID(spellId));

            if (!spell) {
              return false;
            }

            // Check if spell is off cooldown
            const updatedSpell = spell.with({}, currentTime);
            return updatedSpell.isReady;
          }),

        cast: (
          unitId: Branded.UnitID,
          spellId: number,
          targetId?: Branded.UnitID,
        ) =>
          Effect.gen(function* () {
            const state = yield* stateService.getState();
            const currentTime = state.currentTime;

            const unit = yield* unitAccessor.get(unitId);
            const spell = unit.spells.all.get(Branded.SpellID(spellId));
            if (!spell) {
              return yield* Effect.fail(
                new Errors.SpellNotFound({ spellId, unitId }),
              );
            }

            // Recompute spell state at current time
            const spellAtCurrentTime = spell.with({}, currentTime);

            // Check if spell is ready
            if (!spellAtCurrentTime.isReady) {
              return yield* Effect.fail(
                new Errors.SpellOnCooldown({
                  remainingCooldown:
                    spellAtCurrentTime.cooldownExpiry - currentTime,
                  spell: spellAtCurrentTime,
                }),
              );
            }

            // TODO This seemed hacked
            let destGUID = "";
            let destName = "";

            if (targetId) {
              const targetResult = yield* Effect.either(
                unitAccessor.get(targetId),
              );

              if (targetResult._tag === "Right") {
                destGUID = targetId;
                destName = targetResult.right.name;
              }
            }

            // Emit SPELL_CAST_SUCCESS event to the combat log
            const castEvent = new CombatLog.SpellCastSuccess({
              destFlags: 0,
              destGUID,
              destName,
              destRaidFlags: 0,
              hideCaster: false,
              sourceFlags: 0,
              sourceGUID: unitId,
              sourceName: unit.name,
              sourceRaidFlags: 0,
              spellId,
              spellName: spell.info.name,
              spellSchool: spell.info.schoolMask ?? 1,
              timestamp: currentTime,
            });
            yield* combatLog.emit(castEvent);

            // Determine cooldown: use chargeRecoveryTime for charge-based spells, otherwise recoveryTime
            // chargeRecoveryTime > 0 indicates a charge-based spell (like Barbed Shot, Kill Command)
            // recoveryTime is used for traditional cooldowns (like Bestial Wrath)
            const isChargeBased = spell.info.chargeRecoveryTime > 0;
            const cooldownMs = isChargeBased
              ? spell.info.chargeRecoveryTime
              : spell.info.recoveryTime || 0;
            const cooldownSeconds = cooldownMs / 1000;

            // Trigger the spell's cooldown if it has one
            if (cooldownSeconds > 0) {
              const newCooldownExpiry = currentTime + cooldownSeconds;
              const updatedSpell = spellAtCurrentTime.with(
                { cooldownExpiry: newCooldownExpiry },
                currentTime,
              );

              yield* unitAccessor.updateSpell(
                unitId,
                Branded.SpellID(spellId),
                updatedSpell,
              );
            }

            // Only advance simulation time if spell triggers the GCD
            // startRecoveryTime == 0 means the spell is off-GCD (like Bestial Wrath)
            const gcdMs = spell.info.startRecoveryTime;
            const consumedGCD = gcdMs > 0;

            if (consumedGCD) {
              const gcdSeconds = gcdMs / 1000;
              const newTime = currentTime + gcdSeconds;
              yield* stateService.updateState((s) =>
                s.set("currentTime", newTime),
              );
            }

            // Return whether this cast consumed the GCD
            return { consumedGCD };
          }),
      };
    }),
  },
) {}
