// Loadout string format (bitstream):
// - 8 bits: version
// - 16 bits: spec_id
// - 128 bits: tree_hash
// - variable: node data
// Mirrors: crates/common/src/parsers/loadout/mod.rs

const BASE64_CHAR_MAP: Record<string, number> = {};
const STANDARD =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const URL_SAFE =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

for (let i = 0; i < 64; i++) {
  BASE64_CHAR_MAP[STANDARD[i]] = i;
  BASE64_CHAR_MAP[URL_SAFE[i]] = i;
}

// Reads bits LSB-first from base64 string
class BitReader {
  private position = 0;

  constructor(private data: string) {}

  read(bitCount: number): number {
    let value = 0;
    for (let i = 0; i < bitCount; i++) {
      const charIdx = Math.floor(this.position / 6);
      const bitOffset = this.position % 6;

      const char = this.data[charIdx];
      const charValue = BASE64_CHAR_MAP[char];
      if (charValue === undefined) {
        throw new Error(`Invalid base64 character: ${char}`);
      }

      const bit = (charValue >> bitOffset) & 1;
      value |= bit << i;
      this.position++;
    }
    return value;
  }
}

export function extractSpecId(loadoutString: string): number | null {
  // Need at least 4 chars for 24 bits (4 * 6 = 24)
  if (!loadoutString || loadoutString.length < 4) {
    return null;
  }

  try {
    const reader = new BitReader(loadoutString);
    reader.read(8); // Skip version
    const specId = reader.read(16);
    return specId;
  } catch {
    return null;
  }
}
