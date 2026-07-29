import { expect, test } from "@playwright/test";

/**
 * The M4 acceptance test, written now so it fails loudly until multiplayer lands:
 * two peers, one document, an offline window, and convergence afterwards.
 */
test("two peers converge across a disconnect", async ({ browser }) => {
  test.skip(!process.env.REALTIME_URL, "needs the realtime service");

  const a = await browser.newPage();
  const b = await browser.newPage();
  await a.goto("/studio/image?project=e2e-room");
  await b.goto("/studio/image?project=e2e-room");

  await a.getByLabel("Threshold").fill("0.8");
  await expect(b.getByLabel("Threshold")).toHaveValue("0.8", { timeout: 2000 });

  await b.context().setOffline(true);
  await b.getByLabel("Threshold").fill("0.3");
  await a.getByLabel("Threshold").fill("0.9");
  await b.context().setOffline(false);

  await expect
    .poll(async () => (await a.getByLabel("Threshold").inputValue()) === (await b.getByLabel("Threshold").inputValue()))
    .toBe(true);
});
