import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, BellRing, CheckCircle2, ShieldAlert } from "lucide-react";

import { DataScreen } from "@/components/marketing/data-screen";
import { StatusBadge } from "@/components/marketing/kit";
import { dateTime, num, titleCase } from "@/lib/marketing/format";

export const Route = createFileRoute("/marketing/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts — Software Vala Marketing Manager" },
      {
        name: "description",
        content:
          "Budget overruns, delivery failures and compliance warnings raised across every marketing channel.",
      },
      { property: "og:title", content: "Alerts — Software Vala" },
      {
        property: "og:description",
        content: "Live marketing alert inbox with severity, category and resolution state.",
      },
    ],
  }),
  component: AlertsScreen,
});

const SEVERITIES = ["critical", "high", "medium", "low", "info"] as const;
const STATUSES = ["open", "acknowledged", "resolved", "dismissed"] as const;
const CATEGORIES = ["budget", "performance", "delivery", "compliance", "integration", "automation"] as const;

function AlertsScreen() {
  return (
    <DataScreen
      table="marketing_alerts"
      title="Alerts"
      description="Everything the module flagged that needs a human decision."
      module="Alerts"
      entityLabel="Alert"
      order={{ column: "created_at" }}
      searchKeys={["title", "message", "category", "severity"]}
      filterKey="status"
      filterOptions={STATUSES}
      minWidth={1000}
      stats={[
        { label: "Total alerts", icon: BellRing, tone: "violet", value: (r) => num(r.length) },
        {
          label: "Open",
          icon: AlertTriangle,
          tone: "gold",
          value: (r) => num(r.filter((x) => x.status === "open").length),
        },
        {
          label: "Critical / high",
          icon: ShieldAlert,
          tone: "rose",
          value: (r) => num(r.filter((x) => ["critical", "high"].includes(x.severity)).length),
        },
        {
          label: "Resolved",
          icon: CheckCircle2,
          tone: "green",
          value: (r) => num(r.filter((x) => x.status === "resolved").length),
        },
      ]}
      columns={[
        { key: "title", header: "Alert", render: (r) => <span className="font-medium">{r.title}</span> },
        { key: "severity", header: "Severity", render: (r) => <StatusBadge value={r.severity} /> },
        { key: "category", header: "Category", render: (r) => titleCase(r.category) },
        { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
        { key: "message", header: "Detail", render: (r) => r.message },
        { key: "created_at", header: "Raised", render: (r) => dateTime(r.created_at) },
        { key: "resolved_at", header: "Resolved", render: (r) => (r.resolved_at ? dateTime(r.resolved_at) : "—") },
      ]}
      fields={[
        { key: "title", label: "Title", kind: "text", required: true, full: true },
        { key: "severity", label: "Severity", kind: "select", options: SEVERITIES },
        { key: "category", label: "Category", kind: "select", options: CATEGORIES },
        { key: "status", label: "Status", kind: "select", options: STATUSES },
        { key: "resolved_at", label: "Resolved at", kind: "datetime" },
        { key: "message", label: "Message", kind: "textarea", required: true, full: true },
      ]}
    />
  );
}
