import { verify } from "@noble/ed25519";
import { decodeBase64, encodeHex, encodeBase32 } from "@std/encoding";
import { json } from "./response.ts";

type VerifyResult =
  | { error: Response }
  | { node: { publicKey: string; publicKeyBytes: Uint8Array } };

export async function verifyNode(
  req: Request,
  body: string,
): Promise<VerifyResult> {
  const pubkey = req.headers.get("X-Node-Key");
  const sig = req.headers.get("X-Node-Sig");
  const ts = req.headers.get("X-Node-Ts");

  if (!pubkey || !sig || !ts) {
    return { error: json({ error: "Missing auth headers" }, 401) };
  }

  const timestamp = parseInt(ts, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    return { error: json({ error: "Timestamp expired" }, 401) };
  }

  const pubkeyBytes = decodeBase64(pubkey);
  const sigBytes = decodeBase64(sig);

  if (pubkeyBytes.length !== 32 || sigBytes.length !== 64) {
    return { error: json({ error: "Invalid key/sig length" }, 401) };
  }

  const bodyBytes = new TextEncoder().encode(body);
  const bodyHash = encodeHex(await crypto.subtle.digest("SHA-256", bodyBytes));

  const message = `${ts}\0${req.method}\0${new URL(req.url).pathname}\0${bodyHash}`;
  const messageBytes = new TextEncoder().encode(message);

  const valid = await verify(sigBytes, messageBytes, pubkeyBytes);
  if (!valid) {
    return { error: json({ error: "Invalid signature" }, 401) };
  }

  return { node: { publicKey: pubkey, publicKeyBytes: pubkeyBytes } };
}

export async function deriveClaimCode(
  pubkeyBytes: Uint8Array,
): Promise<string> {
  const hash = new Uint8Array(
    await crypto.subtle.digest("SHA-256", pubkeyBytes.buffer as ArrayBuffer),
  );

  return encodeBase32(hash.slice(0, 4))
    .replace(/=+$/, "")
    .slice(0, 6)
    .toUpperCase();
}
