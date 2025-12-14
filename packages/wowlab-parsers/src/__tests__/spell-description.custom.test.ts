import { describe, expect, it } from "vitest";

import {
  DEFAULT_RENDER_MOCKS,
  renderDescriptionWithMocks,
} from "./render-test-utils";

type Case = { id: number; input: string; expected: string };

const { effectValue, spellLevelSeconds } = DEFAULT_RENDER_MOCKS;

/*
{ id: 11,  input: "Deals $s1 Frost damage to the target.", expected: "Deals 1 Frost damage to the target." }
{ id: 17,  input: "Shields an ally for $d, absorbing $s1 damage.", expected: "Shields an ally for 15, absorbing 1 damage." }
{ id: 53,  input: "Stab the target, causing ${$s2*$<mult>} Physical damage. Damage increased by $s4% ...", expected: "Stab the target, causing ${1*<mult>} Physical damage. Damage increased by 1% ..." }
{ id: 65,  input: "Increases your melee haste by $s1 for $d.", expected: "Increases your melee haste by 1 for 15." }
{ id: 66,  input: "Turns you invisible over $66d... Lasts $32612d.", expected: "Turns you invisible over 1... Lasts 1." }
{ id: 99,  input: "Incapacitating all enemies within $A1 yards for $d.", expected: "Incapacitating all enemies within 1 yards for 15." }
{ id: 100, input: "Charge... $126664s2 ... $105771d ... $7922d", expected: "Charge... 1 ... 1 ... 1" }
{ id: 113, input: "Locks the target in place for $d.", expected: "Locks the target in place for 15." }
{ id: 116, input: "Causing $228597s1 Frost damage ... $205708s1% for $205708d.", expected: "Causing 1 Frost damage ... 1% for 1." }
{ id: 118, input: "Transforms the enemy ... for $d.", expected: "Transforms the enemy ... for 15." }
{ id: 120, input: "Take $s1 Frost damage ... $386770d ... $212792d", expected: "Take 1 Frost damage ... 1 ... 1" }
{ id: 133, input: "$s1 Fire damage.$?a157642[... $157644s1% ...][]", expected: "1 Fire damage.$?a157642[... 1% ...][]" }
{ id: 136, input: "Heals your pet for $<total>% ... over $d.$?s343242[... $343242s2% ...][]", expected: "Heals your pet for <total>% ... over 15.$?s343242[... 1% ...][]" }
{ id: 139, input: "Healing for $o1 over $d.", expected: "Healing for 1 over 15." }
{ id: 172, input: "Causing $s3 Shadow damage and $?a196103[$146739s1 ... $146739t1 sec.][an additional $146739o1 ... $146739d.]", expected: "Causing 1 Shadow damage and $?a196103[1 ... 1 sec.][an additional 1 ... 1.]" }
{ id: 348, input: "$s1 Fire damage ... $157736o1 ... $157736d.", expected: "1 Fire damage ... 1 ... 1." }
{ id: 355, input: "Increases threat by $s2% for $d.", expected: "Increases threat by 1% for 15." }
{ id: 370, input: "Purges ... removing $m1 ...$?(s147762&s51530)[...][ ]", expected: "Purges ... removing 1 ...$?s147762s51530[...][ ]" }
{ id: 379, input: "$@spelldesc974", expected: "<@spelldesc974>" }
{ id: 184, input: "Inflicts Fire damage every $t1 sec. Lasts $d.", expected: "Inflicts Fire damage every 1 sec. Lasts 15." }
*/

// prettier-ignore
const TEST_CASES: Case[] = [
  { id: 99999, input: "Deals $s1 damage for $d sec.", expected: `Deals ${effectValue} damage for ${spellLevelSeconds} sec.` },
];

describe("spell description custom expectations", () => {
  it.each(TEST_CASES.map((c) => [c.id, c.input, c.expected]))(
    "renders spell %s as expected",
    (id, input, expected) => {
      const { errors, lexErrors, text } = renderDescriptionWithMocks(id, input);

      expect(lexErrors).toHaveLength(0);
      expect(errors).toHaveLength(0);
      expect(text).toBe(expected);

      console.log(`Testing "${input}"; Expecting "${expected}"; Got "${text}"`);
    },
  );
});
