import { expect, test } from "@playwright/test";
import {
  createList,
  openDashboard,
  pickFaction,
  startNewList,
} from "./helpers";

test("matched play keeps points, formation, and Magic", async ({ page }) => {
  await openDashboard(page);
  await startNewList(page);
  await pickFaction(page, "Stormcast Eternals");
  await createList(page);

  await expect(page.getByText("Battle formation")).toBeInViewport();
  await expect(page.getByText("Creating your list")).toHaveCount(0);
  await expect(page.getByText("Opening your list")).toHaveCount(0);
  await expect(page.getByText("Spearhead", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Play" })).toBeVisible();

  await page.getByRole("button", { name: "+ Regiment", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Choose a hero" })).toBeVisible();
  await expect(page.getByText("Empty regiment")).toHaveCount(0);
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.getByText("Empty regiment")).toHaveCount(0);

  await page.getByRole("button", { name: "+ Regiment", exact: true }).click();
  await page.getByRole("button", { name: /Lord-Celestant/ }).first().click();
  await expect(page.getByRole("heading", { name: /Lord-Celestant/ })).toBeVisible();

  await page.getByRole("button", { name: "Play" }).click();
  await expect(page.getByRole("group", { name: "Play sections" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Magic" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Units" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Phases" })).toBeVisible();

  await page.goto("/dashboard");
  const card = page.locator("article").first();
  await expect(card.getByRole("link", { name: /Open / })).toHaveCount(1);
  await expect(card.getByLabel("List name")).toHaveCSS("cursor", "text");
  await expect(card.getByRole("button", { name: "Open list" })).toHaveCount(0);

  const dashboardUrl = page.url();
  await card.getByRole("button", { name: "Duplicate" }).click();
  await expect(page).toHaveURL(dashboardUrl);
  await expect(page.locator("article")).toHaveCount(2);

  await card.getByRole("link", { name: /Open / }).click();
  await page.waitForURL(/\/lists\/.+/);
  await expect(page.getByText("Battle formation")).toBeInViewport();
});
