# wowlab-parsers

Parsers for WoW data formats: spell descriptions, talent loadout strings, SimC profiles.

## Modules

- **SpellDescription**: Lexer/parser for WoW spell description text with variables like `$s1`, `$@spelldesc`
- **Simc**: Talent loadout string encoding/decoding (base64 format used by SimC)

## Spell Description Parser

Uses Chevrotain for lexing/parsing. AST node types are exported for consumers:

```ts
import {
  parse,
  tokenize,
  visitSpellDescription,
  type ParsedSpellDescription,
  type VariableNode,
} from "@wowlab/parsers/SpellDescription";
```

Key node types:

- `EffectVariableNode` - `$s1`, `$d`, `$t1`
- `ConditionalNode` - `$?condition[true branch][false branch]`
- `CrossSpellReferenceNode` - `$@spelldesc123456`
- `ColorCodeNode` - `|cff123456text|r`

## Talent String Encoding

```ts
import {
  decodeTalentLoadout,
  encodeTalentLoadout,
  type DecodedTalentLoadout,
} from "@wowlab/parsers";
```

## Testing

Tests in `__tests__/` and `internal/*/*.test.ts`. Test against known spell descriptions from game data.
