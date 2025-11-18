// TODO Move this but not sure where yet

/**
 * Convert hex string to bigint for bitwise operations
 * @example hexToBigInt("0x55C0A2FB951D4ACE") => 6184943489809468110n
 */
export const hexToBigInt = (hex: string): bigint => {
  const cleaned = hex.startsWith("0x") ? hex.slice(2) : hex;
  const unsigned = BigInt("0x" + cleaned);

  // Convert from unsigned to signed if needed (two's complement)
  const max = 1n << 64n;
  const half = 1n << 63n;

  return unsigned >= half ? unsigned - max : unsigned;
};

/**
 * Convert number or bigint to hex string (64-bit two's complement)
 * @example bigIntToHex(-6184943489809468494n) => "0xAA3F5D046AE2B512"
 */
export const bigIntToHex = (value: number | bigint): string => {
  const bigIntValue = typeof value === "bigint" ? value : BigInt(value);
  const unsigned = bigIntValue < 0n ? bigIntValue + (1n << 64n) : bigIntValue;

  return "0x" + unsigned.toString(16).toUpperCase();
};

/**
 * Check if a bitmask has a specific bit set
 * @example hasBit("0x5", 0) => true  (bit 0 is set)
 * @example hasBit("0x5", 1) => false (bit 1 is not set)
 * @example hasBit("0x5", 2) => true  (bit 2 is set)
 */
export const hasBit = (hex: string, bit: number): boolean => {
  const mask = 1n << BigInt(bit);

  return (hexToBigInt(hex) & mask) !== 0n;
};

/**
 * Check if any bits in the mask are set in the value
 * @example hasAnyBit("0x5", "0x1") => true  (both have bit 0)
 * @example hasAnyBit("0x5", "0x2") => false (no common bits)
 */
export const hasAnyBit = (hex: string, mask: string): boolean => {
  return (hexToBigInt(hex) & hexToBigInt(mask)) !== 0n;
};

/**
 * Check if all bits in the mask are set in the value
 * @example hasAllBits("0x7", "0x5") => true  (0x7 has bits 0 and 2)
 * @example hasAllBits("0x5", "0x7") => false (0x5 missing bit 1)
 */
export const hasAllBits = (hex: string, mask: string): boolean => {
  const hexBits = hexToBigInt(hex);
  const maskBits = hexToBigInt(mask);

  return (hexBits & maskBits) === maskBits;
};
