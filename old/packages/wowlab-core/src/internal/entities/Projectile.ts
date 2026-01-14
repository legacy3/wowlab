import { Record } from "immutable";

import * as Branded from "../schemas/Branded.js";
import { createNotFoundSpell, Spell } from "./Spell.js";

interface ProjectileProps extends ProjectileSourceProps {}

interface ProjectileSourceProps {
  readonly casterUnitId: Branded.UnitID;
  readonly damage: number;
  readonly id: Branded.ProjectileID;
  readonly impactTime: number;
  readonly launchTime: number;
  readonly spell: Spell;
  readonly targetUnitId: Branded.UnitID;
}

const ProjectileRecord = Record<ProjectileProps>({
  casterUnitId: Branded.UnitID("unknown"),
  damage: 0,
  id: Branded.ProjectileID("unknown"),
  impactTime: 0,
  launchTime: 0,
  spell: createNotFoundSpell(Branded.SpellID(-1)),
  targetUnitId: Branded.UnitID("unknown"),
});

export class Projectile extends ProjectileRecord {
  static create(props: ProjectileSourceProps): Projectile {
    return new Projectile(props);
  }

  with(updates: Partial<ProjectileSourceProps>): Projectile {
    return Projectile.create({
      casterUnitId: updates.casterUnitId ?? this.casterUnitId,
      damage: updates.damage ?? this.damage,
      id: updates.id ?? this.id,
      impactTime: updates.impactTime ?? this.impactTime,
      launchTime: updates.launchTime ?? this.launchTime,
      spell: updates.spell ?? this.spell,
      targetUnitId: updates.targetUnitId ?? this.targetUnitId,
    });
  }
}

export const createNotFoundProjectile = (
  id: Branded.ProjectileID,
): Projectile =>
  Projectile.create({
    casterUnitId: Branded.UnitID("unknown"),
    damage: 0,
    id,
    impactTime: 0,
    launchTime: 0,
    spell: createNotFoundSpell(Branded.SpellID(-1)),
    targetUnitId: Branded.UnitID("unknown"),
  });
