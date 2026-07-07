import { Router } from 'express';
import { INITIAL_TICKETS, INITIAL_TICKET_LOGS } from '../../src/data.js';
import { fetchTickets, fetchTicketById, fetchTicketLogs, createTicket, updateTicket, insertAuditLog } from '../services/supabase-service.js';

const router = Router();

export let ticketsStore: any[] = JSON.parse(JSON.stringify(INITIAL_TICKETS));
export let logsStore: Record<string, string[]> = JSON.parse(JSON.stringify(INITIAL_TICKET_LOGS));

router.get('/', async (_req, res) => {
  const dbTickets = await fetchTickets();
  if (dbTickets) {
    const enriched = await Promise.all(dbTickets.map(async (t: any) => {
      const dbLogs = await fetchTicketLogs(t.id);
      return { ...t, logs: dbLogs || [] };
    }));
    return res.json(enriched);
  }
  res.json(ticketsStore);
});

router.get('/:id', async (req, res) => {
  const dbTicket = await fetchTicketById(req.params.id);
  if (dbTicket) {
    const dbLogs = await fetchTicketLogs(dbTicket.id);
    return res.json({ ...dbTicket, logs: dbLogs || [] });
  }
  const ticket = ticketsStore.find(t => t.id === req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  res.json({ ...ticket, logs: logsStore[ticket.id] || [] });
});

router.post('/', async (req, res) => {
  const newTicket = {
    id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
    customer_name: req.body.customerName || 'Anonymous Customer',
    customer_email: req.body.customerEmail || 'customer@example.com',
    company: req.body.company || 'Individual Developer',
    tier: req.body.tier || 'Free',
    subject: req.body.subject || 'No Subject',
    description: req.body.description || 'No description provided.',
    created_at: new Date().toISOString(),
    status: 'Open',
    sentiment: req.body.sentiment || 'Neutral',
    environment: req.body.environment || 'Chrome 125, macOS, API v2.0',
  };

  const defaultLogs = [
    `[${new Date().toISOString().replace('T', ' ').slice(0, 19)}] INFO: Ticket logged via workspace generator.`
  ];
  const logEntries = req.body.logs || defaultLogs;

  const dbTicket = await createTicket(newTicket);
  if (dbTicket) {
    const ticketWithLogs = { ...dbTicket, logs: logEntries };
    await insertAuditLog('ticket_created', 'ticket', dbTicket.id, { subject: dbTicket.subject });
    return res.status(201).json(ticketWithLogs);
  }

  const ticketWithId = {
    ...newTicket,
    id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
  };
  ticketsStore.unshift(ticketWithId);
  logsStore[ticketWithId.id] = logEntries;
  res.status(201).json({ ...ticketWithId, logs: logEntries });
});

router.post('/reset', async (_req, res) => {
  ticketsStore = JSON.parse(JSON.stringify(INITIAL_TICKETS));
  logsStore = JSON.parse(JSON.stringify(INITIAL_TICKET_LOGS));
  await insertAuditLog('queue_reset', 'tickets');
  res.json({ message: 'Tickets queue reset successfully.', tickets: ticketsStore.map((t: any) => ({ ...t, logs: logsStore[t.id] || [] })) });
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const body: any = {};
  if (req.body.customerName !== undefined) body.customer_name = req.body.customerName;
  if (req.body.subject !== undefined) body.subject = req.body.subject;
  if (req.body.description !== undefined) body.description = req.body.description;
  if (req.body.status !== undefined) body.status = req.body.status;
  if (req.body.sentiment !== undefined) body.sentiment = req.body.sentiment;
  if (req.body.assignedTier !== undefined) body.assigned_tier = req.body.assignedTier;
  if (req.body.agentNotes !== undefined) body.agent_notes = req.body.agentNotes;
  if (req.body.agentResponse !== undefined) body.agent_response = req.body.agentResponse;
  if (req.body.handoverSummary !== undefined) body.handover_summary = req.body.handoverSummary;
  if (req.body.environment !== undefined) body.environment = req.body.environment;

  const dbUpdated = await updateTicket(id, body);
  if (dbUpdated) {
    const dbLogs = await fetchTicketLogs(id);
    await insertAuditLog('ticket_updated', 'ticket', id, { status: body.status });
    return res.json({ ...dbUpdated, logs: dbLogs || [] });
  }

  const ticketIndex = ticketsStore.findIndex(t => t.id === id);
  if (ticketIndex === -1) return res.status(404).json({ error: 'Ticket not found' });
  Object.assign(ticketsStore[ticketIndex], req.body);
  res.json({ ...ticketsStore[ticketIndex], logs: logsStore[id] || [] });
});

export default router;
