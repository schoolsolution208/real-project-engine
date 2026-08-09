"""End-to-end tests for the marketing sidebar (collapse/expand, search, keyboard nav).

Run:  python3 e2e/sidebar.e2e.py [base_url]
Requires Playwright with Chromium installed.
"""
import asyncio, sys
from playwright.async_api import async_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080"
results = []

def check(name, cond, detail=""):
    results.append((name, bool(cond), detail))
    print(("PASS " if cond else "FAIL ") + name + ((" :: " + str(detail)) if detail else ""))

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        ctx = await b.new_context(viewport={"width": 1280, "height": 1800})
        page = await ctx.new_page()
        await page.goto(f"{BASE}/marketing", wait_until="domcontentloaded")
        aside = page.locator("aside").first
        await aside.wait_for()

        # 1. expanded width
        w = (await aside.bounding_box())["width"]
        check("sidebar expanded ~264px", 260 <= w <= 270, w)

        # 2. collapse via Ctrl+B
        await page.keyboard.press("Control+b")
        await page.wait_for_timeout(400)
        w = (await aside.bounding_box())["width"]
        check("collapse shortcut -> ~72px", 68 <= w <= 76, w)

        # 3. persistence across reload
        await page.reload(wait_until="domcontentloaded")
        await page.wait_for_timeout(400)
        w = (await page.locator("aside").first.bounding_box())["width"]
        check("collapsed state persists after reload", 68 <= w <= 76, w)

        # 4. Ctrl+K expands and focuses search
        await page.keyboard.press("Control+k")
        await page.wait_for_timeout(400)
        focused = await page.evaluate("document.activeElement?.getAttribute('aria-label')")
        check("Ctrl+K focuses search", focused == "Search screens", focused)

        # 5. search filters nav
        search = page.get_by_label("Search screens")
        await search.fill("camp")
        await page.wait_for_timeout(200)
        labels = await page.locator("#marketing-sidebar-nav [data-nav-focusable]").all_inner_texts()
        check("search filters results", any("Campaign" in l for l in labels) and len(labels) < 20, len(labels))

        # 6. ArrowDown moves focus into nav, Enter navigates
        await search.press("ArrowDown")
        await page.wait_for_timeout(150)
        tag = await page.evaluate("document.activeElement?.tagName")
        check("ArrowDown moves focus into nav", tag == "A", tag)
        await page.keyboard.press("ArrowDown")
        await page.keyboard.press("Enter")
        await page.wait_for_timeout(600)
        check("Enter navigates to a marketing route", "/marketing" in page.url, page.url)

        # 7. active route highlighting
        current = await page.locator('#marketing-sidebar-nav [aria-current="page"]').count()
        check("active route has aria-current", current >= 1, current)

        # 8. Escape clears search, focus stays in input
        await page.keyboard.press("Control+k")
        await page.wait_for_timeout(200)
        await page.get_by_label("Search screens").fill("seo")
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(150)
        val = await page.get_by_label("Search screens").input_value()
        focused = await page.evaluate("document.activeElement?.getAttribute('aria-label')")
        check("Escape clears query and keeps focus", val == "" and focused == "Search screens", (val, focused))

        # 9. group expand state persists
        grp = page.locator('#marketing-sidebar-nav button[aria-expanded]').first
        before = await grp.get_attribute("aria-expanded")
        await grp.click()
        await page.wait_for_timeout(200)
        await page.reload(wait_until="domcontentloaded")
        await page.wait_for_timeout(500)
        after = await page.locator('#marketing-sidebar-nav button[aria-expanded]').first.get_attribute("aria-expanded")
        check("group expansion persists across reload", after != before, (before, after))

        # 10. ARIA roles present
        role = await page.locator("#marketing-sidebar-nav").get_attribute("role")
        check("nav exposes menu role", role == "menu", role)

        await b.close()
    failed = [r for r in results if not r[1]]
    print(f"\n{len(results)-len(failed)}/{len(results)} passed")
    sys.exit(1 if failed else 0)

asyncio.run(main())
