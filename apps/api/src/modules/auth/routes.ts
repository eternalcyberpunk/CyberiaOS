import type { FastifyInstance } from "fastify";
import { AppError } from "../../lib/errors.js";

/**
 * Passkeys are the primary factor; OAuth is for onboarding. Password auth
 * exists only as a legacy path and always requires a second factor.
 *
 * M1 implements: challenge → verify → session cookie → capability minting.
 */
export async function authRoutes(app: FastifyInstance) {
  app.post("/passkey/challenge", async (req) => {
    // TODO(M1): @simplewebauthn/server generateRegistrationOptions
    return { challenge: "stub", rpId: process.env.WEBAUTHN_RP_ID };
  });

  app.post("/passkey/verify", async () => {
    throw new AppError("INTERNAL", "passkey verification lands in M1");
  });

  app.get("/me", async (req) => {
    if (process.env.DEV_USER === "1") {
      return { id: "cdevuser000000000000000", handle: "operator", displayName: "Operator" };
    }
    throw new AppError("UNAUTHENTICATED", "Sign in to continue");
  });

  /**
   * Capability minting. Short-lived, audience-scoped, signed with Ed25519.
   * The realtime service verifies these and never touches the database on the hot path.
   */
  app.post("/capability", async (req) => {
    const { room } = req.body as { room: string };
    if (!room?.startsWith("project:")) throw new AppError("VALIDATION", "room must be project:<id>");
    // TODO(M1): resolve role from Collaborator, sign with CAPABILITY_SIGNING_KEY (jose, EdDSA, 15m)
    return { token: "stub", expiresIn: 900 };
  });
}
