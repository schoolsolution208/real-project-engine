import {
  Activity,
  Bell,
  Brain,
  Calendar,
  CalendarRange,
  CheckCircle,
  FileText,
  Gift,
  Image,
  Layers,
  LayoutDashboard,
  MapPin,
  Megaphone,
  Radio,
  Search,
  Shield,
  Target,
  TrendingUp,
  UserSquare2,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type MarketingNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Short line shown in the page banner. */
  blurb: string;
};

export type MarketingNavGroup = {
  label: string;
  items: MarketingNavItem[];
};

export const primaryNav: MarketingNavItem[] = [
  {
    to: "/marketing",
    label: "Overview",
    icon: LayoutDashboard,
    blurb: "Live spend, leads, conversions and ROAS across every active campaign.",
  },
];

export const navGroups: MarketingNavGroup[] = [
  {
    label: "Campaigns",
    items: [
      { to: "/marketing/campaigns", label: "Campaigns", icon: Megaphone, blurb: "Every live, paused and scheduled campaign with budget pacing and delivery health." },
      { to: "/marketing/campaign-builder", label: "Campaign Builder", icon: Target, blurb: "Compose a new campaign: objective, budget, channels, targeting and creative." },
      { to: "/marketing/hierarchy", label: "Campaign Hierarchy", icon: Layers, blurb: "Campaign → ad group → creative structure with rollup performance." },
      { to: "/marketing/schedules", label: "Schedules", icon: Calendar, blurb: "Flight dates, dayparting and always-on rotations for each channel." },
      { to: "/marketing/calendar", label: "Calendar", icon: CalendarRange, blurb: "Every scheduled send, social post and content publish on one timeline." },
    ],
  },
  {
    label: "Growth",
    items: [
      { to: "/marketing/seo", label: "SEO Management", icon: Search, blurb: "Keyword ranks, page health and organic growth opportunities." },
      { to: "/marketing/leads", label: "Leads", icon: Users, blurb: "Every captured lead with score, funnel stage, owner and attribution." },
      { to: "/marketing/audience", label: "Audience", icon: UserSquare2, blurb: "Segment the live lead base by stage, score, geography and source." },
      { to: "/marketing/lead-sources", label: "Lead Sources", icon: Users, blurb: "Where every lead comes from, with quality and conversion by source." },
      { to: "/marketing/offers", label: "Offers & Festivals", icon: Gift, blurb: "Seasonal offers, festival pushes and promo codes across regions." },
      { to: "/marketing/targeting", label: "Location Targeting", icon: MapPin, blurb: "Geo coverage, city-level bids and regional spend distribution." },
    ],
  },
  {
    label: "Content",
    items: [
      { to: "/marketing/content", label: "Content Library", icon: Image, blurb: "Approved copy, posts and long-form assets ready for distribution." },
      { to: "/marketing/creatives", label: "Creatives Library", icon: Image, blurb: "Every creative variant with format, channel and performance tags." },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { to: "/marketing/performance", label: "Performance", icon: Activity, blurb: "Channel-level delivery: impressions, clicks, CTR, CPL and pacing." },
      { to: "/marketing/channels", label: "Channels", icon: Radio, blurb: "Per-channel spend, return and live platform integration status." },
      { to: "/marketing/analytics", label: "ROI Analytics", icon: TrendingUp, blurb: "Revenue attribution, ROAS trends and payback across the funnel." },
      { to: "/marketing/ai-automation", label: "AI Automation", icon: Brain, blurb: "Automated rules and AI recommendations acting on live campaign signals." },
    ],
  },
  {
    label: "Governance",
    items: [
      { to: "/marketing/alerts", label: "Alerts", icon: Bell, blurb: "Budget, delivery and compliance warnings that need a decision." },
      { to: "/marketing/approvals", label: "Approvals", icon: CheckCircle, blurb: "Pending sign-offs for budgets, creatives and campaign launches." },
      { to: "/marketing/reports", label: "Reports", icon: FileText, blurb: "Scheduled and on-demand reporting packs for stakeholders." },
      { to: "/marketing/audit", label: "Audit", icon: Shield, blurb: "Full change history and compliance records for the marketing module." },
    ],
  },
];

export const marketingNav: MarketingNavItem[] = [
  ...primaryNav,
  ...navGroups.flatMap((g) => g.items),
];
