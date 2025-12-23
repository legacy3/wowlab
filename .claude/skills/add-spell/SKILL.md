---
name: add-spell
description: Add spell support to wowlab-specs. Invoke with spell ID or name to look up spell data and generate handler code with proper registration.
---

# Add Spell to wowlab-specs

Add new spell handlers for WoW class/spec simulations.

## How to Use

Invoke with a spell ID or spell name:

- `/add-spell 34026` (by ID)
- `/add-spell Kill Command` (by name)

## Workflow

### Step 1: Look Up Spell Data

**If given spell ID:**

```
Use mcp__wowlab__get_spell(id) to get full spell details
```

**If given spell name:**

```
Use mcp__wowlab__search_spells(query) to find ID first
Then mcp__wowlab__get_spell(id) for full details
```

**Key data to extract:**

- `id` - Spell ID for constant
- `name` - Display name
- `description` - What the spell does
- `schoolMask` - Damage school (1=Physical, 2=Holy, 4=Fire, 8=Nature, 16=Frost, 32=Shadow, 64=Arcane)
- `powerType` - Resource type (0=Mana, 1=Rage, 2=Focus, 3=Energy, etc.)
- `effectTriggerSpell` - Additional spell IDs triggered
- `isPassive` - Whether it's a passive ability

**For damage spells, also call:**

```
mcp__wowlab__call_function(function: "extractCooldown", args: { spellId })
mcp__wowlab__call_function(function: "extractDuration", args: { spellId })
mcp__wowlab__call_function(function: "hasAoeDamageEffect", args: { spellId })
```

### Step 2: Identify Target Spec

Ask user which class/spec this spell belongs to:

- Check existing specs in `packages/wowlab-specs/src/internal/`
- If class doesn't exist, offer to create it (see "Adding New Class" below)

### Step 3: Add Spell Constant

Add to the appropriate constants file at `packages/wowlab-specs/src/internal/{class}/constants.ts`:

```ts
export const {Class}Spells = {
  // ... existing spells
  SPELL_NAME: 12345,  // Add new spell with SCREAMING_SNAKE_CASE
} as const;
```

**Constant naming conventions:**

- Use SCREAMING_SNAKE_CASE: `KILL_COMMAND`, `BESTIAL_WRATH`
- Buff spell IDs: suffix `_BUFF` (e.g., `BARBED_SHOT_BUFF: 246152`)
- Debuff spell IDs: suffix `_DEBUFF`
- Pet versions: prefix `PET_` (e.g., `PET_KILL_COMMAND: 83381`)
- Summon creature IDs: suffix `_SUMMON` (e.g., `DIRE_BEAST_SUMMON: 120694`)

### Step 4: Create Handler

Add handler to the spec file at `packages/wowlab-specs/src/internal/{class}/{spec}.ts`:

**Import required utilities:**

```ts
import { CombatLog } from "@wowlab/core/Schemas";
import type { SpecDefinition } from "../shared/types.js";
import { AURA_DEFAULTS, DAMAGE_DEFAULTS, fromTrigger } from "../shared/events.js";
import { handler } from "../shared/factories.js";
import { {Class}Spells } from "./constants.js";
```

**Handler patterns by spell type:**

#### Damage Spell (requires target)

```ts
const spellName = handler(
  "{spec}:{spell-kebab-name}",  // e.g., "bm:kill-command"
  {Class}Spells.SPELL_NAME,
  (event, emit) => {
    emit(
      new CombatLog.SpellDamage({
        ...fromTrigger(event),
        school: 1,  // schoolMask from spell data
        spellId: {Class}Spells.SPELL_NAME,
        spellName: "Spell Name",
        spellSchool: 1,
        ...DAMAGE_DEFAULTS,
      }),
    );
  },
  { requiresTarget: true },
);
```

#### Buff (self-applied)

```ts
const spellName = handler(
  "{spec}:{spell-kebab-name}",
  {Class}Spells.SPELL_NAME,
  (event, emit) => {
    emit(
      new CombatLog.SpellAuraApplied({
        ...fromTrigger(event, { toSelf: true }),
        auraType: "BUFF",
        spellId: {Class}Spells.SPELL_NAME_BUFF,  // Use buff ID if different
        spellName: "Spell Name",
        spellSchool: 1,
        ...AURA_DEFAULTS,
      }),
    );
  },
);
```

#### Debuff (applied to target)

```ts
const spellName = handler(
  "{spec}:{spell-kebab-name}",
  {Class}Spells.SPELL_NAME,
  (event, emit) => {
    emit(
      new CombatLog.SpellAuraApplied({
        ...fromTrigger(event),  // No toSelf - applies to target
        auraType: "DEBUFF",
        spellId: {Class}Spells.SPELL_NAME,
        spellName: "Spell Name",
        spellSchool: 1,
        ...AURA_DEFAULTS,
      }),
    );
  },
  { requiresTarget: true },
);
```

#### Summon Spell

```ts
let summonCounter = 0;
const nextSummonId = () => ++summonCounter;

const spellName = handler(
  "{spec}:{spell-kebab-name}",
  {Class}Spells.SPELL_NAME,
  (event, emit) => {
    emit(
      new CombatLog.SpellSummon({
        ...fromTrigger(event),
        destFlags: 0x2111,
        destGUID: `Creature-0-0-0-0-${Class}Spells.SUMMON_ID}-${event.timestamp}-${nextSummonId()}`,
        destName: "Summon Name",
        destRaidFlags: 0,
        spellId: {Class}Spells.SUMMON_ID,
        spellName: "Summon Name",
        spellSchool: 1,
      }),
    );
  },
);
```

#### Multi-Effect Spell (damage + buff)

```ts
const spellName = handler(
  "{spec}:{spell-kebab-name}",
  {Class}Spells.SPELL_NAME,
  (event, emit) => {
    // Damage component
    if (event.destGUID && event.destName) {
      emit(
        new CombatLog.SpellDamage({
          ...fromTrigger(event),
          school: 1,
          spellId: {Class}Spells.SPELL_NAME,
          spellName: "Spell Name",
          spellSchool: 1,
          ...DAMAGE_DEFAULTS,
        }),
      );
    }

    // Buff component
    emit(
      new CombatLog.SpellAuraApplied({
        ...fromTrigger(event, { toSelf: true }),
        auraType: "BUFF",
        spellId: {Class}Spells.BUFF_ID,
        spellName: "Buff Name",
        spellSchool: 1,
        ...AURA_DEFAULTS,
      }),
    );
  },
);
```

### Step 5: Register Handler

Add handler to the spec's `SpecDefinition.handlers` array:

```ts
export const SpecName: SpecDefinition = {
  class: "{class}",
  handlers: [
    // ... existing handlers
    spellName, // Add new handler
  ],
  id: "{class}:{spec}",
  name: "Spec Name",
};
```

### Step 6: Build & Verify

```bash
pnpm build
```

## Adding New Class

If the class doesn't exist:

1. Create directory: `packages/wowlab-specs/src/internal/{class}/`

2. Create `constants.ts`:

```ts
export const {Class}Spells = {
  // Class-wide spells
} as const;

export const {Spec}Spells = {
  // Spec-specific spells
} as const;
```

3. Create spec file `{spec}.ts` with handler implementations

4. Create `index.ts`:

```ts
import type { ClassDefinition } from "../shared/types.js";
import { SpecName } from "./{spec}.js";

export { SpecName } from "./{spec}.js";
export { {Class}Spells, {Spec}Spells } from "./constants.js";

export const {Class}: ClassDefinition = {
  id: "{class}",
  name: "{Class}",
  specs: [SpecName],
};
```

5. Create `packages/wowlab-specs/src/{Class}.ts`:

```ts
export * from "./internal/{class}/index.js";
```

6. Add export to `packages/wowlab-specs/src/index.ts`:

```ts
export * as {Class} from "./{Class}.js";
```

## School Mask Reference

| Value | School   |
| ----- | -------- |
| 1     | Physical |
| 2     | Holy     |
| 4     | Fire     |
| 8     | Nature   |
| 16    | Frost    |
| 32    | Shadow   |
| 64    | Arcane   |

Combined schools are bitwise OR (e.g., 36 = Fire + Shadow = Shadowflame)

## Power Type Reference

| Value | Resource     |
| ----- | ------------ |
| 0     | Mana         |
| 1     | Rage         |
| 2     | Focus        |
| 3     | Energy       |
| 4     | Combo Points |
| 6     | Runes        |
| 7     | Runic Power  |
| 8     | Soul Shards  |
| 9     | Lunar Power  |
| 11    | Maelstrom    |
| 12    | Chi          |
| 13    | Insanity     |
| 17    | Fury         |
| 18    | Pain         |
| 19    | Essence      |

## CombatLog Event Types

- `SpellDamage` - Direct damage
- `SpellAuraApplied` - Buff/debuff applied
- `SpellAuraRemoved` - Buff/debuff removed
- `SpellSummon` - Pet/totem summoned
- `SpellEnergize` - Resource generated
- `SpellHeal` - Healing done

## Instructions

1. Look up spell data using wowlab MCP
2. Identify spell type (damage, buff, debuff, summon, hybrid)
3. Add spell ID constant(s)
4. Create handler using appropriate pattern
5. Register handler in spec definition
6. Run `pnpm build` to verify
