import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, Layers, Radio, Wallet } from "lucide-react";

import {
  NotConnected,
  ProgressBar,
  QueryState,
  ScreenHeader,
  SectionCard,
  StatCard,
  StatusBadge,
} from "@/components/marketing/kit";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { tableQuery } from "@/lib/marketing/api";
import { compactInr, compactNum, ctr, num, pct, roas, toNum } from "@/lib/marketing/format";

export const Route = createFileRoute("/marketing/channels")({
  head: () => ({
    meta: [
      { title: "Channels — Software Vala Marketing Manager" },
      {
        name: "description",
        content:
          "Per-channel spend, delivery and return with a truthful view of which ad platforms are API-connected.",
      },
      { property: "og:title", content: "Channels — Software Vala" },
      {
        property: "og:description",
        content: "Channel-level spend, ROAS and integration status across every marketing platform.",
      },
    ],
  }),
  component: ChannelsScreen,
});

function ChannelsScreen() {
  const perf = useQuery(tableQuery("marketing_channel_performance", { column: "spend" }));
  const campaigns = useQuery(tableQuery("marketing_campaigns", { column: "spend" }));

  const perfRows = perf.data ?? [];
  const campaignRows = campaigns.data ?? [];

  const totals = perfRows.reduce(
    (acc, r) => ({
      spend: acc.spend + toNum(r.spend),
      revenue: acc.revenue + toNum(r.revenue),
      clicks: acc.clicks + toNum(r.clicks),
      impressions: acc.impressions + toNum(r.impressions),
    }),
    { spend: 0, revenue: 0, clicks: 0, impressions: 0 },
  );

  const maxSpend = Math.max(1, ...perfRows.map((r) => toNum(r.spend)));

  const channelCards = perfRows.map((r) => ({
    ...r,
    campaigns: campaignRows.filter((c) => c.channel === r.channel).length,
    activeCampaigns: campaignRows.filter((c) => c.channel === r.channel && c.status === "active").length,
  }));

  return (
    <div className="space-y-6">
      <ScreenHeader
        title="Channels"
        description="Spend, delivery and return for every channel, plus platform integration status."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={0} label="Channels live" value={num(perfRows.length)} icon={Radio} tone="violet" />
        <StatCard index={1} label="Total spend" value={compactInr(totals.spend)} icon={Wallet} tone="blue" />
        <StatCard
          index={2}
          label="Blended ROAS"
          value={`${roas(totals.revenue, totals.spend).toFixed(2)}x`}
          sublabel={compactInr(totals.revenue)}
          icon={Activity}
          tone="green"
        />
        <StatCard
          index={3}
          label="Blended CTR"
          value={pct(ctr(totals.clicks, totals.impressions), 2)}
          sublabel={`${compactNum(totals.clicks)} clicks`}
          icon={Layers}
          tone="gold"
        />
      </div>

      <SectionCard title="Channel scorecard" description="Spend share, delivery and return by channel">
        <QueryState
          isLoading={perf.isLoading}
          error={perf.error}
          data={channelCards}
          emptyMessage="No channel performance recorded yet."
        >
          {(data) => (
            <div className="overflow-x-auto">
              <Table style={{ minWidth: 1000 }}>
                <TableHeader>
                  <TableRow>
                    <TableHead>Channel</TableHead>
                    <TableHead>Spend share</TableHead>
                    <TableHead className="text-right">Spend</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">ROAS</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead className="text-right">Conversions</TableHead>
                    <TableHead className="text-right">Campaigns</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.channel}</TableCell>
                      <TableCell className="w-48">
                        <ProgressBar value={toNum(c.spend)} max={maxSpend} tone="blue" />
                      </TableCell>
                      <TableCell className="text-right">{compactInr(toNum(c.spend))}</TableCell>
                      <TableCell className="text-right">{compactInr(toNum(c.revenue))}</TableCell>
                      <TableCell className="text-right font-medium text-status-success">
                        {roas(toNum(c.revenue), toNum(c.spend)).toFixed(2)}x
                      </TableCell>
                      <TableCell className="text-right">{pct(ctr(c.clicks, c.impressions), 2)}</TableCell>
                      <TableCell className="text-right">{compactNum(toNum(c.conversions))}</TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center gap-2">
                          {num(c.campaigns)}
                          {c.activeCampaigns > 0 ? <StatusBadge value="active" /> : null}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </QueryState>
      </SectionCard>

      <SectionCard
        title="Platform integrations"
        description="Live API sync status — nothing here is simulated"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {PLATFORMS.map((p) => (
            <NotConnected key={p.name} name={p.name} reason={p.reason} />
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Channel numbers above come from records stored in this workspace. Direct platform sync stays
          switched off until each ad account is authorised, so no figure on this page is estimated or
          back-filled by an integration.
        </p>
      </SectionCard>
    </div>
  );
}

const PLATFORMS = [
  { name: "Google Ads", reason: "No Google Ads account is authorised for this workspace yet." },
  { name: "Meta Ads", reason: "Meta Business account not linked — spend is entered manually." },
  { name: "LinkedIn Ads", reason: "LinkedIn campaign manager access has not been granted." },
  { name: "YouTube", reason: "Shares the Google Ads authorisation, which is not connected." },
  { name: "WhatsApp Business", reason: "WhatsApp Business API sender is not provisioned." },
  { name: "Email / SMS gateway", reason: "No transactional provider configured for this module." },
] as const;
