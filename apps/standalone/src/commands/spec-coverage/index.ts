import type { SupabaseClient } from "@supabase/supabase-js";

import { Command, Options } from "@effect/cli";
import * as Effect from "effect/Effect";

import { supabaseClient } from "../../data/supabase.js";

interface SpecCoverage {
  classId: number;
  className: string;
  pvpTalentSpellCount: number;
  racialSpellCount: number;
  specId: number;
  specName: string;
  specSpellCount: number;
  talentSpellCount: number;
  totalSpellCount: number;
}

const CHUNK_SIZE = 500;

const query = async <T>(
  supabase: SupabaseClient,
  table: string,
  fn: (
    builder: ReturnType<ReturnType<SupabaseClient["schema"]>["from"]>,
  ) => PromiseLike<{ data: T | null; error: { message: string } | null }>,
): Promise<T> => {
  const result = await fn(supabase.schema("raw_dbc").from(table));

  if (result.error) {
    throw new Error(`Query error on ${table}: ${result.error.message}`);
  }

  return result.data as T;
};

const getRacialSpellIdsForClass = (
  classId: number,
  racePlayableBits: Map<number, number>, // raceId -> PlayableRaceBit
  classRaces: Map<number, Set<number>>, // classId -> Set<raceId>
  racialSpellsByMask: Array<{ RaceMask: number; Spell: number }>,
): Set<number> => {
  // Get races available for this class
  const availableRaces = classRaces.get(classId);

  if (!availableRaces || availableRaces.size === 0) {
    // Class has no race restrictions in chr_class_race_sex - use all playable races
    // This applies to most classes (Warrior, Mage, etc.)
    return new Set(racialSpellsByMask.map((r) => r.Spell));
  }

  // Build a combined RaceMask for all available races
  let combinedMask = BigInt(0);
  for (const raceId of availableRaces) {
    const bit = racePlayableBits.get(raceId);

    if (bit !== undefined && bit >= 0) {
      combinedMask |= BigInt(1) << BigInt(bit);
    }
  }

  // Filter racial spells to those matching any of the available races
  const spellIds = new Set<number>();
  for (const r of racialSpellsByMask) {
    if ((BigInt(r.RaceMask) & combinedMask) > 0) {
      spellIds.add(r.Spell);
    }
  }

  return spellIds;
};

const getPvpTalentSpellIds = async (
  supabase: SupabaseClient,
  specId: number,
): Promise<Set<number>> => {
  // Get PvP/legacy talents from the talent table
  const talents = await query<Array<{ SpellID: number }>>(
    supabase,
    "talent",
    (b) => b.select("SpellID").eq("SpecID", specId).gt("SpellID", 0),
  );

  return new Set(talents.map((t) => t.SpellID));
};

const getTalentSpellIds = async (
  supabase: SupabaseClient,
  specId: number,
): Promise<Set<number>> => {
  // 1. Get trait tree loadouts for this spec
  const loadouts = await query<Array<{ TraitTreeID: number }>>(
    supabase,
    "trait_tree_loadout",
    (b) => b.select("TraitTreeID").eq("ChrSpecializationID", specId),
  );

  if (loadouts.length === 0) {
    return new Set();
  }

  // 2. Get trees and filter to main talent trees (TraitSystemID = 0)
  const treeIds = [...new Set(loadouts.map((l) => l.TraitTreeID))];
  const trees = await query<Array<{ ID: number; TraitSystemID: number }>>(
    supabase,
    "trait_tree",
    (b) => b.select("ID, TraitSystemID").in("ID", treeIds),
  );

  const validTreeIds = trees
    .filter((t) => t.TraitSystemID === 0)
    .map((t) => t.ID);

  if (validTreeIds.length === 0) {
    return new Set();
  }

  // 3. Get the SpecSets for this spec (used for filtering spec-specific talents)
  const specSetRows = await query<Array<{ SpecSet: number }>>(
    supabase,
    "spec_set_member",
    (b) => b.select("SpecSet").eq("ChrSpecializationID", specId),
  );
  const specSets = new Set(specSetRows.map((r) => r.SpecSet));

  // 4. For each tree, get spec-filtered nodes
  const allNodeIds: number[] = [];

  for (const treeId of validTreeIds) {
    // 4a. Get all nodes in this tree
    const allTreeNodes = await query<Array<{ ID: number }>>(
      supabase,
      "trait_node",
      (b) => b.select("ID").eq("TraitTreeID", treeId),
    );
    const nodeIds = allTreeNodes.map((n) => n.ID);

    // 4b. Get spec visibility conditions for this tree (CondType=1, SpecSetID > 0)
    const specConditions = await query<
      Array<{ ID: number; SpecSetID: number }>
    >(supabase, "trait_cond", (b) =>
      b
        .select("ID, SpecSetID")
        .eq("TraitTreeID", treeId)
        .eq("CondType", 1)
        .gt("SpecSetID", 0),
    );

    if (specConditions.length === 0) {
      // No spec conditions in this tree - all nodes available to all specs
      allNodeIds.push(...nodeIds);

      continue;
    }

    // 4c. Build map: groupId -> Set<SpecSetID> (which specs can access this group)
    const condIds = specConditions.map((c) => c.ID);
    const condToSpecSet = new Map(
      specConditions.map((c) => [c.ID, c.SpecSetID]),
    );
    const groupSpecSets = new Map<number, Set<number>>();

    for (let i = 0; i < condIds.length; i += CHUNK_SIZE) {
      const chunk = condIds.slice(i, i + CHUNK_SIZE);
      const groupConds = await query<
        Array<{ TraitNodeGroupID: number; TraitCondID: number }>
      >(supabase, "trait_node_group_x_trait_cond", (b) =>
        b.select("TraitNodeGroupID, TraitCondID").in("TraitCondID", chunk),
      );

      for (const gc of groupConds) {
        const specSetId = condToSpecSet.get(gc.TraitCondID);

        if (specSetId !== undefined) {
          if (!groupSpecSets.has(gc.TraitNodeGroupID)) {
            groupSpecSets.set(gc.TraitNodeGroupID, new Set());
          }

          groupSpecSets.get(gc.TraitNodeGroupID)!.add(specSetId);
        }
      }
    }

    // 4d. Get node -> groups mappings
    const nodeGroups = new Map<number, number[]>();

    for (let i = 0; i < nodeIds.length; i += CHUNK_SIZE) {
      const chunk = nodeIds.slice(i, i + CHUNK_SIZE);
      const rows = await query<
        Array<{ TraitNodeID: number; TraitNodeGroupID: number }>
      >(supabase, "trait_node_group_x_trait_node", (b) =>
        b.select("TraitNodeID, TraitNodeGroupID").in("TraitNodeID", chunk),
      );

      for (const r of rows) {
        if (!nodeGroups.has(r.TraitNodeID)) {
          nodeGroups.set(r.TraitNodeID, []);
        }

        nodeGroups.get(r.TraitNodeID)!.push(r.TraitNodeGroupID);
      }
    }

    // 4e. Filter nodes: exclude if in a spec-restricted group for OTHER specs
    for (const nodeId of nodeIds) {
      const groups = nodeGroups.get(nodeId) || [];

      // Check if node is in any spec-restricted group
      let isExcluded = false;

      for (const groupId of groups) {
        const groupRestrictions = groupSpecSets.get(groupId);

        if (groupRestrictions && groupRestrictions.size > 0) {
          // This group has spec restrictions - check if we're allowed
          let specAllowed = false;

          for (const ss of specSets) {
            if (groupRestrictions.has(ss)) {
              specAllowed = true;
              break;
            }
          }

          if (!specAllowed) {
            // Node is in a spec-restricted group that doesn't include us
            isExcluded = true;
            break;
          }
        }
      }

      if (!isExcluded) {
        allNodeIds.push(nodeId);
      }
    }
  }

  if (allNodeIds.length === 0) {
    return new Set();
  }

  // 5. Get node -> entry mappings (chunked)
  const uniqueNodeIds = [...new Set(allNodeIds)];
  const allEntryIds: number[] = [];

  for (let i = 0; i < uniqueNodeIds.length; i += CHUNK_SIZE) {
    const chunk = uniqueNodeIds.slice(i, i + CHUNK_SIZE);
    const rows = await query<Array<{ TraitNodeEntryID: number }>>(
      supabase,
      "trait_node_x_trait_node_entry",
      (b) => b.select("TraitNodeEntryID").in("TraitNodeID", chunk),
    );

    allEntryIds.push(...rows.map((r) => r.TraitNodeEntryID));
  }

  if (allEntryIds.length === 0) {
    return new Set();
  }

  // 6. Get entry -> definition mappings (chunked)
  const uniqueEntryIds = [...new Set(allEntryIds)];
  const allDefinitionIds: number[] = [];

  for (let i = 0; i < uniqueEntryIds.length; i += CHUNK_SIZE) {
    const chunk = uniqueEntryIds.slice(i, i + CHUNK_SIZE);
    const rows = await query<Array<{ TraitDefinitionID: number }>>(
      supabase,
      "trait_node_entry",
      (b) => b.select("TraitDefinitionID").in("ID", chunk),
    );

    allDefinitionIds.push(...rows.map((r) => r.TraitDefinitionID));
  }

  if (allDefinitionIds.length === 0) {
    return new Set();
  }

  // 7. Get definition -> spell mappings (chunked)
  const uniqueDefIds = [...new Set(allDefinitionIds)];
  const spellIds = new Set<number>();

  for (let i = 0; i < uniqueDefIds.length; i += CHUNK_SIZE) {
    const chunk = uniqueDefIds.slice(i, i + CHUNK_SIZE);
    const rows = await query<Array<{ SpellID: number }>>(
      supabase,
      "trait_definition",
      (b) => b.select("SpellID").in("ID", chunk).gt("SpellID", 0),
    );

    rows.forEach((r) => spellIds.add(r.SpellID));
  }

  return spellIds;
};

const getSpecCoverage = async (
  supabase: SupabaseClient,
): Promise<SpecCoverage[]> => {
  console.log("Fetching classes, specs, and race data ...");

  // Get all playable classes (exclude Adventurer=14, Traveler=15)
  const classes = await query<Array<{ ID: number; Name_lang: string }>>(
    supabase,
    "chr_classes",
    (b) => b.select("ID, Name_lang").not("ID", "in", "(14,15)"),
  );

  // Get all specs (exclude "Initial" specs)
  const specs = await query<
    Array<{ ID: number; ClassID: number; Name_lang: string }>
  >(supabase, "chr_specialization", (b) =>
    b.select("ID, ClassID, Name_lang").neq("Name_lang", "Initial"),
  );

  // Get all playable races with their PlayableRaceBit
  const races = await query<Array<{ ID: number; PlayableRaceBit: number }>>(
    supabase,
    "chr_races",
    (b) => b.select("ID, PlayableRaceBit").gte("PlayableRaceBit", 0),
  );
  const racePlayableBits = new Map(races.map((r) => [r.ID, r.PlayableRaceBit]));

  // Get class-race restrictions (only has DH, DK, Evoker - others have no restrictions)
  const classRaceRows = await query<Array<{ ClassID: number; RaceID: number }>>(
    supabase,
    "chr_class_race_sex",
    (b) => b.select("ClassID, RaceID"),
  );

  const classRaces = new Map<number, Set<number>>();
  for (const cr of classRaceRows) {
    if (!classRaces.has(cr.ClassID)) {
      classRaces.set(cr.ClassID, new Set());
    }

    classRaces.get(cr.ClassID)!.add(cr.RaceID);
  }

  // Get all racial spells with their RaceMask
  const racialSpellsByMask = await query<
    Array<{ RaceMask: number; Spell: number }>
  >(supabase, "skill_line_ability", (b) =>
    b.select("RaceMask, Spell").gt("RaceMask", 0).eq("ClassMask", 0),
  );

  console.log(
    `Found ${classes.length} classes, ${specs.length} specs, ${races.length} races, ${racialSpellsByMask.length} racial spell entries\n`,
  );

  const classMap = new Map(classes.map((c) => [c.ID, c.Name_lang]));
  const results: SpecCoverage[] = [];

  // Cache racial spells per class to avoid recalculating
  const racialSpellsCache = new Map<number, Set<number>>();

  for (const spec of specs) {
    const className = classMap.get(spec.ClassID);
    if (!className) {
      continue;
    }

    process.stdout.write(`  ${className} / ${spec.Name_lang}...`);

    // Get racial spells for this class (cached)
    let racialSpellIds = racialSpellsCache.get(spec.ClassID);

    if (!racialSpellIds) {
      racialSpellIds = getRacialSpellIdsForClass(
        spec.ClassID,
        racePlayableBits,
        classRaces,
        racialSpellsByMask,
      );

      racialSpellsCache.set(spec.ClassID, racialSpellIds);
    }

    // Get specialization spells
    const specSpells = await query<Array<{ SpellID: number }>>(
      supabase,
      "specialization_spells",
      (b) => b.select("SpellID").eq("SpecID", spec.ID),
    );
    const specSpellIds = new Set(specSpells.map((s) => s.SpellID));

    // Get talent spells
    const talentSpellIds = await getTalentSpellIds(supabase, spec.ID);

    // Get PvP talent spells
    const pvpTalentSpellIds = await getPvpTalentSpellIds(supabase, spec.ID);

    // Combine unique spell IDs (spec + talent + pvp talent + racial)
    const allSpellIds = new Set([
      ...pvpTalentSpellIds,
      ...racialSpellIds,
      ...specSpellIds,
      ...talentSpellIds,
    ]);

    results.push({
      classId: spec.ClassID,
      className,
      pvpTalentSpellCount: pvpTalentSpellIds.size,
      racialSpellCount: racialSpellIds.size,
      specId: spec.ID,
      specName: spec.Name_lang,
      specSpellCount: specSpellIds.size,
      talentSpellCount: talentSpellIds.size,
      totalSpellCount: allSpellIds.size,
    });

    console.log(` ${allSpellIds.size} spells`);
  }

  return results;
};

const outputOption = Options.text("output").pipe(
  Options.withAlias("o"),
  Options.withDescription("Output file path (JSON)"),
  Options.optional,
);

export const specCoverageCommand = Command.make(
  "spec-coverage",
  { output: outputOption },
  ({ output }) =>
    Effect.gen(function* () {
      yield* Effect.log("Starting spec coverage analysis ...");

      const results = yield* Effect.tryPromise({
        catch: (e) => new Error(String(e)),
        try: () => getSpecCoverage(supabaseClient),
      });

      // Sort by class ID, then spec ID
      results.sort((a, b) =>
        a.classId !== b.classId ? a.classId - b.classId : a.specId - b.specId,
      );

      // Print summary table
      console.log("\n=== Summary ===\n");
      let currentClass = "";

      for (const r of results) {
        if (r.className !== currentClass) {
          currentClass = r.className;
          console.log(`\n${currentClass}:`);
        }

        console.log(
          `  ${r.specName.padEnd(15)} ${String(r.totalSpellCount).padStart(3)} spells (${r.specSpellCount} spec, ${r.talentSpellCount} talent, ${r.pvpTalentSpellCount} pvp, ${r.racialSpellCount} racial)`,
        );
      }

      // Write to file if requested
      if (output._tag === "Some") {
        yield* Effect.tryPromise({
          catch: (e) => new Error(String(e)),
          try: async () => {
            // TODO Use effect-fs here
            const fs = await import("node:fs/promises");

            await fs.writeFile(output.value, JSON.stringify(results, null, 2));
          },
        });

        console.log(`\nResults written to ${output.value}`);
      }

      yield* Effect.log("Done!");
    }),
);
