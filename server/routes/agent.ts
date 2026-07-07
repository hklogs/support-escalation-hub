import { Router } from 'express';
import { KNOWLEDGE_BASE } from '../../src/data.js';
import { updateTicket, fetchTicketById, fetchTicketLogs, insertAuditLog } from '../services/supabase-service.js';
import { ticketsStore } from './tickets.js';

const router = Router();

function getGeminiApiKey() {
  const key = process.env.GEMINI_API_KEY;
  return key && key !== 'MY_GEMINI_API_KEY' ? key : null;
}

router.post('/analyze', async (req, res) => {
  const { ticketId } = req.body;
  if (!ticketId) return res.status(400).json({ error: 'Missing ticketId' });

  let ticket: any = await fetchTicketById(ticketId);
  let logs: string[] | null = null;

  if (!ticket) {
    const { INITIAL_TICKETS, INITIAL_TICKET_LOGS } = await import('../../src/data.js');
    ticket = INITIAL_TICKETS.find(t => t.id === ticketId);
    logs = ticket ? INITIAL_TICKET_LOGS[ticketId] : null;
  } else {
    logs = await fetchTicketLogs(ticketId);
  }

  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  const apiKey = getGeminiApiKey();

  const prompt = `
You are an elite, highly empathetic, and technically precise Customer Support Escalation Agent.

Here is the Support Ticket:
- Ticket ID: ${ticket.id}
- Customer Name: ${ticket.customer_name || ticket.customerName}
- Customer Email: ${ticket.customer_email || ticket.customerEmail}
- Company: ${ticket.company}
- Account Tier: ${ticket.tier}
- Subject: ${ticket.subject}
- Description: ${ticket.description}
- Customer Environment: ${ticket.environment}
- Diagnostic Logs Available:
${(logs || []).join('\n')}

Here is our Internal Knowledge Base (KB) and Known Error Database (KEDB):
${JSON.stringify(KNOWLEDGE_BASE, null, 2)}

Your Core Workflow:
1. INGESTION & ANALYSIS: Analyze the query for intent, sentiment (Frustrated, Calm, Anxious, Neutral), and technical urgency.
2. CLASSIFICATION:
   - Tier 1 (General/Account): Password resets, billing questions, simple navigation. Mapped to articles like KB-101.
   - Tier 2 (Technical/Application): Troubleshooting configuration, settings, API key rotations, webhook signing. Mapped to articles like KB-202, KB-205.
   - Tier 3 (Escalation Protocol): Deep system bugs, database connection locks, server pool exhaustion, system outages. Mapped to articles like KB-301, KB-304.
3. DECISION & OUTPUT:
   - If Tier 1 or Tier 2: Formulate a beautiful, highly empathetic, professional, clear, and actionable response.
   - If Tier 3: Prepare a message stating a senior specialized engineer is being looped in. Draft the perfectly structured "TIER 3 HANDOVER SUMMARY".

Provide your response in JSON matching the exact schema:
{
  "assignedTier": 1,
  "sentiment": "string",
  "agentNotes": "string",
  "agentResponse": "string",
  "handoverSummary": {
    "customerImpact": "string",
    "defectSummary": "string",
    "troubleshootingPerformed": ["string"],
    "rootCauseHypothesis": "string",
    "environmentSpecs": "string",
    "nextSteps": "string"
  }
}.`;

  if (apiKey) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);

      if (geminiRes.ok) {
        const data: any = await geminiRes.json();
        const dataText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (dataText) {
          const cleaned = dataText.replace(/```(?:json)?\s*|\s*```/g, '').trim();
          const analysisResult = JSON.parse(cleaned);
          await updateTicketState(ticketId, analysisResult);
          await insertAuditLog('agent_analysis', 'ticket', ticketId, { tier: analysisResult.assignedTier, mode: 'gemini' });
          return res.json(analysisResult);
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.error('Gemini API timed out after 15s');
      } else {
        console.error('Gemini API error:', err);
      }
    }
  }

  const result = localFallback(ticket, logs || []);
  await updateTicketState(ticketId, result);
  await insertAuditLog('agent_analysis', 'ticket', ticketId, { tier: result.assignedTier, mode: 'local' });
  res.json(result);
});

function localFallback(ticket: any, logs: string[]) {
  let assignedTier: 1 | 2 | 3 = 1;
  let sentiment: 'Frustrated' | 'Neutral' | 'Anxious' | 'Calm' = ticket.sentiment || 'Neutral';
  let agentNotes = '';
  let agentResponse = '';
  let handoverSummary: any = undefined;

  const descLower = (ticket.subject + ' ' + ticket.description).toLowerCase();

  if (descLower.includes('exhaustion') || descLower.includes('timeout') || descLower.includes('504') || descLower.includes('fatal') || descLower.includes('pool')) {
    assignedTier = 3;
    agentNotes = 'Diagnostic logs report severe connection pool exhaustion (100/100 active) and uncommitted write transaction locking. This is a Tier 3 backend database infrastructure outage covered by KB-301.';
    agentResponse = 'I am looping in our specialized database engineering team to resolve this deep system connection lock issue for you. I have already summarized everything we have done so far and attached the database lock diagnostics so they can jump straight to the root-cause fix.';
    handoverSummary = {
      ticketId: ticket.id,
      customerImpact: `Critical / ${sentiment} / ${ticket.tier} Account (${ticket.company})`,
      defectSummary: 'Severe write-lock cycle on v4.12 schema leading to database connection pool saturation and unmitigated 504 timeouts.',
      troubleshootingPerformed: ['Ingested logs representing database saturation.', 'Cross-referenced Known Error Database article KB-301.', 'Analyzed active thread statuses reporting acquisition blockages.'],
      rootCauseHypothesis: 'Unreleased update transactions in v4.12 cluster are failing to commit under high concurrency, holding rows locked and saturating the 100 connection pool limit.',
      environmentSpecs: ticket.environment,
      nextSteps: 'A database administrator needs to execute a lock reset, identify the holding transaction ID, and terminate the leak to unlock the pool.'
    };
  } else if (descLower.includes('signature') || descLower.includes('webhook') || descLower.includes('401') || descLower.includes('rotate') || descLower.includes('key')) {
    assignedTier = 2;
    if (descLower.includes('rotate') || descLower.includes('rotation')) {
      agentNotes = 'Customer is inquiring about key rotations without downtime. Classified as Tier 2 (Technical settings). Cross-referenced article KB-205.';
      agentResponse = `Hello ${ticket.customerName || ticket.customer_name},\n\nThank you for reaching out. You can easily rotate your primary API keys with zero downtime by using our Graceful Key Rotation Overlap Mode (KB-205).\n\nHere is the procedure:\n1. Log in to Developer Console > API Credentials.\n2. Click on "Rotate Key" and check "Enable 24-Hour Overlap Window".\n3. Deploy the new key while your legacy key remains active.\n4. Once verified, deactivate the legacy key or let it expire after 24 hours.`;
    } else {
      agentNotes = 'Analyzed webhook 401 signature mismatches. Webhook configuration issue classified as Tier 2. Cross-referenced article KB-202.';
      agentResponse = `Hello ${ticket.customerName || ticket.customer_name},\n\nI understand how frustrating webhook signature verification failures can be.\n\nThis issue usually stems from hash calculations performed on formatted or stringified payloads instead of the raw request payload (KB-202).\n\nPlease verify:\n1. Use Raw Body Bytes for HMAC-SHA256 signing.\n2. Check you are using the WH_SECRET key, not your API credential key.\n3. Double-check timestamp concatenation in your hash calculation.`;
    }
  } else {
    assignedTier = 1;
    agentNotes = 'Standard duplicate billing issue, mapped to Tier 1 Account support. Cross-referenced KB-101.';
    agentResponse = `Hello ${ticket.customerName || ticket.customer_name},\n\nI am so sorry to hear you were double charged. I have investigated and confirmed your Stripe billing gateway processed duplicate webhook requests.\n\nHere is what I have done:\n1. Initiated a full refund of $15.00 for the duplicate charge.\n2. The refund should post within 3-5 business days.\n3. Verified your active subscription remains safe and active.\n\nNo further action required from your side!`;
  }

  return { assignedTier, sentiment, agentNotes, agentResponse, handoverSummary };
}

async function updateTicketState(ticketId: string, result: any) {
  const updates: any = {
    assigned_tier: result.assignedTier,
    sentiment: result.sentiment,
    agent_notes: result.agentNotes,
    agent_response: result.agentResponse,
    status: result.assignedTier === 3 ? 'Escalated' : 'Resolved'
  };
  if (result.handoverSummary) updates.handover_summary = result.handoverSummary;
  const dbResult = await updateTicket(ticketId, updates);
  if (!dbResult) {
    const idx = ticketsStore.findIndex((t: any) => t.id === ticketId);
    if (idx !== -1) {
      ticketsStore[idx].assignedTier = result.assignedTier;
      ticketsStore[idx].sentiment = result.sentiment;
      ticketsStore[idx].agentNotes = result.agentNotes;
      ticketsStore[idx].agentResponse = result.agentResponse;
      ticketsStore[idx].status = result.assignedTier === 3 ? 'Escalated' : 'Resolved';
      if (result.handoverSummary) ticketsStore[idx].handoverSummary = result.handoverSummary;
    }
  }
}

export default router;
