import { Effect } from "effect";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface DecodedTalentLoadout {
  nodes: DecodedTalentNode[];
  specId: number;
  treeHash: Uint8Array; // 16 bytes
  version: number;
}

export interface DecodedTalentNode {
  choiceIndex?: number;
  choiceNode?: boolean;
  partiallyRanked?: boolean;
  purchased?: boolean;
  ranksPurchased?: number;
  selected: boolean;
}

type BitReader = {
  readonly getBits: (count: number) => number;
  readonly hasBits: (count: number) => boolean;
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const BASE64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const BASE64_URL_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const CHAR_MAP: Record<string, number> = {};

for (let i = 0; i < BASE64_CHARS.length; i++) {
  CHAR_MAP[BASE64_CHARS[i]] = i;
  CHAR_MAP[BASE64_URL_CHARS[i]] = i;
}

// Taken from parse_traits_hash <(o_o)>
export function decodeTalentLoadout(
  talentString: string,
): Effect.Effect<DecodedTalentLoadout, Error> {
  return Effect.try({
    catch: (error) =>
      error instanceof Error ? error : new Error(String(error)),
    try: () => {
      if (!talentString || talentString.match(/[^A-Za-z0-9+/_-]/)) {
        throw new Error("Invalid characters in talent string");
      }

      const reader = makeBitReader(talentString);
      const version = reader.getBits(8);
      const specId = reader.getBits(16);

      const hashBytes = new Uint8Array(16);
      for (let i = 0; i < 16; i++) {
        hashBytes[i] = reader.getBits(8);
      }

      const nodes: DecodedTalentNode[] = [];

      while (reader.hasBits(1)) {
        const selected = reader.getBits(1) === 1;
        if (!selected) {
          nodes.push({ selected: false });
          continue;
        }

        const purchased = reader.getBits(1) === 1;
        let partiallyRanked = false;
        let ranksPurchased: number | undefined;
        let choiceNode = false;
        let choiceIndex: number | undefined;

        if (purchased) {
          // partiallyRanked and hasChoice bits are ONLY read when purchased
          partiallyRanked = reader.getBits(1) === 1;

          if (partiallyRanked) {
            ranksPurchased = reader.getBits(6);
          }

          // hasChoice bit - MUST be inside purchased block per SimC
          choiceNode = reader.getBits(1) === 1;

          if (choiceNode) {
            choiceIndex = reader.getBits(2);
          }
        }

        nodes.push({
          choiceIndex,
          choiceNode,
          partiallyRanked,
          purchased,
          ranksPurchased,
          selected,
        });
      }

      return {
        nodes,
        specId,
        treeHash: hashBytes,
        version,
      };
    },
  });
}

// Taken from parse_traits_hash <(o_o)>
export function decodeTalents(
  encoded: string,
): Effect.Effect<Uint8Array, Error> {
  return Effect.try({
    catch: (error) =>
      error instanceof Error ? error : new Error(String(error)),
    try: () => {
      const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
      const padded = normalized + "===".slice((normalized.length + 3) % 4);
      const buffer = Buffer.from(padded, "base64"); // TODO Web compatibility?

      return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.length);
    },
  });
}

export function decodeTalentsToBits(
  encoded: string,
): Effect.Effect<string, Error> {
  return Effect.map(decodeTalents(encoded), (bytes) =>
    Array.from(bytes, (b) => b.toString(2).padStart(8, "0")).join(""),
  );
}

function makeBitReader(talentString: string): BitReader {
  let head = 0;
  let current = CHAR_MAP[talentString[0]] ?? 0;
  const totalBits = talentString.length * 6;

  const ensureByte = () => {
    current = CHAR_MAP[talentString[Math.floor(head / 6)]] ?? 0;
  };

  const getBits = (count: number) => {
    let val = 0;

    for (let i = 0; i < count; i++) {
      const bitPos = head % 6;

      val |= ((current >> bitPos) & 1) << i; // LSB-first
      head++;

      if (bitPos === 5 && head < totalBits) {
        ensureByte();
      }
    }

    return val;
  };

  const hasBits = (count: number) => head + count <= totalBits;

  return { getBits, hasBits };
}
