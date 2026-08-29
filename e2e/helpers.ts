import { expect, type Page } from "@playwright/test";

export async function openDashboard(page: Page) {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "My lists" })).toBeVisible();
}

export async function startNewList(page: Page) {
  const empty = page.getByRole("button", { name: "Make your first list" });
  if ((await empty.count()) > 0) {
    await empty.click();
  } else {
    await page.getByRole("button", { name: "New list" }).click();
  }
  await expect(
    page.getByRole("heading", { name: "Choose a faction" }),
  ).toBeVisible();
}

export async function pickFaction(page: Page, name: string) {
  await page.getByRole("button", { name: new RegExp(name) }).click();
  await expect(
    page.getByRole("heading", { name: "Create new list" }),
  ).toBeVisible();
  await expect(page.getByText(/\d+ heroes · \d+ units/)).toBeVisible();
}

export async function createList(page: Page) {
  await page.getByRole("button", { name: "Create" }).click();
  await page.waitForURL(/\/lists\/.+/);
}
