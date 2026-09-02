import { expect, test } from "@playwright/test";

const pages: Array<{ path: string; heading: string | RegExp }> = [
  { path: "/", heading: /Free AoS list builder for Age of Sigmar 4th/i },
  { path: "/factions", heading: "Age of Sigmar 4th edition factions" },
  {
    path: "/factions/stormcast-eternals",
    heading: /Stormcast Eternals/i,
  },
  { path: "/faq", heading: "Age of Sigmar army builder questions" },
  { path: "/try", heading: /Free AoS list builder for Age of Sigmar 4th/i },
  { path: "/play", heading: "Age of Sigmar wound tracker: Play mode" },
  { path: "/about", heading: "A free Age of Sigmar hobby helper" },
  { path: "/updates", heading: "What's new in Order of Battle" },
  {
    path: "/compare",
    heading: "Which Age of Sigmar army builder should you use?",
  },
  { path: "/guides", heading: "Age of Sigmar army builder guides" },
  {
    path: "/guides/how-to-build-an-age-of-sigmar-army-list",
    heading: "How to build an Age of Sigmar army list",
  },
  {
    path: "/guides/free-age-of-sigmar-army-builder",
    heading: "Free Age of Sigmar army builder",
  },
  { path: "/privacy", heading: "Privacy policy" },
  { path: "/terms", heading: "Terms of use" },
];

test.describe("public pages", () => {
  for (const { path, heading } of pages) {
    test(`loads ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible();
    });
  }
});
