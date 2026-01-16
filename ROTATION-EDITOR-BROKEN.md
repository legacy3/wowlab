# ROTATION EDITOR IS BROKEN

Two completely incompatible formats. No converter exists.

---

## The Engine Format

Location: `crates/engine/rotations/bm_hunter.json`

```json
{
  "name": "BM Hunter ST",
  "variables": {
    "in_opener": { "<": ["combat.time", 10] },
    "pool_for_bw": { "and": [
      { "<": ["cd.bestial_wrath.remaining", 3] },
      { "<": ["resource.focus", 70] }
    ]},
    "need_frenzy_refresh": { "and": [
      "buff.frenzy.active",
      { "<": ["buff.frenzy.remaining", 2] }
    ]}
  },
  "lists": {
    "cooldowns": [
      { "cast": "bestial_wrath", "if": "cd.bestial_wrath.ready" },
      { "cast": "call_of_the_wild", "if": { "and": [
        "cd.call_of_the_wild.ready",
        "buff.bestial_wrath.active"
      ]}}
    ],
    "st": [
      { "cast": "barbed_shot", "if": { "or": [
        { "not": "buff.frenzy.active" },
        "need_frenzy_refresh",
        { ">=": ["cd.barbed_shot.charges", 2] }
      ]}},
      { "cast": "kill_command", "if": "cd.kill_command.ready" },
      { "cast": "cobra_shot", "if": { ">=": ["resource.focus", 50] }}
    ]
  },
  "actions": [
    { "call": "cooldowns" },
    { "call": "st" }
  ]
}
```

### Engine Format Rules

**Actions:**
```json
{ "cast": "spell_name", "if": <condition> }
{ "call": "list_name" }
{ "run": "list_name" }
```

**Conditions (JSONLogic-style):**
```json
// String = variable path (evaluates to bool/number)
"cd.kill_command.ready"
"buff.frenzy.active"
"resource.focus"

// Comparison
{ "<": ["resource.focus", 70] }
{ ">=": ["cd.barbed_shot.charges", 2] }
{ "<=": ["buff.frenzy.remaining", 2] }

// Logic
{ "and": [cond1, cond2, ...] }
{ "or": [cond1, cond2, ...] }
{ "not": cond }
```

**Variable paths (strings):**
```
cd.<spell>.ready           -> bool
cd.<spell>.remaining       -> float
cd.<spell>.charges         -> int
buff.<aura>.active         -> bool
buff.<aura>.remaining      -> float
buff.<aura>.stacks         -> int
debuff.<aura>.active       -> bool
resource.<type>            -> float
resource.<type>.deficit    -> float
combat.time                -> float
combat.remaining           -> float
target.health_percent      -> float
pet.active                 -> bool
talent.<name>              -> bool
```

Defined in: `crates/engine/src/rotation/ast.rs` lines 166-247 (VarPath enum)

---

## The Portal Format

Location: `apps/portal/src/lib/state/editor.ts` (serialize function line 249-256)

What gets stored in database (`rotations.script` column):

```json
{
  "defaultListId": "uuid-1",
  "lists": [
    {
      "id": "uuid-1",
      "name": "default",
      "label": "Default",
      "listType": "main",
      "actions": [
        {
          "id": "uuid-action-1",
          "type": "spell",
          "spellId": 34026,
          "enabled": true,
          "condition": {
            "combinator": "and",
            "rules": [
              {
                "field": "cooldown.ready",
                "operator": "=",
                "value": "true"
              }
            ]
          }
        }
      ]
    }
  ],
  "variables": []
}
```

### Portal Format Rules

**Actions:**
```json
{
  "id": "uuid",
  "type": "spell" | "item" | "call_action_list",
  "spellId": 34026,           // for type=spell
  "itemId": 12345,            // for type=item
  "listId": "uuid",           // for type=call_action_list
  "enabled": true,
  "condition": <RuleGroupType>
}
```

**Conditions (react-querybuilder RuleGroupType):**
```json
{
  "combinator": "and" | "or",
  "not": false,
  "rules": [
    {
      "field": "cooldown.ready",
      "operator": "=" | "!=" | "<" | "<=" | ">" | ">=",
      "value": "true"
    },
    {
      "combinator": "or",
      "rules": [...]
    }
  ]
}
```

**Field names (from CONDITION_FIELDS):**
```
cooldown.ready
cooldown.remains
buff.up
buff.down
buff.stacks
buff.remains
debuff.up
debuff.stacks
resource.pct
focus
focus.deficit
target.health.pct
gcd.remains
```

Defined in: `apps/portal/src/lib/engine/index.ts` lines 521-1336

---

## The Problems

### Problem 1: Different Condition Formats

**Engine:**
```json
{ "and": ["cd.kill_command.ready", { ">=": ["resource.focus", 30] }] }
```

**Portal:**
```json
{
  "combinator": "and",
  "rules": [
    { "field": "cooldown.ready", "operator": "=", "value": "true" },
    { "field": "focus", "operator": ">=", "value": "30" }
  ]
}
```

### Problem 2: Different Field Names

| Engine Path | Portal Field |
|-------------|--------------|
| `cd.kill_command.ready` | `cooldown.ready` |
| `cd.kill_command.remaining` | `cooldown.remains` |
| `buff.bestial_wrath.active` | `buff.up` |
| `buff.frenzy.stacks` | `buff.stacks` |
| `resource.focus` | `focus` |
| `target.health_percent` | `target.health.pct` |

### Problem 3: Different Action Formats

**Engine:**
```json
{ "cast": "kill_command", "if": "cd.kill_command.ready" }
```

**Portal:**
```json
{
  "type": "spell",
  "spellId": 34026,
  "condition": { "combinator": "and", "rules": [...] }
}
```

### Problem 4: No Converter

The portal has `generateDSL()` and `generateJSON()` in `preview.tsx` but:
- `generateJSON()` just outputs the portal format, not engine format
- `generateDSL()` outputs a SimC-like text format, not engine JSON
- **There is NO function to convert portal format → engine format**

---

## What Needs To Happen

### Option A: Convert Portal Format to Engine Format

Write a converter function:

```typescript
function portalToEngine(portalData: RotationData): EngineRotation {
  return {
    name: portalData.name,
    variables: convertVariables(portalData.variables),
    lists: convertLists(portalData.lists),
    actions: getDefaultListActions(portalData),
  };
}

function convertCondition(ruleGroup: RuleGroupType): EngineCondition {
  if (ruleGroup.rules.length === 0) return true;

  const conditions = ruleGroup.rules.map(rule => {
    if ('field' in rule) {
      // Convert field name: "cooldown.ready" → "cd.<spell>.ready"
      // Convert to comparison or bool depending on field type
      return convertRule(rule);
    }
    return convertCondition(rule);
  });

  if (conditions.length === 1) return conditions[0];
  return { [ruleGroup.combinator]: conditions };
}

function convertRule(rule: RuleType): EngineCondition {
  const enginePath = mapFieldToEnginePath(rule.field, context);

  if (rule.operator === '=' && rule.value === 'true') {
    return enginePath; // bool path
  }

  return { [rule.operator]: [enginePath, parseValue(rule.value)] };
}
```

### Option B: Change Editor to Use Engine Format Directly

Replace react-querybuilder with a custom editor that produces JSONLogic directly.

### Option C: Change Engine to Accept Portal Format

Modify the Rust parser to accept react-querybuilder format. (Bad idea - couples engine to UI library)

---

## Files Involved

### Engine (defines the real format)
- `crates/engine/src/rotation/ast.rs` - Rotation, Action, Expr, VarPath structs
- `crates/engine/src/rotation/parser.rs` - JSON parser
- `crates/engine/rotations/bm_hunter.json` - Example rotation

### Portal (stores the fake format)
- `apps/portal/src/lib/engine/index.ts:521-1336` - CONDITION_FIELDS (fake field names)
- `apps/portal/src/lib/state/editor.ts` - Zustand store, serialize()
- `apps/portal/src/components/editor/conditions/condition-builder.tsx` - Uses react-querybuilder
- `apps/portal/src/components/editor/preview.tsx` - generateJSON() outputs portal format

### Database
- `rotations.script` column - Stores portal format JSON string

---

## The Core Issue

**The portal was built without looking at the engine.**

Someone built a rotation editor UI using react-querybuilder and made up field names that look like SimC syntax. But the Rust engine uses a completely different format (JSONLogic with specific VarPath strings).

The two systems were never connected.
