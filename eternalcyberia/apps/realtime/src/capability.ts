import { jwtVerify, importSPKI } from "jose";
import { Capability } from "@ec/schema";

let key: CryptoKey | Uint8Array | null = null;

/**
 * Capability tokens are minted by the API and verified here. No database
 * lookup on the hot path — a room join must not cost a query.
 */
export async function verifyCapability(token: string): Promise<Capability> {
  key ??= await importSPKI(process.env.CAPABILITY_PUBLIC_KEY!, "EdDSA");
  const { payload } = await jwtVerify(token, key, { algorithms: ["EdDSA"] });
  return Capability.parse(payload);
}
