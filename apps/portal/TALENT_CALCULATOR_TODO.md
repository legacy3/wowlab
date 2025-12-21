# Talent Calculator - Remaining TODOs

## Database Setup

- [x] Add `trait_currency_source` table to Supabase `raw_dbc` schema (import from `TraitCurrencySource.csv`)

## Optional Improvements

- [x] Use actual per-node cost from `trait_cost.Amount` instead of assuming 1 point per rank
  - Verified: All trait_cost.Amount values in DB are 1, so current assumption is correct
- [x] Handle prerequisite point spending in limit checks (currently selecting a node with prereqs could overspend if prereqs push you over the limit)

## Done

- [x] Filter SubTreeSelection nodes (type 3) from rendering
- [x] Fix loadout mapping with `allNodeIds` for correct bit-to-node alignment
- [x] Detect active hero tree from loadout
- [x] Show selected choice in choice nodes
- [x] Add `TraitCurrencySource` schema
- [x] Calculate point limits from currency source data
- [x] Display class/spec/hero point counters in UI
- [x] Block selection when point limit reached
