import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import ticketRoutes from './server/routes/tickets.js';
import kbRoutes from './server/routes/kb.js';
import agentRoutes from './server/routes/agent.js';
import credentialRoutes from './server/routes/credentials.js';
import { checkRequiredCredentials } from './server/services/credential-service.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

app.use('/api/tickets', ticketRoutes);
app.use('/api/kb', kbRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/credentials', credentialRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

async function startServer() {
  try {
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  } catch (err: any) {
    console.warn('Vite middleware skipped:', err.message);
  }

  try {
    const missing = await checkRequiredCredentials();
    if (missing.length > 0) {
      console.warn(`Missing ${missing.length} credential(s). The app will prompt for them via the UI.`);
    }
  } catch (err: any) {
    console.warn('Credential check skipped:', err.message);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Support Escalation Hub running on http://localhost:${PORT}`);
  });
}

startServer();
