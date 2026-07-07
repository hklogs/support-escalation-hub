import { Ticket, KBArticle } from './types';

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'TCK-2041',
    customerName: 'Sarah Jenkins',
    customerEmail: 'sarah.j@example.com',
    company: 'Sarah Jenkins Designs',
    tier: 'Free',
    subject: 'Double charge on standard monthly subscription',
    description: `Hello, I checked my billing portal today and noticed I was charged twice ($15.00 each) on June 25th for my monthly standard subscription. I only signed up for a single plan. Could you please check my account, refund the duplicate charge, and ensure my billing cycle is set up correctly? Thank you for the quick help!`,
    createdAt: '2026-06-25T08:12:00Z',
    status: 'Open',
    sentiment: 'Anxious',
    environment: 'Chrome 124, macOS Sonoma, Stripe Gateway',
    logs: [
      '[2026-06-25 08:12:00] INFO: Ingress billing webhook request received for user: sarah.j@example.com',
      '[2026-06-25 08:12:01] INFO: Stripe webhook event [evt_charge_succeeded_abc123] processed successfully. Subscription created.',
      '[2026-06-25 08:12:02] WARNING: Duplicate stripe webhook event received with transaction reference tx_82937 (evt_charge_succeeded_abc123).',
      '[2026-06-25 08:12:02] INFO: Processed redundant charge registration. Gateway recorded double transaction in local session caches.',
      '[2026-06-25 08:12:03] INFO: Duplicate billing log entry flagged. System recommends initiating automatic partial refund for redundancy.'
    ]
  },
  {
    id: 'TCK-5092',
    customerName: 'Marcus Chen',
    customerEmail: 'm.chen@acme.corp',
    company: 'Acme Corporation',
    tier: 'Enterprise',
    subject: 'Webhook signature verification fails consistently with 401 Unauthorized',
    description: `We are configuring the real-time event webhooks in our Sandbox environment. However, every webhook delivery dispatch fails signature verification on our end, returning a 401. We have configured our endpoint with the 'WH_SECRET' key provided in the developer dashboard, but comparing our computed HMAC-SHA256 signature to your 'X-Signature-SHA256' header fails. Are you using a different hashing algorithm, or is the secret rotating?`,
    createdAt: '2026-06-28T02:15:30Z',
    status: 'Open',
    sentiment: 'Neutral',
    environment: 'Node.js Express backend, Sandbox Gateway, API version v2.4',
    logs: [
      '[2026-06-28 02:15:30] INFO: Webhook Delivery requested for Acme Corp event: user.created',
      '[2026-06-28 02:15:31] INFO: Request header: X-Signature-SHA256: 8a90fd3fb2938a103c8928de',
      '[2026-06-28 02:15:31] WARN: Webhook target https://sandbox.acme.com/api/v1/callback returned 401 Unauthorized',
      '[2026-06-28 02:15:31] INFO: Delivery attempt 1 failed. Payload verification mismatch logged by target host.',
      '[2026-06-28 02:15:31] DEBUG: Signing verification algorithm: HMAC-SHA256 using WH_SECRET key. Signature incorporates event timestamp and raw request payload.'
    ]
  },
  {
    id: 'TCK-9011',
    customerName: 'Evelyn Martinez',
    customerEmail: 'evelyn.m@globallogistics.com',
    company: 'Global Logistics Inc.',
    tier: 'Enterprise',
    subject: 'Severe API latency spikes & continuous 504 Gateway Timeouts',
    description: `Our dispatch logistics dashboard is completely broken right now. Every backend-backed API call is hanging for over 30 seconds before failing with a 504 Gateway Timeout. This is a massive production incident as our logistics teams cannot route trucks. We have made no changes to our system. We need an engineer to immediately investigate why your backend queries are locked or hanging!`,
    createdAt: '2026-06-28T08:50:11Z',
    status: 'Open',
    sentiment: 'Frustrated',
    environment: 'PostgreSQL DB, Cloud Ingress Router, Production Cluster v4.12',
    logs: [
      '[2026-06-28 08:50:11] SEVERE: Database connection pool exhaustion detected. Active pool connections: 100/100.',
      '[2026-06-28 08:50:15] ERROR: Connection acquire timeout after 15000ms. Client thread ID: pool-1-thread-47 locked.',
      '[2026-06-28 08:50:20] WARNING: Health checks are reporting unresponsive backend instances. Memory saturation 94%.',
      '[2026-06-28 08:50:30] FATAL: org.postgresql.util.PSQLException: Cannot get connection from source. Locked by uncommitted write transaction #8912.',
      '[2026-06-28 08:51:00] CRITICAL: Cloud Ingress Router: Service response time exceeded threshold. Emitting 504 Gateway Timeout.'
    ]
  },
  {
    id: 'TCK-1102',
    customerName: 'Oliver Smith',
    customerEmail: 'oliver@smithmedia.co',
    company: 'Smith Media Group',
    tier: 'SME',
    subject: 'How to rotate API keys without breaking current active sessions?',
    description: `Hi there, we are undergoing a security audit and need to rotate our primary API secret key. Is there a way to have two keys active simultaneously, or do we have to experience brief downtime during the swap? What is the standard process recommended by your system? Thanks!`,
    createdAt: '2026-06-28T05:30:10Z',
    status: 'Open',
    sentiment: 'Calm',
    environment: 'Developer Dashboard, API Admin Console',
    logs: [
      '[2026-06-28 05:30:10] INFO: Audit log: API settings page loaded by oliver@smithmedia.co.',
      '[2026-06-28 05:30:15] INFO: Security checklist: Key rotation page requested.'
    ]
  }
];

export const INITIAL_TICKET_LOGS: Record<string, string[]> = {};
for (const t of INITIAL_TICKETS) {
  INITIAL_TICKET_LOGS[t.id] = t.logs;
}

export const KNOWLEDGE_BASE: KBArticle[] = [
  {
    id: 'KB-101',
    title: 'Duplicate Subscription Charges / Accidental Webhook Double processing',
    category: 'General',
    content: 'Occasionally, duplicate Stripe or payment processor webhook events can occur due to network retries. When a duplicate charge is flagged (same transaction ID in system logs), the redundant payment should be refunded immediately. Customers must be reassured that the core subscription remains active and a partial refund for the extra charge has been initiated. Refunds typically settle in 3-5 business days.',
    steps: [
      'Locate transaction ID in Stripe / Billing portal.',
      'Check if local database records show two logs for the same charge timestamp.',
      'Click Refund on the duplicate event.',
      'Notify customer with empathetic tone, confirming refund details and processing times.'
    ]
  },
  {
    id: 'KB-202',
    title: 'Troubleshooting Webhook HMAC Signature Mismatches (Tier 2)',
    category: 'Technical',
    content: 'Webhook signatures fail when the signing payload or the shared secret key contains discrepancies. Standard verification requires hashing the raw request body payload concatenated with the timestamp header, using HMAC-SHA256 with the developer secret WH_SECRET. If verification fails, verify the developer is calculating the HMAC on the *raw bytes* of the request body, not the stringified or formatted JSON, which changes white spaces and fails signature matches.',
    steps: [
      'Confirm developer is using the correct WH_SECRET from the dashboard, not the account API secret.',
      'Verify they calculate HMAC on the raw, unparsed request body payload.',
      'Check that the timestamp is appended exactly as specified in our header protocol (timestamp.payload).',
      'Provide example node.js verification snippet for reference.'
    ]
  },
  {
    id: 'KB-205',
    title: 'API Key Graceful Rotation & Overlap Mode (Tier 2)',
    category: 'Technical',
    content: 'To rotate credentials without downtime, use the "Graceful Key Rotation" feature in the Developer Console. This mode allows the legacy key and the newly generated key to remain concurrently active for a 24-hour overlap window, giving developers plenty of time to distribute the new credential across their servers.',
    steps: [
      'Instruct customer to log in to Developer Console > API Credentials.',
      'Click "Rotate Key" and select "Enable 24-Hour Overlap Window".',
      'Deploy the new key to active client applications.',
      'Once verified, click "Deactivate Legacy Key" or wait for automatic expiration.'
    ]
  },
  {
    id: 'KB-301',
    title: 'Database connection pools, locking, and 504 Timeouts (Tier 3)',
    category: 'Known Error',
    content: 'CRITICAL BUG: Continuous 504 Gateway Timeouts associated with database saturation are caused by a known unreleased code defect in v4.12 write lock cycles. Under high concurrency, specific transactional update queries lock table rows and fail to release, saturating the connection pool (100/100 active connections) and causing subsequent connection attempts to block indefinitely. This is a Tier 3 backend database infrastructure issue that requires a database connection reset and temporary transaction termination by senior database engineers.',
    steps: [
      'Analyze logs for "Database pool exhaustion" or "uncommitted write transaction".',
      'Confirm the issue cannot be resolved by standard Tier 2 settings.',
      'Initiate Tier 3 escalation protocol.',
      'Prepare Internal Handover Summary identifying uncommitted database locks as potential culprit.'
    ]
  },
  {
    id: 'KB-304',
    title: 'Severe Infrastructure Network Congestion / Cloud Router Failure (Tier 3)',
    category: 'Known Error',
    content: 'In the event of total application unresponsiveness across multi-region clusters, the core network gateway or edge cloud routers might have failed. This is a high-severity infrastructure crisis that must be escalated immediately to DevOps and SRE teams to rerun deployment templates or re-route BGP routes.',
    steps: [
      'Examine edge router metrics for heavy packet loss.',
      'Escalate immediately to SRE via PagerDuty.',
      'Avoid customer workarounds as this requires root-level cluster repairs.'
    ]
  }
];
