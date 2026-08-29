import { expect, test } from "@playwright/test";
import {
  createList,
  openDashboard,
  pickFaction,
  startNewList,
} from "./helpers";

test("Spearhead hides Magic and uses the box roster", async ({ page }) => {
  await openDashboard(page);
  await startNewList(page);
  await pickFaction(page, "Cities of Sigmar");
  await page.getByLabel("Army").selectOption({ label: "Fusil-Platoon" });
  await createList(page);

  await expect(page.getByText("Spearhead", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Regiment ability")).toBeVisible();
  await expect(page.getByText("Battle formation")).toHaveCount(0);

  await page.getByRole("button", { name: "Play" }).click();
  await expect(page.getByRole("group", { name: "Play sections" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Units" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Phases" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Magic" })).toHaveCount(0);
});
