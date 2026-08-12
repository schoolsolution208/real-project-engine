"""End-to-end UX flow suite for the Marketing Manager module.

Covers: Dashboard -> Campaigns -> Create/Preview -> Audience -> Channels ->
Schedules -> Approvals -> Campaign detail rollup -> Analytics, plus table UX
(search / sort / pagination / bulk select / column controls), responsive
layouts, and console / network / runtime error capture.

Run:  python3 e2e/marketing.e2e.py
"""
import asyncio, os, sys
from pathlib import Path
from playwright.async_api import async_playwright

BASE = os.environ.get("E2E_BASE_URL", "http://localhost:8080")
OUT = Path("/tmp/browser/marketing"); OUT.mkdir(parents=True, exist_ok=True)

ROUTES = [
    "/marketing", "/marketing/campaigns", "/marketing/campaign-builder",
    "/marketing/hierarchy", "/marketing/schedules", "/marketing/calendar",
    "/marketing/seo", "/marketing/leads", "/marketing/audience",
    "/marketing/lead-sources", "/marketing/offers", "/marketing/targeting",
    "/marketing/content", "/marketing/creatives", "/marketing/performance",
    "/marketing/channels", "/marketing/analytics", "/marketing/ai-automation",
    "/marketing/alerts", "/marketing/approvals", "/marketing/reports",
    "/marketing/audit",
]

results, console_errors, page_errors, net_errors = [], [], [], []

def check(name, ok, detail=""):
    results.append((name, ok, detail))
    print(("PASS  " if ok else "FAIL  ") + name + ((" :: " + detail) if detail else ""))

def attach(page):
    page.on("console", lambda m: console_errors.append(f"{page.url} :: {m.text}") if m.type == "error" else None)
    page.on("pageerror", lambda e: page_errors.append(f"{page.url} :: {e}"))
    page.on("response", lambda r: net_errors.append(f"{r.status} {r.url}") if r.status >= 400 else None)

async def settle(page, ms=900):
    await page.wait_for_load_state("networkidle")
    await page.wait_for_timeout(ms)

async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await ctx.new_page(); attach(page)

        # --- every route renders with a heading and no crash overlay ---
        for r in ROUTES:
            resp = await page.goto(BASE + r, wait_until="domcontentloaded")
            await settle(page, 600)
            status = resp.status if resp else 0
            h1 = await page.locator("h1").first.inner_text() if await page.locator("h1").count() else ""
            body = (await page.inner_text("body"))[:4000]
            crashed = "Unexpected Application Error" in body or "did not match" in body
            check(f"route {r}", status == 200 and bool(h1.strip()) and not crashed,
                  f"status={status} h1={h1!r} crashed={crashed}")

        # --- Dashboard KPIs + charts ---
        await page.goto(BASE + "/marketing", wait_until="domcontentloaded"); await settle(page)
        body = await page.inner_text("body")
        check("dashboard KPI cards", all(k in body for k in ["Spend", "Revenue", "ROAS", "Leads", "Conversions", "CTR"]))
        check("dashboard charts render", await page.locator("svg.recharts-surface").count() >= 2)
        check("dashboard top campaigns table", await page.locator("table tbody tr").count() > 0)
        await page.screenshot(path=str(OUT / "01_dashboard.png"))

        # --- Sidebar navigation: Dashboard -> Campaigns ---
        await page.get_by_role("menuitem", name="Campaigns", exact=True).first.click()
        await settle(page)
        check("nav to campaigns", page.url.endswith("/marketing/campaigns"), page.url)

        # --- Table UX on Campaigns ---
        rows_before = await page.locator("table tbody tr").count()
        check("campaigns rows loaded", rows_before > 0, f"rows={rows_before}")

        search = page.get_by_placeholder("Search", exact=False).last
        await search.fill("zzzz-no-match"); await page.wait_for_timeout(500)
        empty = await page.locator("table tbody tr").count()
        body = await page.inner_text("body")
        check("campaigns search empty state", empty == 0 and ("No " in body or "no results" in body.lower()))
        await search.fill(""); await page.wait_for_timeout(500)
        check("campaigns search reset", await page.locator("table tbody tr").count() == rows_before)

        headers = page.locator("table thead th button")
        if await headers.count():
            first_cell = await page.locator("table tbody tr td").first.inner_text()
            await headers.first.click(); await page.wait_for_timeout(400)
            check("campaigns column sort", (await page.locator("table tbody tr td").first.inner_text()) != first_cell or rows_before == 1)
        else:
            check("campaigns column sort", False, "no sortable header buttons")

        boxes = page.locator("table input[type=checkbox], table [role=checkbox]")
        if await boxes.count():
            await boxes.first.click(); await page.wait_for_timeout(300)
            body = await page.inner_text("body")
            check("campaigns bulk selection bar", "selected" in body.lower())
            await boxes.first.click()
        else:
            check("campaigns bulk selection bar", False, "no row checkboxes")

        cols = page.get_by_role("button", name="Columns", exact=False)
        check("campaigns column controls", await cols.count() > 0)
        await page.screenshot(path=str(OUT / "02_campaigns.png"))

        # --- Create / Preview flow ---
        await page.goto(BASE + "/marketing/campaign-builder", wait_until="domcontentloaded"); await settle(page)
        inputs = await page.locator("input, select, textarea, [role=combobox]").count()
        check("campaign builder form fields", inputs >= 5, f"fields={inputs}")
        name_field = page.locator("input").first
        await name_field.fill("E2E Preview Campaign"); await page.wait_for_timeout(300)
        body = await page.inner_text("body")
        check("campaign builder live preview", "E2E Preview Campaign" in body)
        await page.screenshot(path=str(OUT / "03_builder.png"))

        # --- Audience ---
        await page.goto(BASE + "/marketing/audience", wait_until="domcontentloaded"); await settle(page)
        check("audience segments render", await page.locator("table tbody tr, .recharts-surface").count() > 0)

        # --- Channels: truthful integration states ---
        await page.goto(BASE + "/marketing/channels", wait_until="domcontentloaded"); await settle(page)
        body = await page.inner_text("body")
        check("channels integration state", "Not connected" in body or "Configure integration" in body)
        await page.screenshot(path=str(OUT / "04_channels.png"))

        # --- Schedules ---
        await page.goto(BASE + "/marketing/schedules", wait_until="domcontentloaded"); await settle(page)
        check("schedules rows", await page.locator("table tbody tr").count() > 0)

        # --- Approvals queue ---
        await page.goto(BASE + "/marketing/approvals", wait_until="domcontentloaded"); await settle(page)
        body = await page.inner_text("body")
        check("approvals queue", await page.locator("table tbody tr").count() > 0 and "pending" in body.lower())

        # --- Campaign detail rollup (hierarchy) ---
        await page.goto(BASE + "/marketing/hierarchy", wait_until="domcontentloaded"); await settle(page)
        check("campaign hierarchy rollup", await page.locator("table tbody tr, [role=treeitem]").count() > 0)

        # --- Analytics ---
        await page.goto(BASE + "/marketing/analytics", wait_until="domcontentloaded"); await settle(page)
        check("analytics charts", await page.locator("svg.recharts-surface").count() >= 1)
        await page.screenshot(path=str(OUT / "05_analytics.png"))

        # --- Back navigation + refresh ---
        await page.go_back(); await settle(page, 500)
        check("back navigation", "/marketing/hierarchy" in page.url, page.url)
        await page.reload(wait_until="domcontentloaded"); await settle(page, 500)
        check("refresh keeps route", "/marketing/hierarchy" in page.url and await page.locator("h1").count() > 0)

        # --- Export CSV action exists ---
        await page.goto(BASE + "/marketing/campaigns", wait_until="domcontentloaded"); await settle(page)
        check("export action", await page.get_by_role("button", name="Export", exact=False).count() > 0)

        # --- Responsive: tablet + mobile ---
        for label, w, h in [("tablet", 834, 1112), ("mobile", 390, 844)]:
            rp = await ctx.new_page(); attach(rp)
            await rp.set_viewport_size({"width": w, "height": h})
            await rp.goto(BASE + "/marketing", wait_until="domcontentloaded"); await settle(rp, 700)
            scroll_w = await rp.evaluate("document.documentElement.scrollWidth")
            check(f"{label} no horizontal overflow", scroll_w <= w + 2, f"scrollWidth={scroll_w}")
            if label == "mobile":
                trigger = rp.get_by_role("button", name="Open menu")
                await trigger.click(); await rp.wait_for_timeout(600)
                check("mobile drawer opens", await rp.get_by_role("menuitem", name="Campaigns", exact=True).first.is_visible())
            await rp.screenshot(path=str(OUT / f"06_{label}.png"))
            await rp.close()

        await browser.close()

    ignorable = ("lovable.js", "favicon", "/@vite", "__vite_ping")
    ce = [e for e in console_errors if not any(i in e for i in ignorable)]
    ne = [e for e in net_errors if not any(i in e for i in ignorable)]
    print("\n--- console errors ---"); print("\n".join(ce) or "none")
    print("--- page errors ---"); print("\n".join(page_errors) or "none")
    print("--- network >=400 ---"); print("\n".join(ne) or "none")
    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} checks passed")
    if failed or ce or page_errors or ne:
        sys.exit(1)

asyncio.run(main())
