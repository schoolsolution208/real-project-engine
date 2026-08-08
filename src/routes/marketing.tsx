import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowUpRight, Bell, Menu, Search, Settings, Sparkles } from "lucide-react";

import { AppSidebar, useSidebarState } from "@/components/marketing/app-sidebar";
import { marketingNav } from "@/components/marketing/nav";
import { Toaster } from "@/components/ui/sonner";
import { tableQuery } from "@/lib/marketing/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/marketing")({
  component: MarketingLayout,
});

const ICON_BTN =
  "icon3d relative grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted-foreground " +
  "transition-[transform,box-shadow,color,background-color] duration-200 hover:text-foreground active:scale-[0.96] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function MarketingLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useSidebarState();

  const alerts = useQuery(tableQuery("marketing_alerts", { column: "created_at" }));
  const campaigns = useQuery(tableQuery("marketing_campaigns", { column: "spend" }));

  const openAlerts = (alerts.data ?? []).filter((a) => a.status === "open");
  const critical = openAlerts.some((a) => a.severity === "critical");
  const health = critical ? "critical" : openAlerts.length > 0 ? "warning" : "active";
  const liveCampaigns = (campaigns.data ?? []).filter((c) => c.status === "active").length;

  const active =
    [...marketingNav].sort((a, b) => b.to.length - a.to.length).find((item) =>
      item.to === "/marketing" ? pathname === "/marketing" : pathname.startsWith(item.to),
    ) ?? marketingNav[0];

  const Icon = active.icon;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AppSidebar
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        health={health}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="flex h-14 items-center gap-1.5 px-3 lg:px-5">
            <button className={cn(ICON_BTN, "lg:hidden")} onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu className="h-[18px] w-[18px]" />
            </button>

            <div className="min-w-0 lg:hidden">
              <p className="truncate text-sm font-semibold">{active.label}</p>
            </div>

            <div className="hidden min-w-0 items-center gap-2 lg:flex">
              <span className="text-xs text-muted-foreground">Marketing Manager</span>
              <span className="text-xs text-muted-foreground/50">/</span>
              <span className="truncate text-sm font-semibold">{active.label}</span>
            </div>

            <div className="flex-1" />

            <nav className="flex items-center gap-1.5" aria-label="Module actions">
              <button className={ICON_BTN} aria-label="Search">
                <Search className="h-[18px] w-[18px]" />
              </button>
              <button className={ICON_BTN} aria-label={`Alerts (${openAlerts.length})`}>
                <Bell className="h-[18px] w-[18px]" />
                {openAlerts.length > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground ring-2 ring-background">
                    {openAlerts.length > 99 ? "99+" : openAlerts.length}
                  </span>
                )}
              </button>
              <button className={cn(ICON_BTN, "hidden sm:grid")} aria-label="Module settings">
                <Settings className="h-[18px] w-[18px]" />
              </button>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          {/* Screen banner */}
          <section className="hero-surface enter-soft relative overflow-hidden p-5 sm:p-7 lg:p-9">
            <div className="pointer-events-none absolute -top-24 right-[-6rem] h-72 w-72 rounded-full bg-foreground/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-[-2.5rem] h-64 w-64 rounded-full bg-accent-pink/40 blur-3xl" />

            <div className="relative grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div className="min-w-0">
                <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-primary-foreground/25 bg-primary-foreground/15 px-3 py-1 text-[11px] font-medium backdrop-blur">
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Marketing Manager</span>
                </div>
                <h1 className="mt-4 truncate text-2xl font-semibold tracking-tight sm:text-3xl lg:text-[34px]">
                  {active.label}
                </h1>
                <p className="mt-1.5 max-w-2xl text-sm text-primary-foreground/80 sm:text-[15px]">{active.blurb}</p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground px-5 py-2.5 text-sm font-semibold text-primary">
                    {liveCampaigns} live campaigns <ArrowUpRight className="h-4 w-4" />
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 text-[11px] font-medium">
                    <Activity className="h-3 w-3" />
                    {openAlerts.length > 0 ? `${openAlerts.length} open alerts` : "All systems nominal"}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <Outlet />

          <p className="inline-flex w-full items-center justify-center gap-2 text-center text-[11px] text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            Live data · Software Vala Marketing Manager
          </p>
        </main>
      </div>

      <Toaster />
    </div>
  );
}
