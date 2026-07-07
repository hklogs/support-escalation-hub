import express from 'express';
import ticketRoutes from '../server/routes/tickets.js';
import kbRoutes from '../server/routes/kb.js';
import agentRoutes from '../server/routes/agent.js';
import credentialRoutes from '../server/routes/credentials.js';

const app = express();
app.use(express.json());

app.use('/api/tickets', ticketRoutes);
app.use('/api/kb', kbRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/credentials', credentialRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

export default app;
