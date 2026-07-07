import { Router } from 'express';
import { checkRequiredCredentials, storeCredential, testGeminiConnection, testSupabaseConnection } from '../services/credential-service.js';

const router = Router();

router.get('/check', async (_req, res) => {
  try {
    const missing = await checkRequiredCredentials();
    res.json({ missing, allConfigured: missing.length === 0 });
  } catch {
    res.json({ missing: [], allConfigured: false, error: 'Credential check failed' });
  }
});

router.post('/store', async (req, res) => {
  const { key, value } = req.body;
  if (!key || !value) {
    return res.status(400).json({ error: 'Missing key or value' });
  }
  await storeCredential(key, value);
  res.json({ message: `Credential ${key} stored successfully.` });
});

router.post('/test', async (req, res) => {
  const { service, apiKey, url, serviceRoleKey } = req.body;

  if (service === 'gemini') {
    if (!apiKey) return res.status(400).json({ ok: false, error: 'Missing apiKey' });
    const result = await testGeminiConnection(apiKey);
    if (result.ok) {
      process.env.GEMINI_API_KEY = apiKey;
    }
    return res.json(result);
  }

  if (service === 'supabase') {
    if (!url || !serviceRoleKey) return res.status(400).json({ ok: false, error: 'Missing url or serviceRoleKey' });
    const result = await testSupabaseConnection(url, serviceRoleKey);
    if (result.ok) {
      process.env.SUPABASE_URL = url;
      process.env.SUPABASE_SERVICE_ROLE_KEY = serviceRoleKey;
    }
    return res.json(result);
  }

  res.status(400).json({ ok: false, error: `Unknown service: ${service}` });
});

router.post('/test/gemini', async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ ok: false, error: 'Missing apiKey' });
  const result = await testGeminiConnection(apiKey);
  if (result.ok) process.env.GEMINI_API_KEY = apiKey;
  res.json(result);
});

router.post('/test/supabase', async (req, res) => {
  const { url, serviceRoleKey } = req.body;
  if (!url || !serviceRoleKey) return res.status(400).json({ ok: false, error: 'Missing url or serviceRoleKey' });
  const result = await testSupabaseConnection(url, serviceRoleKey);
  if (result.ok) {
    process.env.SUPABASE_URL = url;
    process.env.SUPABASE_SERVICE_ROLE_KEY = serviceRoleKey;
  }
  res.json(result);
});

export default router;
