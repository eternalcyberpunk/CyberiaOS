import { expect, test } from "@playwright/test";

test.describe("shell", () => {
  test("hub lists studios and opens one", async ({ page }) => {
    await page.goto("/hub");
    await expect(page.getByRole("heading", { name: "The Hub" })).toBeVisible();
    await page.getByRole("link", { name: /Image Lab/ }).click();
    await expect(page).toHaveURL(/\/studio\/image/);
    await expect(page.locator("canvas")).toBeVisible();
  });

  test("command palette opens with the keyboard and navigates", async ({ page }) => {
    await page.goto("/hub");
    await page.keyboard.press("ControlOrMeta+k");
    const dialog = page.getByRole("dialog", { name: "Command palette" });
    await expect(dialog).toBeVisible();
    await dialog.getByPlaceholder(/Search studios/).fill("image");
    await dialog.getByRole("button", { name: /Image Lab/ }).click();
    await expect(page).toHaveURL(/\/studio\/image/);
  });

  test("dock targets meet the 44px minimum", async ({ page }) => {
    await page.goto("/hub");
    for (const link of await page.getByRole("navigation", { name: "Primary" }).getByRole("link").all()) {
      const box = await link.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });
});
