import { getSupabaseClient } from '../db/supabase.js';

export async function fetchTickets() {
  const supabase = await getSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
  return data;
}

export async function fetchTicketById(id: string) {
  const supabase = await getSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.from('tickets').select('*').eq('id', id).single();
  return data;
}

export async function fetchTicketLogs(ticketId: string) {
  const supabase = await getSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.from('ticket_logs').select('log_entry').eq('ticket_id', ticketId).order('created_at', { ascending: true });
  return data?.map((r: any) => r.log_entry) || [];
}

export async function createTicket(ticket: any) {
  const supabase = await getSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.from('tickets').insert(ticket).select().single();
  return data;
}

export async function updateTicket(id: string, updates: any) {
  const supabase = await getSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.from('tickets').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  return data;
}

export async function fetchKBArticles() {
  const supabase = await getSupabaseClient();
  if (!supabase) return null;
  const { data: articles } = await supabase.from('kb_articles').select('*').order('id');
  const { data: steps } = await supabase.from('kb_article_steps').select('*').order('step_order');
  if (!articles) return null;
  return articles.map((a: any) => ({
    ...a,
    steps: steps?.filter((s: any) => s.article_id === a.id).map((s: any) => s.step) || [],
  }));
}

export async function insertAuditLog(action: string, entityType: string, entityId?: string, details?: any) {
  const supabase = await getSupabaseClient();
  if (!supabase) return;
  await supabase.from('audit_log').insert({ action, entity_type: entityType, entity_id: entityId, details: details || {} });
}
