import { Effect } from "effect";

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

const BASE64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const BASE64_URL_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const CHAR_MAP: Record<string, number> = {};

for (let i = 0; i < BASE64_CHARS.length; i++) {
  CHAR_MAP[BASE64_CHARS[i]] = i;
  CHAR_MAP[BASE64_URL_CHARS[i]] = i;
}

// ported from simc parse_traits_hash
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
          // these bits only present when purchased
          partiallyRanked = reader.getBits(1) === 1;
          if (partiallyRanked) {
            ranksPurchased = reader.getBits(6);
          }
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

type BitWriter = {
  readonly pushBits: (value: number, count: number) => void;
  readonly finish: () => string;
};

export function encodeTalentLoadout(loadout: {
  version: number;
  specId: number;
  treeHash: Uint8Array; // 16 bytes
  nodes: Array<{
    selected: boolean;
    purchased?: boolean;
    ranksPurchased?: number;
    partiallyRanked?: boolean;
    choiceNode?: boolean;
    choiceIndex?: number;
  }>;
}): string {
  const writer = makeBitWriter();

  writer.pushBits(loadout.version & 0xff, 8);
  writer.pushBits(loadout.specId & 0xffff, 16);

  const hash = loadout.treeHash;
  for (let i = 0; i < 16; i++) {
    writer.pushBits(hash[i] ?? 0, 8);
  }

  for (const node of loadout.nodes) {
    writer.pushBits(node.selected ? 1 : 0, 1);

    if (!node.selected) {
      continue;
    }

    const purchased = node.purchased ?? false;
    writer.pushBits(purchased ? 1 : 0, 1);

    if (!purchased) {
      continue;
    }

    const partiallyRanked = node.partiallyRanked ?? false;
    writer.pushBits(partiallyRanked ? 1 : 0, 1);
    if (partiallyRanked) {
      writer.pushBits((node.ranksPurchased ?? 0) & 0x3f, 6);
    }

    const choiceNode = node.choiceNode ?? false;
    writer.pushBits(choiceNode ? 1 : 0, 1);
    if (choiceNode) {
      writer.pushBits((node.choiceIndex ?? 0) & 0x3, 2);
    }
  }

  return writer.finish();
}

export function decodeTalents(
  encoded: string,
): Effect.Effect<Uint8Array, Error> {
  return Effect.try({
    catch: (error) =>
      error instanceof Error ? error : new Error(String(error)),
    try: () => {
      const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
      const padded = normalized + "===".slice((normalized.length + 3) % 4);
      const binary = globalThis.atob(padded);
      const bytes = new Uint8Array(binary.length);

      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      return bytes;
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

function makeBitWriter(): BitWriter {
  let head = 0;
  let current = 0;
  let out = "";

  const flush = () => {
    out += BASE64_URL_CHARS[current] ?? "A";
    current = 0;
    head = 0;
  };

  const pushBits = (value: number, count: number) => {
    for (let i = 0; i < count; i++) {
      const bit = (value >> i) & 1;
      current |= bit << head;
      head++;
      if (head === 6) {
        flush();
      }
    }
  };

  const finish = () => {
    if (head > 0) {
      flush();
    }
    return out;
  };

  return { pushBits, finish };
}
