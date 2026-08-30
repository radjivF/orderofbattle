import { expect, test } from "@playwright/test";
import {
  createList,
  openDashboard,
  pickFaction,
  startNewList,
} from "./helpers";

test("play units tab tracks damage on a hero", async ({ page }) => {
  await openDashboard(page);
  await startNewList(page);
  await pickFaction(page, "Stormcast Eternals");
  await createList(page);

  await page.getByRole("button", { name: "+ Regiment", exact: true }).click();
  await page.getByRole("button", { name: /Lord-Celestant/ }).first().click();
  await expect(page.getByRole("heading", { name: /Lord-Celestant/ })).toBeVisible();

  await page.getByRole("button", { name: "Play" }).click();
  await page.getByRole("button", { name: "Units" }).click();

  const increment = page.getByRole("button", { name: "+" }).first();
  await expect(increment).toBeVisible();
  await increment.click();
  await expect(page.getByText("1dmg")).toBeVisible();
  await expect(page.getByText("6 hp")).toBeVisible();
});
