import { expect, test, type Page } from "@playwright/test";

const LONG_PAGE = "/guides/how-to-build-an-age-of-sigmar-army-list";

async function dismissCookieBanner(page: Page) {
  const reject = page.getByRole("button", { name: "Reject" });
  if (await reject.isVisible()) {
    await reject.click();
  }
}

test.describe("document scroll", () => {
  test("mouse wheel scrolls a long public page", async ({ page }) => {
    await page.goto(LONG_PAGE);
    await dismissCookieBanner(page);
    await expect(
      page.getByRole("heading", {
        name: "How to build an Age of Sigmar army list",
      }),
    ).toBeVisible();

    const metrics = await page.evaluate(() => {
      const html = document.documentElement;
      const body = document.body;
      const htmlStyle = getComputedStyle(html);
      const bodyStyle = getComputedStyle(body);
      return {
        htmlHasHFull: html.classList.contains("h-full"),
        htmlHeight: htmlStyle.height,
        htmlOverflowY: htmlStyle.overflowY,
        bodyOverflowX: bodyStyle.overflowX,
        bodyOverflowY: bodyStyle.overflowY,
        scrollHeight: html.scrollHeight,
        innerHeight: window.innerHeight,
        scrollY: window.scrollY,
      };
    });

    expect(metrics.htmlHasHFull).toBe(false);
    expect(metrics.bodyOverflowY).toBe("visible");
    expect(metrics.bodyOverflowX).not.toBe("hidden");
    expect(metrics.scrollHeight).toBeGreaterThan(metrics.innerHeight + 100);

    await page.mouse.move(400, 360);
    await page.mouse.wheel(0, 900);

    await expect
      .poll(async () => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(80);
  });
});
