import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Megaphone, Share2 } from "lucide-react";

import { QueryState, ScreenHeader, SectionCard, StatCard, StatusBadge } from "@/components/marketing/kit";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { tableQuery } from "@/lib/marketing/api";
import { dateTime, num, titleCase } from "@/lib/marketing/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/marketing/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — Software Vala Marketing Manager" },
      {
        name: "description",
        content:
          "One calendar for every scheduled campaign send, social post and content publish across channels.",
      },
      { property: "og:title", content: "Calendar — Software Vala" },
      {
        property: "og:description",
        content: "Unified marketing calendar for schedules, social posts and content publishing.",
      },
    ],
  }),
  component: CalendarScreen,
});

type CalendarEvent = {
  id: string;
  date: Date;
  title: string;
  kind: "schedule" | "social" | "content";
  channel: string;
  status: string;
};

const KIND_STYLE: Record<CalendarEvent["kind"], string> = {
  schedule: "bg-primary/15 text-primary ring-primary/30",
  social: "bg-accent-pink/15 text-accent-pink ring-accent-pink/30",
  content: "bg-accent-emerald/15 text-accent-emerald ring-accent-emerald/30",
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

function CalendarScreen() {
  const schedules = useQuery(tableQuery("marketing_schedules", { column: "scheduled_at", ascending: true }));
  const posts = useQuery(tableQuery("marketing_social_posts", { column: "scheduled_at", ascending: true }));
  const content = useQuery(tableQuery("marketing_content_items", { column: "scheduled_for", ascending: true }));

  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [kindFilter, setKindFilter] = useState<"all" | CalendarEvent["kind"]>("all");
  const [selected, setSelected] = useState<Date | null>(null);

  const isLoading = schedules.isLoading || posts.isLoading || content.isLoading;
  const error = schedules.error ?? posts.error ?? content.error;

  const events = useMemo<CalendarEvent[]>(() => {
    const list: CalendarEvent[] = [];
    for (const s of schedules.data ?? []) {
      list.push({
        id: `s-${s.id}`,
        date: new Date(s.scheduled_at),
        title: s.title,
        kind: "schedule",
        channel: s.channel,
        status: s.status,
      });
    }
    for (const p of posts.data ?? []) {
      const when = p.scheduled_at ?? p.published_at;
      if (!when) continue;
      list.push({
        id: `p-${p.id}`,
        date: new Date(when),
        title: p.content.slice(0, 70),
        kind: "social",
        channel: p.platform,
        status: p.status,
      });
    }
    for (const c of content.data ?? []) {
      if (!c.scheduled_for) continue;
      list.push({
        id: `c-${c.id}`,
        date: new Date(c.scheduled_for),
        title: c.title,
        kind: "content",
        channel: c.channel,
        status: c.status,
      });
    }
    return list.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [schedules.data, posts.data, content.data]);

  const visible = kindFilter === "all" ? events : events.filter((e) => e.kind === kindFilter);

  const monthEvents = visible.filter(
    (e) => e.date.getFullYear() === cursor.getFullYear() && e.date.getMonth() === cursor.getMonth(),
  );

  const cells = useMemo(() => {
    const first = startOfMonth(cursor);
    const offset = (first.getDay() + 6) % 7; // Monday-first grid
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const out: Array<Date | null> = Array.from({ length: offset }, () => null);
    for (let d = 1; d <= daysInMonth; d += 1) out.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [cursor]);

  const today = new Date();
  const selectedEvents = selected ? visible.filter((e) => sameDay(e.date, selected)) : [];
  const upcoming = visible.filter((e) => e.date >= today).slice(0, 8);

  return (
    <div className="space-y-6">
      <ScreenHeader
        title="Marketing Calendar"
        description="Every scheduled activation, social post and content publish in one timeline."
        actions={
          <Select value={kindFilter} onValueChange={(v) => setKindFilter(v as typeof kindFilter)}>
            <SelectTrigger className="w-44" aria-label="Filter calendar by type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All activity</SelectItem>
              <SelectItem value="schedule">Schedules</SelectItem>
              <SelectItem value="social">Social posts</SelectItem>
              <SelectItem value="content">Content</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={0} label="This month" value={num(monthEvents.length)} icon={CalendarDays} tone="violet" />
        <StatCard
          index={1}
          label="Scheduled sends"
          value={num(visible.filter((e) => e.kind === "schedule").length)}
          icon={Clock}
          tone="blue"
        />
        <StatCard
          index={2}
          label="Social posts"
          value={num(visible.filter((e) => e.kind === "social").length)}
          icon={Share2}
          tone="rose"
        />
        <StatCard
          index={3}
          label="Content publishes"
          value={num(visible.filter((e) => e.kind === "content").length)}
          icon={Megaphone}
          tone="green"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          className="xl:col-span-2"
          title={cursor.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          description="Click a day to see everything scheduled"
          actions={
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="outline"
                aria-label="Previous month"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setCursor(startOfMonth(new Date()))}>
                Today
              </Button>
              <Button
                size="icon"
                variant="outline"
                aria-label="Next month"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          }
        >
          <QueryState isLoading={isLoading} error={error} data={cells} emptyMessage="No calendar data.">
            {() => (
              <div>
                <div className="grid grid-cols-7 gap-1 pb-2 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {cells.map((day, i) => {
                    if (!day) return <div key={`e-${i}`} className="min-h-[92px] rounded-lg bg-secondary/20" />;
                    const dayEvents = visible.filter((e) => sameDay(e.date, day));
                    const isToday = sameDay(day, today);
                    const isSelected = selected ? sameDay(day, selected) : false;
                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        onClick={() => setSelected(day)}
                        aria-label={`${day.toDateString()}, ${dayEvents.length} items`}
                        className={cn(
                          "min-h-[92px] rounded-lg border border-border/50 bg-secondary/30 p-1.5 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isToday && "border-primary/60",
                          isSelected && "bg-primary/[0.12] border-primary",
                        )}
                      >
                        <span
                          className={cn(
                            "text-xs font-medium",
                            isToday ? "text-primary" : "text-muted-foreground",
                          )}
                        >
                          {day.getDate()}
                        </span>
                        <div className="mt-1 space-y-1">
                          {dayEvents.slice(0, 2).map((e) => (
                            <span
                              key={e.id}
                              className={cn(
                                "block truncate rounded px-1 py-0.5 text-[10px] ring-1",
                                KIND_STYLE[e.kind],
                              )}
                            >
                              {e.title}
                            </span>
                          ))}
                          {dayEvents.length > 2 ? (
                            <span className="block text-[10px] text-muted-foreground">
                              +{dayEvents.length - 2} more
                            </span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </QueryState>
        </SectionCard>

        <SectionCard
          title={selected ? selected.toLocaleDateString("en-IN", { dateStyle: "medium" }) : "Upcoming"}
          description={selected ? "Everything scheduled that day" : "Next activities across channels"}
        >
          <QueryState
            isLoading={isLoading}
            error={error}
            data={selected ? selectedEvents : upcoming}
            emptyMessage={selected ? "Nothing scheduled on this day." : "No upcoming activity scheduled."}
          >
            {(list) => (
              <ul className="space-y-3">
                {list.map((e) => (
                  <li key={e.id} className="rounded-lg border border-border/50 bg-secondary/40 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{e.title}</p>
                      <StatusBadge value={e.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {titleCase(e.kind)} · {e.channel}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{dateTime(e.date.toISOString())}</p>
                  </li>
                ))}
              </ul>
            )}
          </QueryState>
          {selected ? (
            <Button variant="ghost" size="sm" className="mt-3" onClick={() => setSelected(null)}>
              Clear day filter
            </Button>
          ) : null}
        </SectionCard>
      </div>
    </div>
  );
}
