import { describe, expect, it } from "vitest";

import {
  DEFAULT_RENDER_MOCKS,
  renderDescriptionWithMocks,
} from "./render-test-utils";

type Case = { id: number; input: string; expected: string };

const { effectValue, spellLevelSeconds } = DEFAULT_RENDER_MOCKS;

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

      console.log(`Testing ${expected} got ${text}`);
    },
  );
});
