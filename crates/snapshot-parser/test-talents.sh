#!/bin/bash
# Test script for debugging talent tree parsing issues
# Usage: ./test-talents.sh [spec_id]

set -e

SPEC_ID=${1:-71}  # Default to Arms Warrior (71)

echo "============================================================"
echo "TALENT TREE DEBUG - Spec ID: $SPEC_ID"
echo "============================================================"

# Run the Rust test with detailed output
cargo test -p snapshot-parser test_debug_talent_tree -- --nocapture --ignored 2>&1 || true

echo ""
echo "============================================================"
echo "COMPARING SPECS WITH/WITHOUT HERO TALENTS"
echo "============================================================"

# Specs to compare:
# 71 = Arms Warrior (0 subtrees reported)
# 72 = Fury Warrior
# 62 = Arcane Mage (3 subtrees reported)
# 63 = Fire Mage
# 64 = Frost Mage
# 577 = Havoc DH
# 581 = Vengeance DH

for spec in 71 72 62 63 64 577 581; do
    echo "--- Spec $spec ---"
    # Count nodes with TraitSubTreeID > 0 for this spec's tree
done

echo ""
echo "============================================================"
echo "RAW DBC DATA INSPECTION"
echo "============================================================"

DATA_DIR=~/Source/wowlab-data/data/tables

echo "TraitSubTree entries (hero talent definitions):"
head -20 "$DATA_DIR/TraitSubTree.csv"

echo ""
echo "Sample TraitNode entries with TraitSubTreeID > 0:"
awk -F',' 'NR==1 || $7 > 0' "$DATA_DIR/TraitNode.csv" | head -20

echo ""
echo "TraitTreeLoadout for spec $SPEC_ID:"
grep ",$SPEC_ID$" "$DATA_DIR/TraitTreeLoadout.csv" | head -5

echo ""
echo "============================================================"
echo "SIMC REFERENCE IMPLEMENTATION"
echo "============================================================"
echo "Key files to analyze in ~/Source/simc:"
echo "  - engine/dbc/generated/sc_talent_tree.inc"
echo "  - engine/dbc/trait_data.cpp"
echo "  - engine/player/player_talent_points.cpp"
echo "  - engine/dbc/dbc.hpp (trait structures)"
echo ""
echo "Run this to see SimC's talent parsing:"
echo "  grep -r 'sub_tree\|SubTree\|hero.*talent' ~/Source/simc/engine --include='*.cpp' --include='*.hpp' | head -50"
