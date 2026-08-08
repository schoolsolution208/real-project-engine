CREATE TABLE public.marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  channel text NOT NULL,
  objective text NOT NULL DEFAULT 'Lead Generation',
  status text NOT NULL DEFAULT 'draft',
  start_date date NOT NULL,
  end_date date NOT NULL,
  budget numeric NOT NULL DEFAULT 0,
  spend numeric NOT NULL DEFAULT 0,
  impressions bigint NOT NULL DEFAULT 0,
  clicks bigint NOT NULL DEFAULT 0,
  conversions bigint NOT NULL DEFAULT 0,
  leads bigint NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  kpi_target text,
  region text,
  owner text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.marketing_ad_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  name text NOT NULL,
  level text NOT NULL DEFAULT 'ad_group',
  platform text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  budget numeric NOT NULL DEFAULT 0,
  spend numeric NOT NULL DEFAULT 0,
  impressions bigint NOT NULL DEFAULT 0,
  clicks bigint NOT NULL DEFAULT 0,
  conversions bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.marketing_creatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  asset_type text NOT NULL,
  format text NOT NULL,
  campaign_id uuid REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft',
  dimensions text,
  tags text[] NOT NULL DEFAULT '{}',
  uploaded_by text,
  performance_score numeric NOT NULL DEFAULT 0,
  usage_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.marketing_content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content_type text NOT NULL,
  channel text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  scheduled_for timestamptz,
  author text,
  body text,
  tags text[] NOT NULL DEFAULT '{}',
  word_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.marketing_seo_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text NOT NULL,
  page_url text,
  position integer NOT NULL DEFAULT 0,
  previous_position integer NOT NULL DEFAULT 0,
  search_volume integer NOT NULL DEFAULT 0,
  difficulty integer NOT NULL DEFAULT 0,
  cpc numeric NOT NULL DEFAULT 0,
  intent text NOT NULL DEFAULT 'commercial',
  status text NOT NULL DEFAULT 'tracking',
  country text NOT NULL DEFAULT 'India',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.marketing_seo_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  title text NOT NULL,
  meta_description text,
  health_score integer NOT NULL DEFAULT 0,
  issues integer NOT NULL DEFAULT 0,
  backlinks integer NOT NULL DEFAULT 0,
  organic_traffic integer NOT NULL DEFAULT 0,
  indexed boolean NOT NULL DEFAULT true,
  last_crawled timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.marketing_lead_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  source_type text NOT NULL,
  channel text NOT NULL,
  leads_count integer NOT NULL DEFAULT 0,
  qualified_count integer NOT NULL DEFAULT 0,
  conversion_rate numeric NOT NULL DEFAULT 0,
  cost_per_lead numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  region text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.marketing_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text,
  phone text,
  company text,
  source_id uuid REFERENCES public.marketing_lead_sources(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
  score integer NOT NULL DEFAULT 0,
  stage text NOT NULL DEFAULT 'new',
  status text NOT NULL DEFAULT 'open',
  city text,
  state text,
  assigned_to text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.marketing_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  festival text,
  offer_type text NOT NULL DEFAULT 'discount',
  discount_percent numeric NOT NULL DEFAULT 0,
  code text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  regions text[] NOT NULL DEFAULT '{}',
  redemptions integer NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.marketing_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location_type text NOT NULL DEFAULT 'city',
  country text NOT NULL DEFAULT 'India',
  state text,
  city text,
  radius_km integer NOT NULL DEFAULT 0,
  population integer NOT NULL DEFAULT 0,
  active_campaigns integer NOT NULL DEFAULT 0,
  spend numeric NOT NULL DEFAULT 0,
  leads integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active'
);

CREATE TABLE public.marketing_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  title text NOT NULL,
  channel text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  recurrence text NOT NULL DEFAULT 'once',
  status text NOT NULL DEFAULT 'scheduled',
  owner text
);

CREATE TABLE public.marketing_channel_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  spend numeric NOT NULL DEFAULT 0,
  impressions bigint NOT NULL DEFAULT 0,
  clicks bigint NOT NULL DEFAULT 0,
  conversions bigint NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  roas numeric NOT NULL DEFAULT 0
);

CREATE TABLE public.marketing_kpi_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date date NOT NULL UNIQUE,
  spend numeric NOT NULL DEFAULT 0,
  reach bigint NOT NULL DEFAULT 0,
  impressions bigint NOT NULL DEFAULT 0,
  clicks bigint NOT NULL DEFAULT 0,
  leads integer NOT NULL DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  roas numeric NOT NULL DEFAULT 0,
  conversion_rate numeric NOT NULL DEFAULT 0
);

CREATE TABLE public.marketing_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type text NOT NULL,
  item_name text NOT NULL,
  requested_by text NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending',
  priority text NOT NULL DEFAULT 'medium',
  approver text,
  notes text,
  decided_at timestamptz
);

CREATE TABLE public.marketing_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  report_type text NOT NULL,
  period text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  generated_by text,
  format text NOT NULL DEFAULT 'pdf',
  status text NOT NULL DEFAULT 'ready',
  summary text
);

CREATE TABLE public.marketing_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor text NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  entity_name text,
  ip_address text,
  module text NOT NULL DEFAULT 'marketing',
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.marketing_compliance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item text NOT NULL,
  regulation text NOT NULL,
  status text NOT NULL DEFAULT 'compliant',
  last_checked timestamptz NOT NULL DEFAULT now(),
  owner text,
  notes text
);

CREATE TABLE public.marketing_influencers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  handle text NOT NULL,
  platform text NOT NULL,
  followers integer NOT NULL DEFAULT 0,
  engagement_rate numeric NOT NULL DEFAULT 0,
  category text,
  region text,
  status text NOT NULL DEFAULT 'active',
  campaigns_count integer NOT NULL DEFAULT 0,
  cost_per_post numeric NOT NULL DEFAULT 0,
  roi numeric NOT NULL DEFAULT 0
);

CREATE TABLE public.marketing_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trigger_type text NOT NULL,
  channel text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  audience_size integer NOT NULL DEFAULT 0,
  runs integer NOT NULL DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0,
  last_run_at timestamptz,
  description text
);

CREATE TABLE public.marketing_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  channel text NOT NULL,
  subject text,
  body text,
  category text,
  status text NOT NULL DEFAULT 'approved',
  usage_count integer NOT NULL DEFAULT 0
);

CREATE TABLE public.marketing_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  channel text NOT NULL,
  template_id uuid REFERENCES public.marketing_templates(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'scheduled',
  sent integer NOT NULL DEFAULT 0,
  delivered integer NOT NULL DEFAULT 0,
  opened integer NOT NULL DEFAULT 0,
  clicked integer NOT NULL DEFAULT 0,
  bounced integer NOT NULL DEFAULT 0,
  scheduled_at timestamptz
);

CREATE TABLE public.marketing_social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  scheduled_at timestamptz,
  published_at timestamptz,
  likes integer NOT NULL DEFAULT 0,
  comments integer NOT NULL DEFAULT 0,
  shares integer NOT NULL DEFAULT 0,
  reach integer NOT NULL DEFAULT 0,
  campaign_id uuid REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL
);

CREATE TABLE public.marketing_regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text NOT NULL DEFAULT 'India',
  state text,
  spend numeric NOT NULL DEFAULT 0,
  leads integer NOT NULL DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  growth_rate numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active'
);

CREATE TABLE public.marketing_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  channel text NOT NULL,
  period text NOT NULL,
  allocated numeric NOT NULL DEFAULT 0,
  spent numeric NOT NULL DEFAULT 0,
  committed numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'on_track',
  owner text
);

CREATE TABLE public.marketing_ai_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  campaign_id uuid REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
  recommendation text NOT NULL,
  impact_estimate text,
  confidence integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.marketing_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  category text NOT NULL DEFAULT 'campaign',
  status text NOT NULL DEFAULT 'open',
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'marketing_campaigns','marketing_ad_groups','marketing_creatives','marketing_content_items',
    'marketing_seo_keywords','marketing_seo_pages','marketing_lead_sources','marketing_leads',
    'marketing_offers','marketing_locations','marketing_schedules','marketing_channel_performance',
    'marketing_kpi_snapshots','marketing_approvals','marketing_reports','marketing_audit_logs',
    'marketing_compliance_records','marketing_influencers','marketing_automations','marketing_templates',
    'marketing_messages','marketing_social_posts','marketing_regions','marketing_budgets',
    'marketing_ai_recommendations','marketing_alerts'])
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Marketing console full access" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS idx_mkt_ad_groups_campaign ON public.marketing_ad_groups (campaign_id);
CREATE INDEX IF NOT EXISTS idx_mkt_ad_groups_spend ON public.marketing_ad_groups (spend DESC);
CREATE INDEX IF NOT EXISTS idx_mkt_creatives_campaign ON public.marketing_creatives (campaign_id);
CREATE INDEX IF NOT EXISTS idx_mkt_creatives_score ON public.marketing_creatives (performance_score DESC);
CREATE INDEX IF NOT EXISTS idx_mkt_schedules_campaign ON public.marketing_schedules (campaign_id);
CREATE INDEX IF NOT EXISTS idx_mkt_schedules_at ON public.marketing_schedules (scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_mkt_messages_campaign ON public.marketing_messages (campaign_id);
CREATE INDEX IF NOT EXISTS idx_mkt_social_posts_campaign ON public.marketing_social_posts (campaign_id);
CREATE INDEX IF NOT EXISTS idx_mkt_leads_campaign ON public.marketing_leads (campaign_id);
CREATE INDEX IF NOT EXISTS idx_mkt_leads_source ON public.marketing_leads (source_id);
CREATE INDEX IF NOT EXISTS idx_mkt_leads_created ON public.marketing_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mkt_ai_recs_campaign ON public.marketing_ai_recommendations (campaign_id);
CREATE INDEX IF NOT EXISTS idx_mkt_campaigns_created ON public.marketing_campaigns (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mkt_campaigns_status ON public.marketing_campaigns (status);
CREATE INDEX IF NOT EXISTS idx_mkt_audit_created ON public.marketing_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mkt_alerts_created ON public.marketing_alerts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mkt_content_created ON public.marketing_content_items (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mkt_offers_created ON public.marketing_offers (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mkt_seo_keywords_updated ON public.marketing_seo_keywords (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_mkt_channel_perf_spend ON public.marketing_channel_performance (spend DESC);
CREATE INDEX IF NOT EXISTS idx_mkt_approvals_requested ON public.marketing_approvals (requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_mkt_reports_generated ON public.marketing_reports (generated_at DESC);