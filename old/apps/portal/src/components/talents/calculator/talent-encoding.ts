import { encodeTalentLoadout } from "@wowlab/parsers";

export function createHeaderOnlyTalentString(specId: number): string {
  const zeroHash = new Uint8Array(16);
  return encodeTalentLoadout({
    version: 1,
    specId,
    treeHash: zeroHash,
    nodes: [],
  });
}
