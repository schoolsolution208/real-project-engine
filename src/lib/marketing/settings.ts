import { useCallback, useEffect, useState } from "react";

/**
 * Marketing module configuration.
 *
 * There is no marketing_settings table in the current schema, so these
 * preferences are persisted per-device in localStorage. The Settings screen
 * states this explicitly — nothing here pretends to be a synced backend value.
 */
export type MarketingSettings = {
  defaultChannel: string;
  defaultObjective: string;
  defaultRegion: string;
  defaultCurrency: "INR";
  attributionModel: "last_touch" | "first_touch" | "linear" | "position_based";
  attributionWindowDays: number;
  utmSource: string;
  utmMedium: string;
  utmCampaignPattern: string;
  notifyBudgetOverrun: boolean;
  notifyCampaignFailure: boolean;
  notifyApprovalRequests: boolean;
  notifyAutomationFailures: boolean;
  requireApprovalForLaunch: boolean;
  budgetWarningPercent: number;
};

export const DEFAULT_SETTINGS: MarketingSettings = {
  defaultChannel: "Google Ads",
  defaultObjective: "lead_generation",
  defaultRegion: "India",
  defaultCurrency: "INR",
  attributionModel: "last_touch",
  attributionWindowDays: 30,
  utmSource: "softwarevala",
  utmMedium: "cpc",
  utmCampaignPattern: "{code}-{channel}",
  notifyBudgetOverrun: true,
  notifyCampaignFailure: true,
  notifyApprovalRequests: true,
  notifyAutomationFailures: true,
  requireApprovalForLaunch: true,
  budgetWarningPercent: 85,
};

const KEY = "sv:marketing:settings";

export function readSettings(): MarketingSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<MarketingSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useMarketingSettings() {
  const [settings, setSettings] = useState<MarketingSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSettings(readSettings());
    setHydrated(true);
  }, []);

  const save = useCallback((next: MarketingSettings) => {
    setSettings(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable (private mode) — values stay in memory only */
    }
  }, []);

  const reset = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { settings, save, reset, hydrated };
}

/** Builds a UTM query string from the configured defaults. */
export function buildUtm(settings: MarketingSettings, campaign: { code?: string | null; channel?: string | null }) {
  const name = settings.utmCampaignPattern
    .replace("{code}", campaign.code ?? "")
    .replace("{channel}", (campaign.channel ?? "").toLowerCase().replace(/\s+/g, "-"));
  const params = new URLSearchParams({
    utm_source: settings.utmSource,
    utm_medium: settings.utmMedium,
    utm_campaign: name,
  });
  return `?${params.toString()}`;
}
