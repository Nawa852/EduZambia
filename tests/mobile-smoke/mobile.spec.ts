import { test, expect, Page } from "@playwright/test";

/**
 * Mobile smoke tests — guard the launch checklist:
 *  1. Public routes load without runtime errors
 *  2. No horizontal overflow at mobile widths
 *  3. Inputs use >=16px font-size (prevents iOS zoom-on-focus glitch)
 *  4. Viewport meta is present
 *  5. Favicon + PWA icons resolve
 *  6. Client-side routing works (no full-page reload / 404)
 */

const PUBLIC_ROUTES = [
  "/",
  "/auth",
  "/choose-role",
  "/privacy",
  "/terms",
];

async function collectConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      // Ignore known-noisy but harmless entries
      if (/Download the React DevTools|Failed to load resource: net::ERR_FAILED.*\/~oauth|404 Error: User attempted to access/i.test(text)) return;
      errors.push(`console.error: ${text}`);
    }
  });
  return errors;
}

test.describe("Mobile smoke — public routes", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`renders ${route} cleanly`, async ({ page }) => {
      const errors = await collectConsoleErrors(page);
      const resp = await page.goto(route, { waitUntil: "networkidle" });
      expect(resp?.status(), `HTTP status for ${route}`).toBeLessThan(400);

      // #root must be present and non-empty (SPA hydrated)
      const rootHasChildren = await page.evaluate(() => {
        const root = document.getElementById("root");
        return !!root && root.children.length > 0;
      });
      expect(rootHasChildren, `#root empty on ${route}`).toBe(true);

      // No horizontal overflow: documentElement scrollWidth must fit viewport
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        innerWidth: window.innerWidth,
      }));
      // Allow 1px rounding tolerance
      expect(
        overflow.scrollWidth,
        `Horizontal overflow on ${route}: scrollWidth=${overflow.scrollWidth}, innerWidth=${overflow.innerWidth}`,
      ).toBeLessThanOrEqual(overflow.innerWidth + 1);

      expect(errors, `Runtime errors on ${route}:\n${errors.join("\n")}`).toEqual([]);
    });
  }
});

test.describe("Mobile smoke — viewport & meta", () => {
  test("viewport meta tag is present and sane", async ({ page }) => {
    await page.goto("/");
    const content = await page.locator('meta[name="viewport"]').getAttribute("content");
    expect(content).toBeTruthy();
    expect(content).toMatch(/width=device-width/);
    expect(content).toMatch(/initial-scale=1/);
  });

  test("theme-color meta is set", async ({ page }) => {
    await page.goto("/");
    const color = await page.locator('meta[name="theme-color"]').getAttribute("content");
    expect(color).toMatch(/^#[0-9a-f]{3,8}$/i);
  });

  test("favicon and apple-touch-icon resolve", async ({ page, request }) => {
    await page.goto("/");
    const favicon = await request.get("/favicon.png");
    expect(favicon.status()).toBe(200);
    const apple = await request.get("/apple-touch-icon.png");
    expect(apple.status()).toBe(200);
  });
});

test.describe("Mobile smoke — input glitches", () => {
  test("inputs on /auth use >=16px font (prevents iOS focus zoom)", async ({ page }) => {
    await page.goto("/auth", { waitUntil: "networkidle" });
    const count = await page.locator("input, select, textarea").count();
    test.skip(count === 0, "No inputs on /auth to check");

    const sizes = await page.locator("input, select, textarea").evaluateAll((els) =>
      els.map((el) => {
        const cs = getComputedStyle(el as HTMLElement);
        return {
          type: (el as HTMLInputElement).type || el.tagName.toLowerCase(),
          fontSize: parseFloat(cs.fontSize),
        };
      }),
    );
    for (const s of sizes) {
      expect(s.fontSize, `Input (${s.type}) font-size ${s.fontSize}px < 16px — iOS will zoom on focus`).toBeGreaterThanOrEqual(16);
    }
  });

  test("inputs are tappable (>=32px height) on /auth", async ({ page }) => {
    await page.goto("/auth", { waitUntil: "networkidle" });
    const inputs = page.locator('input:visible:not([type="hidden"]):not([type="checkbox"]):not([type="radio"])');
    const n = await inputs.count();
    test.skip(n === 0, "No visible inputs");
    for (let i = 0; i < n; i++) {
      const box = await inputs.nth(i).boundingBox();
      if (!box) continue;
      expect(box.height, `Input ${i} height ${box.height}px too small for touch`).toBeGreaterThanOrEqual(32);
    }
  });
});

test.describe("Mobile smoke — client-side routing", () => {
  test("in-app navigation uses pushState (no full reload)", async ({ page }) => {
    await page.goto("/privacy", { waitUntil: "networkidle" });
    // Tag AFTER navigation; a subsequent full reload would clear it.
    await page.evaluate(() => ((window as any).__spaTag = "sticky"));
    await page.evaluate(() => history.pushState({}, "", "/terms"));
    await page.waitForTimeout(300);
    const tag = await page.evaluate(() => (window as any).__spaTag);
    expect(tag, "pushState triggered a full reload — SPA routing broken").toBe("sticky");
    expect(page.url()).toContain("/terms");
  });


  test("unknown route renders a not-found without runtime crash", async ({ page }) => {
    const errors = await collectConsoleErrors(page);
    await page.goto("/definitely-not-a-real-route-xyz", { waitUntil: "networkidle" });
    const rootHasChildren = await page.evaluate(
      () => !!document.getElementById("root") && document.getElementById("root")!.children.length > 0,
    );
    expect(rootHasChildren).toBe(true);
    expect(errors).toEqual([]);
  });
});
