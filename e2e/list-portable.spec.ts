import { expect, test } from "@playwright/test";
import {
  createList,
  openDashboard,
  pickFaction,
  startNewList,
} from "./helpers";

test("library export and import skip lists already on this device", async ({
  page,
}) => {
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
  await expect(page.getByRole("button", { name: "Export all" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Export list" })).toHaveCount(0);
  await expect(page.locator("article")).toHaveCount(1);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export all" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("order-of-battle-lists.txt");
  const downloadPath = await download.path();
  expect(downloadPath).toBeTruthy();

  await page.getByRole("button", { name: "Import list" }).click();
  await expect(
    page.getByText(/Use a \.txt file exported from Order of Battle/),
  ).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles(downloadPath!);
  await expect(
    page.getByText("Those lists are already in My lists. Nothing will be added."),
  ).toBeVisible();
  await page.getByRole("button", { name: "OK" }).click();
  await expect(page.locator("article")).toHaveCount(1);

  await page.getByRole("article").getByRole("button", { name: "Delete" }).click();
  await page.getByLabel("Delete list").getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("No armies yet")).toBeVisible();

  await page.getByRole("button", { name: "Import list" }).click();
  await page.locator('input[type="file"]').setInputFiles(downloadPath!);
  await expect(page.getByText(/Add .+ to My lists\?/)).toBeVisible();
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.locator("article")).toHaveCount(1);

  await page.getByRole("button", { name: "Import list" }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "bad.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not a list"),
  });
  await expect(
    page.getByText("That file is not an Order of Battle list."),
  ).toBeVisible();
  await page.getByRole("button", { name: "OK" }).click();
  await expect(page.locator("article")).toHaveCount(1);
});
