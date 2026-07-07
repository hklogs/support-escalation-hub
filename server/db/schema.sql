-- Support Escalation Hub - Supabase Schema
-- Run this in your Supabase SQL editor

-- 1. Tickets table
CREATE TABLE tickets (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  company TEXT NOT NULL DEFAULT 'Individual Developer',
  tier TEXT NOT NULL CHECK (tier IN ('Free', 'SME', 'Enterprise')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Escalated')),
  sentiment TEXT NOT NULL DEFAULT 'Neutral' CHECK (sentiment IN ('Frustrated', 'Neutral', 'Anxious', 'Calm')),
  environment TEXT NOT NULL DEFAULT '',
  assigned_tier INTEGER CHECK (assigned_tier IN (1, 2, 3)),
  agent_notes TEXT,
  agent_response TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ticket logs
CREATE TABLE ticket_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  log_entry TEXT NOT NULL,
  log_level TEXT NOT NULL DEFAULT 'INFO' CHECK (log_level IN ('INFO', 'DEBUG', 'WARNING', 'ERROR', 'SEVERE', 'FATAL', 'CRITICAL')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Handover summaries (Tier 3)
CREATE TABLE handover_summaries (
  ticket_id TEXT PRIMARY KEY REFERENCES tickets(id) ON DELETE CASCADE,
  customer_impact TEXT NOT NULL,
  defect_summary TEXT NOT NULL,
  root_cause_hypothesis TEXT NOT NULL,
  environment_specs TEXT NOT NULL,
  next_steps TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Troubleshooting steps for handovers
CREATE TABLE handover_troubleshooting_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  step TEXT NOT NULL,
  step_order INTEGER NOT NULL
);

-- 5. Knowledge base articles (KEDB)
CREATE TABLE kb_articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('General', 'Technical', 'Known Error')),
  content TEXT NOT NULL
);

-- 6. KB resolution steps
CREATE TABLE kb_article_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id TEXT NOT NULL REFERENCES kb_articles(id) ON DELETE CASCADE,
  step TEXT NOT NULL,
  step_order INTEGER NOT NULL
);

-- 7. Credentials store (encrypted at rest via Supabase)
CREATE TABLE credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL UNIQUE,
  credential_key TEXT NOT NULL,
  credential_value TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'rotated', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Audit log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX idx_ticket_logs_ticket_id ON ticket_logs(ticket_id);
CREATE INDEX idx_ticket_logs_created_at ON ticket_logs(created_at DESC);
CREATE INDEX idx_kb_articles_category ON kb_articles(category);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);

-- Seed KB articles
INSERT INTO kb_articles (id, title, category, content) VALUES
('KB-101', 'Duplicate Subscription Charges / Accidental Webhook Double processing', 'General', 'Occasionally, duplicate Stripe or payment processor webhook events can occur due to network retries. When a duplicate charge is flagged (same transaction ID in system logs), the redundant payment should be refunded immediately. Customers must be reassured that the core subscription remains active and a partial refund for the extra charge has been initiated. Refunds typically settle in 3-5 business days.'),
('KB-202', 'Troubleshooting Webhook HMAC Signature Mismatches (Tier 2)', 'Technical', 'Webhook signatures fail when the signing payload or the shared secret key contains discrepancies. Standard verification requires hashing the raw request body payload concatenated with the timestamp header, using HMAC-SHA256 with the developer secret WH_SECRET.'),
('KB-205', 'API Key Graceful Rotation & Overlap Mode (Tier 2)', 'Technical', 'To rotate credentials without downtime, use the "Graceful Key Rotation" feature in the Developer Console. This mode allows the legacy key and the newly generated key to remain concurrently active for a 24-hour overlap window.'),
('KB-301', 'Database connection pools, locking, and 504 Timeouts (Tier 3)', 'Known Error', 'CRITICAL BUG: Continuous 504 Gateway Timeouts associated with database saturation are caused by a known unreleased code defect in v4.12 write lock cycles. Under high concurrency, specific transactional update queries lock table rows and fail to release, saturating the connection pool.'),
('KB-304', 'Severe Infrastructure Network Congestion / Cloud Router Failure (Tier 3)', 'Known Error', 'In the event of total application unresponsiveness across multi-region clusters, the core network gateway or edge cloud routers might have failed. This is a high-severity infrastructure crisis.');

INSERT INTO kb_article_steps (article_id, step, step_order) VALUES
('KB-101', 'Locate transaction ID in Stripe / Billing portal.', 1),
('KB-101', 'Check if local database records show two logs for the same charge timestamp.', 2),
('KB-101', 'Click Refund on the duplicate event.', 3),
('KB-101', 'Notify customer with empathetic tone, confirming refund details and processing times.', 4),
('KB-202', 'Confirm developer is using the correct WH_SECRET from the dashboard, not the account API secret.', 1),
('KB-202', 'Verify they calculate HMAC on the raw, unparsed request body payload.', 2),
('KB-202', 'Check that the timestamp is appended exactly as specified in our header protocol.', 3),
('KB-202', 'Provide example node.js verification snippet for reference.', 4),
('KB-205', 'Instruct customer to log in to Developer Console > API Credentials.', 1),
('KB-205', 'Click "Rotate Key" and select "Enable 24-Hour Overlap Window".', 2),
('KB-205', 'Deploy the new key to active client applications.', 3),
('KB-205', 'Once verified, click "Deactivate Legacy Key" or wait for automatic expiration.', 4),
('KB-301', 'Analyze logs for "Database pool exhaustion" or "uncommitted write transaction".', 1),
('KB-301', 'Confirm the issue cannot be resolved by standard Tier 2 settings.', 2),
('KB-301', 'Initiate Tier 3 escalation protocol.', 3),
('KB-301', 'Prepare Internal Handover Summary identifying uncommitted database locks as potential culprit.', 4),
('KB-304', 'Examine edge router metrics for heavy packet loss.', 1),
('KB-304', 'Escalate immediately to SRE via PagerDuty.', 2),
('KB-304', 'Avoid customer workarounds as this requires root-level cluster repairs.', 3);

-- Seed initial tickets
INSERT INTO tickets (id, customer_name, customer_email, company, tier, subject, description, created_at, status, sentiment, environment) VALUES
('TCK-2041', 'Sarah Jenkins', 'sarah.j@example.com', 'Sarah Jenkins Designs', 'Free', 'Double charge on standard monthly subscription', 'Hello, I checked my billing portal today and noticed I was charged twice ($15.00 each) on June 25th for my monthly standard subscription. I only signed up for a single plan.', '2026-06-25T08:12:00Z', 'Open', 'Anxious', 'Chrome 124, macOS Sonoma, Stripe Gateway'),
('TCK-5092', 'Marcus Chen', 'm.chen@acme.corp', 'Acme Corporation', 'Enterprise', 'Webhook signature verification fails consistently with 401 Unauthorized', 'We are configuring the real-time event webhooks in our Sandbox environment. However, every webhook delivery dispatch fails signature verification on our end, returning a 401.', '2026-06-28T02:15:30Z', 'Open', 'Neutral', 'Node.js Express backend, Sandbox Gateway, API version v2.4'),
('TCK-9011', 'Evelyn Martinez', 'evelyn.m@globallogistics.com', 'Global Logistics Inc.', 'Enterprise', 'Severe API latency spikes & continuous 504 Gateway Timeouts', 'Our dispatch logistics dashboard is completely broken right now. Every backend-backed API call is hanging for over 30 seconds before failing with a 504 Gateway Timeout.', '2026-06-28T08:50:11Z', 'Open', 'Frustrated', 'PostgreSQL DB, Cloud Ingress Router, Production Cluster v4.12'),
('TCK-1102', 'Oliver Smith', 'oliver@smithmedia.co', 'Smith Media Group', 'SME', 'How to rotate API keys without breaking current active sessions?', 'Hi there, we are undergoing a security audit and need to rotate our primary API secret key. Is there a way to have two keys active simultaneously?', '2026-06-28T05:30:10Z', 'Open', 'Calm', 'Developer Dashboard, API Admin Console');

INSERT INTO ticket_logs (ticket_id, log_entry, log_level) VALUES
('TCK-2041', '[2026-06-25 08:12:00] INFO: Ingress billing webhook request received for user: sarah.j@example.com', 'INFO'),
('TCK-2041', '[2026-06-25 08:12:01] INFO: Stripe webhook event [evt_charge_succeeded_abc123] processed successfully.', 'INFO'),
('TCK-2041', '[2026-06-25 08:12:02] WARNING: Duplicate stripe webhook event received with transaction reference tx_82937.', 'WARNING'),
('TCK-5092', '[2026-06-28 02:15:30] INFO: Webhook Delivery requested for Acme Corp event: user.created', 'INFO'),
('TCK-5092', '[2026-06-28 02:15:31] INFO: Request header: X-Signature-SHA256: 8a90fd3fb2938a103c8928de', 'INFO'),
('TCK-5092', '[2026-06-28 02:15:31] WARN: Webhook target returned 401 Unauthorized', 'WARNING'),
('TCK-9011', '[2026-06-28 08:50:11] SEVERE: Database connection pool exhaustion detected. Active pool connections: 100/100.', 'SEVERE'),
('TCK-9011', '[2026-06-28 08:50:15] ERROR: Connection acquire timeout after 15000ms. Client thread ID: pool-1-thread-47 locked.', 'ERROR'),
('TCK-9011', '[2026-06-28 08:50:30] FATAL: Cannot get connection from source. Locked by uncommitted write transaction #8912.', 'FATAL'),
('TCK-1102', '[2026-06-28 05:30:10] INFO: Audit log: API settings page loaded by oliver@smithmedia.co.', 'INFO');
