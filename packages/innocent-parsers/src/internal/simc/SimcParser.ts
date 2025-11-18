import * as Character from "@packages/innocent-schemas/Character";
import * as Data from "effect/Data";
import * as Effect from "effect/Effect";

export class ParseError extends Data.TaggedError("ParseError")<{
  readonly line?: string;
  readonly message: string;
}> {}

const parseGearSlot = (
  line: string,
): Effect.Effect<Character.GearItem, ParseError> =>
  Effect.gen(function* () {
    const idMatch = line.match(/id=(\d+)/);
    if (!idMatch) {
      return yield* Effect.fail(
        new ParseError({
          line,
          message: "Missing item ID in gear slot",
        }),
      );
    }

    const id = parseInt(idMatch[1]);

    // Parse bonus_id
    const bonusMatch = line.match(/bonus_id=([\d/]+)/);
    const bonusIds = bonusMatch
      ? bonusMatch[1].split("/").map((x) => parseInt(x))
      : [];

    // Parse gem_id (optional)
    const gemMatch = line.match(/gem_id=([\d/]+)/);
    const gemIds = gemMatch
      ? gemMatch[1].split("/").map((x) => parseInt(x))
      : undefined;

    // Parse enchant_id (optional)
    const enchantMatch = line.match(/enchant_id=(\d+)/);
    const enchantId = enchantMatch ? parseInt(enchantMatch[1]) : undefined;

    // Parse crafted_stats (optional)
    const craftedStatsMatch = line.match(/crafted_stats=([\d/]+)/);
    const craftedStats = craftedStatsMatch
      ? craftedStatsMatch[1].split("/").map((x) => parseInt(x))
      : undefined;

    // Parse crafting_quality (optional)
    const craftingQualityMatch = line.match(/crafting_quality=(\d+)/);
    const craftingQuality = craftingQualityMatch
      ? parseInt(craftingQualityMatch[1])
      : undefined;

    return {
      bonusIds,
      craftedStats,
      craftingQuality,
      enchantId,
      gemIds,
      id,
    };
  });

const parseProfessions = (
  value: string,
): Effect.Effect<Array<{ name: string; rank: number }>, ParseError> =>
  Effect.gen(function* () {
    // Format: "alchemy=9/jewelcrafting=1"
    const parts = value.split("/");
    const professions: Array<{ name: string; rank: number }> = [];

    for (const part of parts) {
      const match = part.match(/^(\w+)=(\d+)$/);
      if (!match) {
        return yield* Effect.fail(
          new ParseError({
            message: `Invalid profession format: ${part}`,
          }),
        );
      }
      professions.push({
        name: match[1],
        rank: parseInt(match[2]),
      });
    }

    return professions;
  });

type MutableGear = {
  back?: Character.GearItem;
  chest?: Character.GearItem;
  feet?: Character.GearItem;
  finger1?: Character.GearItem;
  finger2?: Character.GearItem;
  hands?: Character.GearItem;
  head?: Character.GearItem;
  legs?: Character.GearItem;
  main_hand?: Character.GearItem;
  neck?: Character.GearItem;
  off_hand?: Character.GearItem;
  shoulder?: Character.GearItem;
  tabard?: Character.GearItem;
  trinket1?: Character.GearItem;
  trinket2?: Character.GearItem;
  waist?: Character.GearItem;
  wrist?: Character.GearItem;
};

type MutableProfile = {
  class?: string;
  gear: MutableGear;
  level?: number;
  name?: string;
  professions?: Array<{ name: string; rank: number }>;
  race?: string;
  region?: string;
  role?: string;
  server?: string;
  spec?: string;
  talents?: string;
};

export const parseSimcProfile = (
  input: string,
): Effect.Effect<Character.CharacterProfile, ParseError> =>
  Effect.gen(function* () {
    const lines = input.split("\n").filter((line) => {
      const trimmed = line.trim();
      return trimmed.length > 0 && !trimmed.startsWith("#");
    });

    const data: MutableProfile = {
      gear: {},
    };

    for (const line of lines) {
      // Parse key=value or key="value"
      const quotedMatch = line.match(/^(\w+)="([^"]+)"$/);
      const simpleMatch = line.match(/^(\w+)=(.+)$/);

      if (quotedMatch) {
        const [, key, value] = quotedMatch;
        if (key === "name") {
          data.name = value;
        } else if (
          [
            "death_knight",
            "demon_hunter",
            "druid",
            "evoker",
            "hunter",
            "mage",
            "monk",
            "paladin",
            "priest",
            "rogue",
            "shaman",
            "warlock",
            "warrior",
          ].includes(key)
        ) {
          // Class-specific format (e.g., shaman="name")
          data.name = value;
          data.class = key;
        }
      } else if (simpleMatch) {
        const [, key, value] = simpleMatch;

        // Metadata
        if (key === "level") {
          data.level = parseInt(value);
        } else if (key === "race") {
          data.race = value;
        } else if (key === "spec") {
          data.spec = value;
        } else if (key === "region") {
          data.region = value;
        } else if (key === "server") {
          data.server = value;
        } else if (key === "role") {
          data.role = value;
        } else if (key === "talents") {
          data.talents = value;
        } else if (key === "professions") {
          data.professions = yield* parseProfessions(value);
        } else if (
          [
            "back",
            "chest",
            "feet",
            "finger1",
            "finger2",
            "hands",
            "head",
            "legs",
            "main_hand",
            "neck",
            "off_hand",
            "shoulder",
            "tabard",
            "trinket1",
            "trinket2",
            "waist",
            "wrist",
          ].includes(key)
        ) {
          // Gear slot
          const gearItem = yield* parseGearSlot(value);
          data.gear[key as keyof Character.CharacterProfile["gear"]] = gearItem;
        } else if (
          [
            "death_knight",
            "demon_hunter",
            "druid",
            "evoker",
            "hunter",
            "mage",
            "monk",
            "paladin",
            "priest",
            "rogue",
            "shaman",
            "warlock",
            "warrior",
          ].includes(key)
        ) {
          // Class format without quotes
          data.name = value;
          data.class = key;
        }
      }
    }

    // Validate required fields
    if (!data.name) {
      return yield* Effect.fail(
        new ParseError({ message: "Missing required field: name" }),
      );
    }
    if (!data.class) {
      return yield* Effect.fail(
        new ParseError({ message: "Missing required field: class" }),
      );
    }
    if (!data.level) {
      return yield* Effect.fail(
        new ParseError({ message: "Missing required field: level" }),
      );
    }
    if (!data.race) {
      return yield* Effect.fail(
        new ParseError({ message: "Missing required field: race" }),
      );
    }
    if (!data.spec) {
      return yield* Effect.fail(
        new ParseError({ message: "Missing required field: spec" }),
      );
    }
    if (!data.region) {
      return yield* Effect.fail(
        new ParseError({ message: "Missing required field: region" }),
      );
    }
    if (!data.role) {
      return yield* Effect.fail(
        new ParseError({ message: "Missing required field: role" }),
      );
    }
    if (!data.server) {
      return yield* Effect.fail(
        new ParseError({ message: "Missing required field: server" }),
      );
    }
    if (!data.talents) {
      return yield* Effect.fail(
        new ParseError({ message: "Missing required field: talents" }),
      );
    }

    return {
      class: data.class,
      gear: data.gear as Character.CharacterProfile["gear"],
      level: data.level,
      name: data.name,
      professions: data.professions,
      race: data.race,
      region: data.region,
      role: data.role,
      server: data.server,
      spec: data.spec,
      talents: data.talents,
    };
  });
