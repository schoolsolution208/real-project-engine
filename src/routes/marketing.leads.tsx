import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Flame, Target, UserCheck, Users } from "lucide-react";

import { DataScreen } from "@/components/marketing/data-screen";
import {
  CHART_COLORS,
  QueryState,
  SectionCard,
  StatusBadge,
  chartAxisProps,
  chartTooltipStyle,
} from "@/components/marketing/kit";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { tableQuery } from "@/lib/marketing/api";
import type { Row } from "@/lib/marketing/api";
import { num, pct, shortDate, titleCase } from "@/lib/marketing/format";

export const Route = createFileRoute("/marketing/leads")({
  head: () => ({
    meta: [
      { title: "Leads — Software Vala Marketing Manager" },
      {
        name: "description",
        content:
          "Every marketing lead with score, funnel stage, owner and source attribution across campaigns and regions.",
      },
      { property: "og:title", content: "Leads — Software Vala" },
      {
        property: "og:description",
        content: "Lead pipeline with scoring, stage progression and source attribution.",
      },
    ],
  }),
  component: LeadsScreen,
});

const STAGES = ["new", "contacted", "qualified", "demo", "proposal", "won", "lost"] as const;
const STATUSES = ["open", "working", "nurturing", "converted", "disqualified"] as const;

function LeadsScreen() {
  return (
    <DataScreen
      table="marketing_leads"
      title="Leads"
      description="Pipeline of every captured lead with score, stage and attribution."
      module="Leads"
      entityLabel="Lead"
      order={{ column: "created_at" }}
      searchKeys={["full_name", "email", "company", "city", "assigned_to", "stage"]}
      filterKey="stage"
      filterOptions={STAGES}
      minWidth={1150}
      stats={[
        { label: "Total leads", icon: Users, tone: "violet", value: (r) => num(r.length) },
        {
          label: "Qualified+",
          icon: UserCheck,
          tone: "blue",
          value: (r) =>
            num(r.filter((x) => ["qualified", "demo", "proposal", "won"].includes(x.stage)).length),
        },
        {
          label: "Won",
          icon: Target,
          tone: "green",
          value: (r) => num(r.filter((x) => x.stage === "won").length),
          sublabel: (r) =>
            r.length ? `${pct((r.filter((x) => x.stage === "won").length / r.length) * 100)} close rate` : "—",
        },
        {
          label: "Hot (score 80+)",
          icon: Flame,
          tone: "rose",
          value: (r) => num(r.filter((x) => Number(x.score) >= 80).length),
        },
      ]}
      columns={[
        { key: "full_name", header: "Lead", render: (r) => <span className="font-medium">{r.full_name}</span> },
        { key: "company", header: "Company", render: (r) => r.company ?? "—" },
        { key: "email", header: "Email", render: (r) => r.email ?? "—" },
        { key: "phone", header: "Phone", render: (r) => r.phone ?? "—" },
        { key: "score", header: "Score", align: "right", render: (r) => num(r.score) },
        { key: "stage", header: "Stage", render: (r) => <StatusBadge value={r.stage} /> },
        { key: "status", header: "Status", render: (r) => titleCase(r.status) },
        { key: "city", header: "City", render: (r) => r.city ?? "—" },
        { key: "assigned_to", header: "Owner", render: (r) => r.assigned_to ?? "Unassigned" },
        { key: "created_at", header: "Captured", render: (r) => shortDate(r.created_at) },
      ]}
      fields={[
        { key: "full_name", label: "Full name", kind: "text", required: true },
        { key: "company", label: "Company", kind: "text" },
        { key: "email", label: "Email", kind: "text" },
        { key: "phone", label: "Phone", kind: "text" },
        { key: "score", label: "Score (0-100)", kind: "number" },
        { key: "stage", label: "Stage", kind: "select", options: STAGES },
        { key: "status", label: "Status", kind: "select", options: STATUSES },
        { key: "city", label: "City", kind: "text" },
        { key: "state", label: "State", kind: "text" },
        { key: "assigned_to", label: "Assigned to", kind: "text" },
      ]}
      extra={(rows) => <LeadInsights rows={rows} />}
    />
  );
}

function LeadInsights({ rows }: { rows: Row<"marketing_leads">[] }) {
  const sources = useQuery(tableQuery("marketing_lead_sources", { column: "leads_count" }));
  const campaigns = useQuery(tableQuery("marketing_campaigns", { column: "leads" }));

  const funnel = STAGES.map((stage, i) => ({
    stage: titleCase(stage),
    leads: rows.filter((r) => r.stage === stage).length,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const sourceName = new Map((sources.data ?? []).map((s) => [s.id, s.name]));
  const campaignName = new Map((campaigns.data ?? []).map((c) => [c.id, c.name]));

  const attribution = Array.from(
    rows.reduce((map, r) => {
      const key = r.source_id ? (sourceName.get(r.source_id) ?? "Unknown source") : "Direct / unattributed";
      const entry = map.get(key) ?? { source: key, leads: 0, won: 0, campaigns: new Set<string>() };
      entry.leads += 1;
      if (r.stage === "won") entry.won += 1;
      if (r.campaign_id) entry.campaigns.add(campaignName.get(r.campaign_id) ?? "—");
      map.set(key, entry);
      return map;
    }, new Map<string, { source: string; leads: number; won: number; campaigns: Set<string> }>()).values(),
  ).sort((a, b) => b.leads - a.leads);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <SectionCard title="Funnel by stage" description="Live stage distribution of every lead">
        <QueryState isLoading={false} error={null} data={funnel.filter((f) => f.leads > 0)} emptyMessage="No leads captured yet.">
          {(data) => (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" {...chartAxisProps} />
                <YAxis type="category" dataKey="stage" width={90} {...chartAxisProps} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="leads" name="Leads" fill={CHART_COLORS[0]} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </QueryState>
      </SectionCard>

      <SectionCard title="Source attribution" description="Leads and closed-won by originating source">
        <QueryState
          isLoading={sources.isLoading}
          error={sources.error}
          data={attribution}
          emptyMessage="No attributed leads yet."
        >
          {(data) => (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Leads</TableHead>
                    <TableHead className="text-right">Won</TableHead>
                    <TableHead className="text-right">Win rate</TableHead>
                    <TableHead className="text-right">Campaigns</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((a) => (
                    <TableRow key={a.source}>
                      <TableCell className="font-medium">{a.source}</TableCell>
                      <TableCell className="text-right">{num(a.leads)}</TableCell>
                      <TableCell className="text-right">{num(a.won)}</TableCell>
                      <TableCell className="text-right">{pct((a.won / a.leads) * 100)}</TableCell>
                      <TableCell className="text-right">{num(a.campaigns.size)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </QueryState>
      </SectionCard>
    </div>
  );
}
