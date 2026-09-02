import { expect, test, type Page } from "@playwright/test";

async function dismissCookies(page: Page) {
  const rejectCookies = page.getByRole("button", { name: "Reject" });
  if (await rejectCookies.isVisible()) {
    await rejectCookies.click();
  }
}

async function pickArmy(page: Page, label: "Your army" | "Opponent army", faction: string) {
  const dialogName =
    label === "Your army" ? "Choose your army" : "Choose opponent army";
  await page.getByLabel(label).click();
  const picker = page.getByRole("dialog", { name: dialogName });
  await expect(picker).toBeVisible();
  await picker.getByRole("button", { name: "Factions" }).click();
  await picker.getByRole("button", { name: faction, exact: true }).click();
  await expect(picker).toHaveCount(0);
}

test("battle page tracks two players, map, primary, tactics, and double turn", async ({
  page,
}) => {
  await page.goto("/battle-record");
  await expect(page.getByRole("heading", { name: "Battle record" })).toBeVisible();
  await dismissCookies(page);

  await page.getByRole("button", { name: "New battle record" }).first().click();
  const create = page.getByRole("dialog", { name: "New battle record" });
  await expect(create).toBeVisible();

  await create.getByLabel("Your name").fill("Rad");
  await pickArmy(page, "Your army", "Stormcast Eternals");
  await create.getByLabel("Opponent name").fill("Alex");
  await pickArmy(page, "Opponent army", "Blades of Khorne");
  await expect(
    create.getByRole("button", { name: "Track priority" }),
  ).toHaveAttribute("aria-pressed", "true");
  await create.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "Set up battle" })).toBeVisible();
  await expect(page.getByLabel("Your name")).toHaveValue("Rad");
  await expect(page.getByLabel("Opponent name")).toHaveValue("Alex");
  await expect(page.getByLabel("Your army")).toHaveText("Stormcast Eternals");
  await expect(page.getByLabel("Opponent army")).toHaveText("Blades of Khorne");

  await page.getByLabel("Choose battleplan").selectOption({ label: "Into the Fire" });
  const setupMap = page.getByRole("img", { name: "Into the Fire battleplan map" });
  await expect(setupMap).toBeVisible();
  await expect(page.getByText("Score 3 victory points if you control at least 1 objective.")).toBeVisible();

  await page.getByRole("button", { name: "Choose random" }).click();
  const randomMap = page.getByRole("img", { name: /battleplan map$/ });
  await expect(randomMap).toBeVisible();
  await page.getByLabel("Choose battleplan").selectOption({ label: "Into the Fire" });
  await expect(setupMap).toBeVisible();

  const radTactics = page.locator("section").filter({
    has: page.getByRole("heading", { name: /Rad · battle tactics/ }),
  });
  const alexTactics = page.locator("section").filter({
    has: page.getByRole("heading", { name: /Alex · battle tactics/ }),
  });
  await radTactics.getByRole("checkbox", { name: "Blazing Onslaught" }).check();
  await radTactics.getByRole("checkbox", { name: "Siege of Ashes" }).check();
  await alexTactics.getByRole("checkbox", { name: "Flanking Firestorm" }).check();
  await alexTactics.getByRole("checkbox", { name: "Smokescreen" }).check();
  await expect(
    page.getByRole("heading", { name: /Rad · battle tactics/ }),
  ).toHaveText(/2\/2/);
  await expect(
    page.getByRole("heading", { name: /Alex · battle tactics/ }),
  ).toHaveText(/2\/2/);

  await page.getByRole("button", { name: "Start game" }).click();
  await page.waitForURL(/\/battle-record\/.+/);
  await expect(page.getByRole("heading", { name: "Rad vs Alex" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Match score" })).toContainText("Stormcast Eternals");
  await expect(page.getByRole("region", { name: "Match score" })).toContainText("Blades of Khorne");

  await page.getByRole("button", { name: "Rad", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Primary · Into the Fire" })).toBeVisible();
  const pointOne = page.getByRole("button", { name: "Rad scored point 1" });
  await expect(pointOne).toHaveAttribute("aria-pressed", "false");
  await pointOne.click();
  await expect(pointOne).toHaveAttribute("aria-pressed", "true");

  await expect(page.getByRole("heading", { name: "Tactics" })).toBeVisible();
  await expect(page.getByText("Blazing Onslaught")).toBeVisible();
  await page.getByRole("button", { name: "Mark Affray done" }).first().click();
  await expect(page.getByRole("button", { name: "Undo Affray" })).toBeVisible();

  await page.getByRole("button", { name: "T2" }).click();
  await page.getByRole("button", { name: "Alex", exact: true }).click();
  await expect(page.getByText("Double turn")).toBeVisible();

  await page.getByText("Battleplan map").click();
  await expect(
    page.getByRole("img", { name: "Into the Fire battleplan map" }),
  ).toBeVisible();
});
