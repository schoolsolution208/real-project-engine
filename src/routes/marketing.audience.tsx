import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Layers, MapPin, Target, Users } from "lucide-react";

import {
  EmptyState,
  QueryState,
  ScreenHeader,
  SectionCard,
  StatCard,
  StatusBadge,
} from "@/components/marketing/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { tableQuery } from "@/lib/marketing/api";
import { compactInr, num, pct, titleCase, toNum } from "@/lib/marketing/format";

export const Route = createFileRoute("/marketing/audience")({
  head: () => ({
    meta: [
      { title: "Audience — Software Vala Marketing Manager" },
      {
        name: "description",
        content:
          "Segment the live lead base by stage, score, city and source to size every audience before you spend.",
      },
      { property: "og:title", content: "Audience — Software Vala" },
      {
        property: "og:description",
        content: "Live audience segmentation across stage, score band, geography and lead source.",
      },
    ],
  }),
  component: AudienceScreen,
});

const STAGES = ["new", "contacted", "qualified", "demo", "proposal", "won", "lost"] as const;
const SCORE_BANDS = [
  { key: "all", label: "Any score", min: 0, max: 100 },
  { key: "hot", label: "Hot (80-100)", min: 80, max: 100 },
  { key: "warm", label: "Warm (50-79)", min: 50, max: 79 },
  { key: "cold", label: "Cold (0-49)", min: 0, max: 49 },
] as const;

function AudienceScreen() {
  const leads = useQuery(tableQuery("marketing_leads", { column: "created_at" }));
  const sources = useQuery(tableQuery("marketing_lead_sources", { column: "leads_count" }));
  const regions = useQuery(tableQuery("marketing_regions", { column: "leads" }));

  const [stage, setStage] = useState("all");
  const [band, setBand] = useState("all");
  const [state, setState] = useState("all");
  const [source, setSource] = useState("all");
  const [minScore, setMinScore] = useState("");

  const leadRows = leads.data ?? [];
  const sourceName = new Map((sources.data ?? []).map((s) => [s.id, s.name]));

  const states = Array.from(new Set(leadRows.map((l) => l.state).filter(Boolean))) as string[];

  const segment = useMemo(() => {
    const bandDef = SCORE_BANDS.find((b) => b.key === band) ?? SCORE_BANDS[0]!;
    const floor = minScore === "" ? bandDef.min : Math.max(bandDef.min, Number(minScore));
    return leadRows.filter((l) => {
      const score = toNum(l.score);
      if (stage !== "all" && l.stage !== stage) return false;
      if (score < floor || score > bandDef.max) return false;
      if (state !== "all" && l.state !== state) return false;
      if (source !== "all" && (l.source_id ? sourceName.get(l.source_id) : "Direct") !== source) return false;
      return true;
    });
  }, [leadRows, stage, band, state, source, minScore, sourceName]);

  const reach = leadRows.length ? (segment.length / leadRows.length) * 100 : 0;
  const won = segment.filter((l) => l.stage === "won").length;
  const avgScore = segment.length
    ? segment.reduce((s, l) => s + toNum(l.score), 0) / segment.length
    : 0;

  const byCity = Array.from(
    segment.reduce((map, l) => {
      const key = l.city ?? "Unknown";
      map.set(key, (map.get(key) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  )
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const sourceOptions = Array.from(new Set((sources.data ?? []).map((s) => s.name)));

  return (
    <div className="space-y-6">
      <ScreenHeader
        title="Audience"
        description="Build and size a segment from the live lead base before committing budget."
        actions={
          <Button
            variant="outline"
            onClick={() => {
              setStage("all");
              setBand("all");
              setState("all");
              setSource("all");
              setMinScore("");
            }}
          >
            Reset segment
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={0} label="Segment size" value={num(segment.length)} sublabel={`of ${num(leadRows.length)} leads`} icon={Users} tone="violet" />
        <StatCard index={1} label="Share of base" value={pct(reach)} icon={Layers} tone="blue" />
        <StatCard index={2} label="Average score" value={avgScore.toFixed(0)} icon={Target} tone="gold" />
        <StatCard
          index={3}
          label="Closed won"
          value={num(won)}
          sublabel={segment.length ? `${pct((won / segment.length) * 100)} win rate` : "—"}
          icon={MapPin}
          tone="green"
        />
      </div>

      <SectionCard title="Segment builder" description="Filters apply live against the lead table">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-1.5">
            <Label htmlFor="seg-stage">Funnel stage</Label>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger id="seg-stage"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stages</SelectItem>
                {STAGES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="seg-band">Score band</Label>
            <Select value={band} onValueChange={setBand}>
              <SelectTrigger id="seg-band"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SCORE_BANDS.map((b) => (
                  <SelectItem key={b.key} value={b.key}>{b.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="seg-state">State</Label>
            <Select value={state} onValueChange={setState}>
              <SelectTrigger id="seg-state"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All states</SelectItem>
                {states.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="seg-source">Lead source</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger id="seg-source"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                {sourceOptions.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="seg-score">Minimum score</Label>
            <Input
              id="seg-score"
              type="number"
              min={0}
              max={100}
              value={minScore}
              placeholder="0"
              onChange={(e) => setMinScore(e.target.value)}
            />
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard className="xl:col-span-2" title="Matching leads" description="First 25 leads in this segment">
          <QueryState
            isLoading={leads.isLoading}
            error={leads.error}
            data={segment.slice(0, 25)}
            emptyMessage="No leads match this segment. Loosen a filter to widen reach."
          >
            {(list) => (
              <div className="overflow-x-auto">
                <Table style={{ minWidth: 800 }}>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lead</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{l.full_name}</TableCell>
                        <TableCell>{l.company ?? "—"}</TableCell>
                        <TableCell>{l.city ?? "—"}</TableCell>
                        <TableCell><StatusBadge value={l.stage} /></TableCell>
                        <TableCell className="text-right">{num(l.score)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {l.source_id ? (sourceName.get(l.source_id) ?? "—") : "Direct"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </QueryState>
        </SectionCard>

        <SectionCard title="Top cities in segment" description="Where this audience actually sits">
          {byCity.length === 0 ? (
            <EmptyState message="No geography available for this segment." icon={MapPin} />
          ) : (
            <ul className="space-y-2">
              {byCity.map((c) => (
                <li key={c.city} className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2 text-sm">
                  <span>{c.city}</span>
                  <span className="font-medium">{num(c.count)}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Regional reach" description="Recorded spend and outcomes by region">
        <QueryState
          isLoading={regions.isLoading}
          error={regions.error}
          data={regions.data ?? []}
          emptyMessage="No regional records yet."
        >
          {(list) => (
            <div className="overflow-x-auto">
              <Table style={{ minWidth: 800 }}>
                <TableHeader>
                  <TableRow>
                    <TableHead>Region</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead className="text-right">Leads</TableHead>
                    <TableHead className="text-right">Conversions</TableHead>
                    <TableHead className="text-right">Spend</TableHead>
                    <TableHead className="text-right">Growth</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.state ?? titleCase(r.country)}</TableCell>
                      <TableCell className="text-right">{num(r.leads)}</TableCell>
                      <TableCell className="text-right">{num(r.conversions)}</TableCell>
                      <TableCell className="text-right">{compactInr(toNum(r.spend))}</TableCell>
                      <TableCell className="text-right">{pct(toNum(r.growth_rate))}</TableCell>
                      <TableCell><StatusBadge value={r.status} /></TableCell>
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
