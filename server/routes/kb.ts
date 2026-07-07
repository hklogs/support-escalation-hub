import { Router } from 'express';
import { KNOWLEDGE_BASE } from '../../src/data.js';
import { fetchKBArticles, insertAuditLog } from '../services/supabase-service.js';

const router = Router();

router.get('/', async (_req, res) => {
  const dbArticles = await fetchKBArticles();
  if (dbArticles) return res.json(dbArticles);
  res.json(KNOWLEDGE_BASE);
});

router.post('/', async (req, res) => {
  const { id, title, category, content, steps } = req.body;
  if (!id || !title || !category || !content) {
    return res.status(400).json({ error: 'Missing required fields: id, title, category, content' });
  }
  KNOWLEDGE_BASE.push({ id, title, category, content, steps: steps || [] });
  await insertAuditLog('kb_article_created', 'kb_article', id, { title });
  res.status(201).json({ id, title, category, content, steps: steps || [] });
});

export default router;
