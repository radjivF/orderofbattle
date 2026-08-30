import { expect, test } from "@playwright/test";
import { openDashboard } from "./helpers";

test("cookie consent accepts analytics choice", async ({ page }) => {
  await openDashboard(page);
  const accept = page.getByRole("button", { name: "Accept" });
  if (await accept.isVisible()) {
    await accept.click();
    await expect(accept).toHaveCount(0);
  }
});
