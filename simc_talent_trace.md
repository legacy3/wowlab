# WoW Talent “Import / Loadout Code” Parsing (Detailed, Bit-Level)

This document explains **exactly** how the WoW talent import/export string (“loadout code”) is encoded and how to parse it correctly, including **bit order**, **field widths**, **per-node records**, and **hero tree selection**. It is based on:

- Blizzard UI implementation: `ExportUtil.lua` and `Blizzard_ClassTalentImportExport.lua`
- SimulationCraft implementation: `engine/player/player.cpp` (functions `parse_traits_hash()` / `generate_traits_hash()`), with metadata from `engine/dbc/generated/trait_data.inc`.

If you are “base64-decoding to bytes”, you are already on the wrong path: **this is a bitstream packed into 6-bit characters**.

---

## 0) Two different strings were posted

These two strings are **not the same text**, even if they came from what looked like “the same place”:

**Short string**
```
DAQUVREVFUFUmARERAUCEQOVUUUUVRURYSQFEBEEFVVUBV
```

**Wowhead-style (long) string**
```
C0PAAAAAAAAAAAAAAAAAAAAAAYMbDMgBMbsFyYBAAAAAAzM2mxYmBmZYmlZmZmBzYmMjZMDzMMzYGGDzMMLDz2yMYDAAAAAAmB
```

They share the same 64-character alphabet, so they *look* similar, but they decode to different headers.

---

## 1) The “base64” here is a 6-bit container, not RFC 4648 base64 bytes

The alphabet is:
```text
ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/
```

Each character is converted to a number `0..63` by `indexOf()` in that alphabet.

### Bit order (the #1 gotcha)

WoW’s `ExportUtil.lua` stores and extracts bits **LSB-first**:

- Each character holds **6 bits**
- When extracting bits, it repeatedly takes `value % 2^k` and shifts right — effectively consuming **least-significant bits first**
- When building a multi-bit number, the first extracted bit becomes **bit 0** of the result

SimulationCraft matches this in `engine/player/player.cpp` via its `get_bit` lambda inside `parse_traits_hash()`.

### Minimal bit-reader (implementation-grade pseudocode)

```pseudo
BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
head = 0  # bit offset into the stream

function readBits(n):
  out = 0
  for i in 0..n-1:
    charIndex = head // 6
    bitIndex  = head % 6
    v = indexOf(BASE64, s[charIndex])  # 0..63
    b = (v >> bitIndex) & 1            # LSB-first within the 6-bit bucket
    out |= b << i                      # LSB-first into the output integer
    head += 1
  return out
```

### Flowchart: bit extraction

```mermaid
flowchart TD
  A[head bit offset] --> B[charIndex = head // 6]
  B --> C[bitIndex = head % 6]
  C --> D[v = indexOf(BASE64, s[charIndex])]
  D --> E[bit = (v >> bitIndex) & 1]
  E --> F[out |= bit << i]
  F --> G[head++]
  G --> H{need more bits?}
  H -->|yes| B
  H -->|no| I[return out]
```

---

## 2) Header layout (version + specID + treeHash)

Blizzard’s `Blizzard_ClassTalentImportExport.lua` writes:

- `serializationVersion`: **8 bits**
- `specID`: **16 bits**
- `treeHash`: **128 bits** (16 × 8-bit values)

SimulationCraft uses the same widths (see constants in `engine/player/player.cpp`):

- `version_bits = 8`
- `spec_bits = 16`
- `tree_bits = 128`

### Header parse algorithm

```pseudo
version = readBits(8)
specID  = readBits(16)
treeHashBytes = [ readBits(8) repeated 16 times ]
```

SimulationCraft consumes the `treeHash` but does not rely on it for validation.

---

## 3) Decode results for the two posted strings

### 3.1 Long Wowhead-style string

String:
```
C0PAAAAAAAAAAAAAAAAAAAAAAYMbDMgBMbsFyYBAAAAAAzM2mxYmBmZYmlZmZmBzYmMjZMDzMMzYGGDzMMLDz2yMYDAAAAAAmB
```

Decoded header (with the bit rules above):

- `serializationVersion = 2`
- `specID = 253` (Beast Mastery Hunter)
- `treeHash = 16 bytes of 0`

This is a valid “loadout code” header.

### 3.2 Short string

String:
```
DAQUVREVFUFUmARERAUCEQOVUUUUVRURYSQFEBEEFVVUBV
```

Decoded header (same rules):

- `serializationVersion = 3`
- `specID = 20736`

`20736` is not a Hunter spec ID (Hunter specs are 253/254/255). That means **this string is not a BM loadout code for the current loadout-code format**, or it’s missing/altered characters, or it’s a different kind of export blob entirely.

---

## 4) The critical non-obvious fact: node IDs are NOT stored in the string

After the header, the stream encodes **one record per node** in a fixed order, but:

- The string does **not** contain node IDs.
- Both sides (exporter/importer) must already have the same ordered node list for that tree.

SimulationCraft constructs the node list from DBC data (`trait_data`) and iterates it in ascending `id_node` order because it’s stored in a `std::map`:

- Node list build: `engine/player/player.cpp` (`generate_tree_nodes`)
- Parse loop: `engine/player/player.cpp` (`for (auto& [id, node] : tree_nodes)`)

If you build the node list in a different order than the exporter, you desync the bitstream and everything after the first mismatch becomes garbage.

---

## 5) Per-node record format (variable-length)

For each node (in the pre-agreed node order), the stream has:

1. `isNodeSelected` (1 bit)
   - 0 → not selected, stop for this node
   - 1 → continue

2. `isNodePurchased` (1 bit) **only if selected**
   - 0 → treated as “granted”; rank = 1; stop for this node
   - 1 → continue

3. `isPartiallyRanked` (1 bit) **only if purchased**
   - 0 → rank = `maxRanks` (requires node metadata)
   - 1 → read `partialRanksPurchased` (6 bits)

4. `hasChoiceSelection` (1 bit) **only if purchased**
   - 0 → no choice index
   - 1 → read `choiceIndex` (2 bits, 0-based)

SimulationCraft uses:

- `rank_bits = 6`
- `choice_bits = 2`

### Flowchart: per-node decode

```mermaid
flowchart TD
  N[Node i] --> S[read selected:1]
  S -->|0| NEXT[Next node]
  S -->|1| P[read purchased:1]
  P -->|0| G[rank=1 (granted); emit] --> NEXT
  P -->|1| R0[rank defaults to maxRanks]
  R0 --> PR[read partiallyRanked:1]
  PR -->|0| HC[read hasChoice:1]
  PR -->|1| RB[read rank:6] --> HC
  HC -->|0| EM[emit (default entry, rank)] --> NEXT
  HC -->|1| CI[read choiceIndex:2; select entry] --> EM
```

---

## 6) Choice-node entry ordering (the #2 gotcha)

Choice nodes contain multiple “entries” (different spells/talents) under the same node ID.

The bitstream stores only a small `choiceIndex` (2 bits), so you must have a stable ordering for entries inside a node.

SimulationCraft sorts entries using:

- `selection_index` if available
- else by `id_trait_node_entry` descending

See `sort_node_entries()` in `engine/player/player.cpp`.

If you order entries differently than the exporter, you’ll decode the wrong choice.

---

## 7) Hero tree selection for BM Hunter: Dark Ranger vs Pack Leader

In SimulationCraft DBC, hero trees are identified by `id_sub_tree`:

- `43` = Pack Leader
- `44` = Dark Ranger

For BM (specID 253), the hero selection node is:

- `nodeID = 99832` (tree `SELECTION`, `node_type = 3`)
- entries:
  - entry `123347` → subtree `43` (Pack Leader)
  - entry `123348` → subtree `44` (Dark Ranger)

When the long Wowhead string above is parsed with correct node ordering and bit rules, it selects:

- `node 99832` → entry `123348` → subtree `44`

So: **Beast Mastery + Dark Ranger**.

---

## 8) Minimal “header-only” checker (copy/paste corruption detector)

If the header doesn’t decode to a plausible `specID`, nothing else matters.

Python:
```python
BASE64="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

def read_bits(s, n, head=0):
    vals=[BASE64.index(c) for c in s]
    out=0
    for i in range(n):
        out |= ((vals[head//6] >> (head%6)) & 1) << i
        head += 1
    return out, head

def parse_header(s):
    v, h = read_bits(s, 8, 0)
    spec, h = read_bits(s, 16, h)
    tree_hash = []
    for _ in range(16):
        b, h = read_bits(s, 8, h)
        tree_hash.append(b)
    return v, spec, tree_hash

print(parse_header("C0PAAAAAAAAAAAAAAAAAAAAAAYMbDMgBMbsFyYBAAAAAAzM2mxYmBmZYmlZmZmBzYmMjZMDzMMzYGGDzMMLDz2yMYDAAAAAAmB"))
```

Expected output begins with:
- version `2`
- spec `253`

---

## 9) If you’re implementing your own parser: checklist

1. Use the 64-char alphabet above, do **not** use standard base64 decode-to-bytes.
2. Bits are consumed **LSB-first** within each 6-bit char.
3. Header widths are fixed: `8, 16, 128`.
4. Node IDs are not stored; you must provide a correct, build-matching node order.
5. Choice nodes require correct per-node entry ordering.
6. Partial-rank decoding requires `maxRanks` from metadata.

