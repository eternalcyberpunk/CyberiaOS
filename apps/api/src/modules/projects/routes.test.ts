import { describe, expect, it } from "vitest";
import { build } from "../../server.js";

/** Rule: every mutation gets its unauthorised test before its happy-path test. */
describe("projects", () => {
  it("rejects delete for non-owners", async () => {
    const app = build();
    const res = await app.inject({ method: "DELETE", url: "/v1/projects/cabc00000000000000000000" });
    expect(res.statusCode).toBe(403);
    expect(res.json().code).toBe("FORBIDDEN");
    expect(res.json().requestId).toBeTruthy();
  });

  it("rejects a malformed create", async () => {
    const app = build();
    const res = await app.inject({ method: "POST", url: "/v1/projects", payload: { title: "" } });
    expect(res.statusCode).toBe(422);
    expect(res.json().code).toBe("VALIDATION");
  });
});
