import { Command, Options } from "@effect/cli";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as Effect from "effect/Effect";

import { supabaseClient } from "../../data/supabase.js";

// ============================================================================
// Types
// ============================================================================

interface SpecCoverage {
  classId: number;
  className: string;
  specId: number;
  specName: string;
  specSpellCount: number;
  talentSpellCount: number;
  totalSpellCount: number;
}

// ============================================================================
// Database Helpers
// ============================================================================

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

// ============================================================================
// Core Logic
// ============================================================================

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

  if (loadouts.length === 0) return new Set();

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

  if (validTreeIds.length === 0) return new Set();

  // 3. Get all nodes for valid trees
  const nodes = await query<Array<{ ID: number }>>(supabase, "trait_node", (b) =>
    b.select("ID").in("TraitTreeID", validTreeIds),
  );

  if (nodes.length === 0) return new Set();

  // 4. Get node -> entry mappings (chunked)
  const nodeIds = nodes.map((n) => n.ID);
  const allEntryIds: number[] = [];
  for (let i = 0; i < nodeIds.length; i += CHUNK_SIZE) {
    const chunk = nodeIds.slice(i, i + CHUNK_SIZE);
    const rows = await query<Array<{ TraitNodeEntryID: number }>>(
      supabase,
      "trait_node_x_trait_node_entry",
      (b) => b.select("TraitNodeEntryID").in("TraitNodeID", chunk),
    );
    allEntryIds.push(...rows.map((r) => r.TraitNodeEntryID));
  }

  if (allEntryIds.length === 0) return new Set();

  // 5. Get entry -> definition mappings (chunked)
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

  if (allDefinitionIds.length === 0) return new Set();

  // 6. Get definition -> spell mappings (chunked)
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
  console.log("Fetching classes and specs...");

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

  console.log(`Found ${classes.length} classes, ${specs.length} specs\n`);

  const classMap = new Map(classes.map((c) => [c.ID, c.Name_lang]));
  const results: SpecCoverage[] = [];

  for (const spec of specs) {
    const className = classMap.get(spec.ClassID);
    if (!className) continue;

    process.stdout.write(`  ${className} / ${spec.Name_lang}...`);

    // Get specialization spells
    const specSpells = await query<Array<{ SpellID: number }>>(
      supabase,
      "specialization_spells",
      (b) => b.select("SpellID").eq("SpecID", spec.ID),
    );
    const specSpellIds = new Set(specSpells.map((s) => s.SpellID));

    // Get talent spells
    const talentSpellIds = await getTalentSpellIds(supabase, spec.ID);

    // Combine unique spell IDs
    const allSpellIds = new Set([...specSpellIds, ...talentSpellIds]);

    results.push({
      classId: spec.ClassID,
      className,
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

// ============================================================================
// CLI Command
// ============================================================================

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
      yield* Effect.log("Starting spec coverage analysis...");

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
          `  ${r.specName.padEnd(15)} ${String(r.totalSpellCount).padStart(3)} spells (${r.specSpellCount} spec, ${r.talentSpellCount} talent)`,
        );
      }

      // Write to file if requested
      if (output._tag === "Some") {
        yield* Effect.tryPromise({
          catch: (e) => new Error(String(e)),
          try: async () => {
            const fs = await import("node:fs/promises");
            await fs.writeFile(output.value, JSON.stringify(results, null, 2));
          },
        });
        console.log(`\nResults written to ${output.value}`);
      }

      yield* Effect.log("Done!");
    }),
);
