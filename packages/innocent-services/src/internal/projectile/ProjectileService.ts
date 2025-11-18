import * as Entities from "@packages/innocent-domain/Entities";
import * as Events from "@packages/innocent-domain/Events";
import * as State from "@packages/innocent-domain/State";
import * as Branded from "@packages/innocent-schemas/Branded";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";

import * as Accessors from "@/Accessors";
import * as Lifecycle from "@/Lifecycle";
import * as Log from "@/Log";
import * as Scheduler from "@/Scheduler";
import * as StateServices from "@/State";
import * as Unit from "@/Unit";

export class ProjectileService extends Effect.Service<ProjectileService>()(
  "ProjectileService",
  {
    dependencies: [
      StateServices.StateService.Default,
      Unit.UnitService.Default,
      Accessors.UnitAccessor.Default,
      Lifecycle.SpellLifecycleService.Default,
      Scheduler.EventSchedulerService.Default,
      Log.LogService.Default,
    ],
    effect: Effect.gen(function* () {
      const state = yield* StateServices.StateService;
      const units = yield* Unit.UnitService;
      const unitAccessor = yield* Accessors.UnitAccessor;
      const lifecycle = yield* Lifecycle.SpellLifecycleService;
      const scheduler = yield* Scheduler.EventSchedulerService;
      const logService = yield* Log.LogService;

      return {
        // === CRUD OPERATIONS ===

        add: (projectile: Entities.Projectile) =>
          state.updateState((s: State.GameState) =>
            s.setIn(["projectiles", projectile.id], projectile),
          ),

        remove: (projectileId: Branded.ProjectileID) =>
          state.updateState((s: State.GameState) =>
            s.set("projectiles", s.projectiles.delete(projectileId)),
          ),

        // === PROJECTILE LOGIC ===

        launch: (
          casterUnitId: Branded.UnitID,
          targetUnitId: Branded.UnitID,
          spell: Entities.Spell,
          damage: number,
          travelTime: number,
        ) =>
          Effect.gen(function* () {
            const currentState = yield* state.getState();
            const currentTime = currentState.currentTime;

            const projectileId = Branded.ProjectileID(
              `proj-${Date.now()}-${Math.random()}`,
            );

            const projectile = Entities.Projectile.create({
              casterUnitId,
              damage,
              id: projectileId,
              impactTime: currentTime + travelTime,
              launchTime: currentTime,
              spell,
              targetUnitId,
            });

            yield* state.updateState((s: State.GameState) =>
              s.setIn(["projectiles", projectile.id], projectile),
            );

            // Schedule projectile impact event
            yield* scheduler.schedule({
              execute: Effect.gen(function* () {
                const currentState = yield* state.getState();
                const proj = currentState.projectiles.get(projectileId);

                if (!proj) {
                  return; // Projectile already removed
                }

                // Apply damage
                yield* units.health.damage(proj.targetUnitId, proj.damage);

                // Execute onHit modifiers
                const target = yield* unitAccessor.get(proj.targetUnitId);
                yield* pipe(
                  lifecycle.executeOnHit(proj.spell, target),
                  Effect.catchTag("Modifier", (error) =>
                    logService.error(
                      "ProjectileService",
                      `OnHit modifier ${error.modifierName} failed: ${error.reason}`,
                      {
                        modifierName: error.modifierName,
                        projectileId,
                        reason: error.reason,
                        spellId: proj.spell.info.id,
                        targetUnitId: proj.targetUnitId,
                      },
                    ),
                  ),
                );

                // Remove projectile
                yield* state.updateState((s: State.GameState) =>
                  s.set("projectiles", s.projectiles.delete(projectileId)),
                );
              }),
              id: `projectile_impact_${projectileId}`,
              payload: {
                casterUnitId,
                damage,
                projectileId,
                spell,
                targetUnitId,
              },
              priority:
                Events.EVENT_PRIORITY[Events.EventType.PROJECTILE_IMPACT],
              time: projectile.impactTime,
              type: Events.EventType.PROJECTILE_IMPACT,
            });

            return projectileId;
          }),
      };
    }),
  },
) {}
