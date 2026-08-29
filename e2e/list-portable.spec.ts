import fs from "node:fs";
import { expect, test } from "@playwright/test";
import {
  createList,
  openDashboard,
  pickFaction,
  startNewList,
} from "./helpers";

test("library export picker supports text and json import", async ({ page }) => {
  await openDashboard(page);
  const rejectCookies = page.getByRole("button", { name: "Reject" });
  if (await rejectCookies.isVisible()) {
    await rejectCookies.click();
  }

  await startNewList(page);
  await pickFaction(page, "Stormcast Eternals");
  await createList(page);
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "My lists" })).toBeVisible();
  await page.getByRole("button", { name: "List options" }).click();
  await expect(page.getByRole("heading", { name: "List options" })).toBeVisible();
  await expect(page.getByLabel("Sort lists")).toBeVisible();
  await expect(page.getByLabel("Import or export lists")).toBeVisible();
  await page.getByRole("button", { name: "Export" }).click();
  await expect(page.getByText("Choose one or more lists to export.")).toBeVisible();
  await page.getByRole("checkbox", { name: /Export/i }).check();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Export list" })).toBeVisible();
  await expect(page.getByLabel("Export format")).toBeVisible();
  await expect(page.getByLabel("Exported list")).toContainText("=== Order of Battle ===");

  const textDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download .txt" }).click();
  const textFile = await textDownload;
  expect(textFile.suggestedFilename()).toMatch(/\.txt$/);
  const textPath = await textFile.path();
  expect(textPath).toBeTruthy();

  await page.getByRole("button", { name: "JSON", exact: true }).click();
  await expect(page.getByLabel("Exported list")).toContainText('"factionId": "stormcast-eternals"');

  const jsonDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download .json" }).click();
  const jsonFile = await jsonDownload;
  expect(jsonFile.suggestedFilename()).toMatch(/\.json$/);
  const jsonPath = await jsonFile.path();
  expect(jsonPath).toBeTruthy();

  await page.getByLabel("Close list options").click();

  await page.getByRole("article").getByRole("button", { name: "Delete" }).click();
  await page.getByLabel("Delete list").getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("No armies yet")).toBeVisible();

  await page.getByRole("button", { name: "List options" }).click();
  await page.getByLabel("List to import").fill(fs.readFileSync(jsonPath!, "utf8"));
  await page.getByRole("button", { name: "Import" }).click();
  await expect(page.getByText(/Add .+ to My lists\?/)).toBeVisible();
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.locator("article")).toHaveCount(1);

  await page.getByRole("button", { name: "List options" }).click();
  await page.getByLabel("List to import").fill(fs.readFileSync(textPath!, "utf8"));
  await page.getByRole("button", { name: "Import" }).click();
  await expect(
    page.getByText("Those lists are already in My lists. Nothing will be added."),
  ).toBeVisible();
  await page.getByRole("button", { name: "OK" }).click();
  await expect(page.locator("article")).toHaveCount(1);
});
