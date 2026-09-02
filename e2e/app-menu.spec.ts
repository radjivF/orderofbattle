import { expect, test, type Page } from "@playwright/test";
import { openDashboard } from "./helpers";

async function dismissCookies(page: Page) {
  const rejectCookies = page.getByRole("button", { name: "Reject" });
  if (await rejectCookies.isVisible()) {
    await rejectCookies.click();
  }
}

async function openAppMenu(page: Page) {
  await page.getByRole("button", { name: "Open menu" }).click();
  return page.getByRole("dialog", { name: "Menu" });
}

test("hamburger groups games and opens AOS battle record", async ({
  page,
}) => {
  await openDashboard(page);
  await dismissCookies(page);

  const menu = await openAppMenu(page);
  await expect(menu.getByRole("heading", { name: "AOS" })).toBeVisible();
  await expect(menu.getByRole("heading", { name: "40k" })).toBeVisible();
  await expect(menu.getByRole("heading", { name: "The old world" })).toBeVisible();
  await expect(menu.getByRole("button", { name: "List builder" })).toBeVisible();
  await expect(menu.getByRole("button", { name: "The old world lists" })).toHaveCount(0);
  await expect(menu.getByRole("button", { name: "Battle record" })).toBeVisible();
  await expect(menu.getByRole("button", { name: "Core rules" })).toBeVisible();
  await expect(menu.getByRole("button", { name: "Scourge of Aqshy rules" })).toBeVisible();
  await expect(menu.getByRole("button", { name: "40k lists" })).toHaveCount(0);
  await expect(menu.getByRole("button", { name: "Spearhead record" })).toHaveCount(0);
  await expect(menu.getByText("Coming soon")).toHaveCount(3);
  await expect(menu.getByText("Spearhead record")).toBeVisible();

  await menu.getByRole("button", { name: "Battle record" }).click();
  await page.waitForURL(/\/battle-record$/);
  await expect(page.getByRole("heading", { name: "Battle record" })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Menu" })).toHaveCount(0);
});

test("new battle record keeps Cancel left of Continue on one row", async ({
  page,
}) => {
  await page.goto("/battle-record");
  await expect(page.getByRole("heading", { name: "Battle record" })).toBeVisible();
  await dismissCookies(page);

  await page.getByRole("button", { name: "New battle record" }).first().click();
  const sheet = page.getByRole("dialog", { name: "New battle record" });
  await expect(sheet).toBeVisible();

  const cancel = sheet.getByRole("button", { name: "Cancel" });
  const continueBtn = sheet.getByRole("button", { name: "Continue" });
  await expect(continueBtn).toBeDisabled();
  await expect(cancel.locator("xpath=..")).toHaveCSS("flex-direction", "row");

  const cancelBox = await cancel.boundingBox();
  const continueBox = await continueBtn.boundingBox();
  expect(cancelBox).toBeTruthy();
  expect(continueBox).toBeTruthy();
  expect(cancelBox!.x).toBeLessThan(continueBox!.x);
  expect(Math.abs(cancelBox!.width - continueBox!.width)).toBeLessThan(8);
  expect(cancelBox!.y).toBeLessThan(continueBox!.y + continueBox!.height);
  expect(continueBox!.y).toBeLessThan(cancelBox!.y + cancelBox!.height);

  await expect(sheet.getByText("Put a name")).toBeVisible();
  await expect(sheet.getByText("Your army is not selected")).toBeVisible();

  await cancel.click();
  await expect(sheet).toHaveCount(0);
});

test("hamburger Battle record from a live game returns to the list", async ({
  page,
}) => {
  await page.goto("/battle-record/game-1");
  await dismissCookies(page);

  const menu = await openAppMenu(page);
  await menu.getByRole("button", { name: "Battle record" }).click();
  await page.waitForURL(/\/battle-record$/);
  await expect(page.getByRole("heading", { name: "Battle record" })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Menu" })).toHaveCount(0);
});
