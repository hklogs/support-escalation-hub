import { getSupabaseClient } from '../db/supabase.js';

export interface RequiredCredential {
  service: string;
  key: string;
  description: string;
  envVar: string;
}

const REQUIRED_CREDENTIALS: RequiredCredential[] = [
  { service: 'supabase', key: 'SUPABASE_URL', description: 'Supabase Project URL', envVar: 'SUPABASE_URL' },
  { service: 'supabase', key: 'SUPABASE_SERVICE_ROLE_KEY', description: 'Supabase Service Role Key', envVar: 'SUPABASE_SERVICE_ROLE_KEY' },
  { service: 'gemini', key: 'GEMINI_API_KEY', description: 'Google Gemini API Key', envVar: 'GEMINI_API_KEY' },
  { service: 'stripe', key: 'STRIPE_SECRET_KEY', description: 'Stripe Secret Key', envVar: 'STRIPE_SECRET_KEY' },
  { service: 'stripe', key: 'STRIPE_WEBHOOK_SECRET', description: 'Stripe Webhook Signing Secret', envVar: 'STRIPE_WEBHOOK_SECRET' },
];

export async function checkRequiredCredentials(): Promise<RequiredCredential[]> {
  const missing: RequiredCredential[] = [];
  for (const cred of REQUIRED_CREDENTIALS) {
    try {
      const envValue = process.env[cred.envVar];
      if (!envValue || envValue === `MY_${cred.key}`) {
        const dbValue = await getStoredCredential(cred.key);
        if (!dbValue) {
          missing.push(cred);
        } else {
          process.env[cred.envVar] = dbValue;
        }
      }
    } catch {
      missing.push(cred);
    }
  }
  return missing;
}

export async function getStoredCredential(key: string): Promise<string | null> {
  try {
    const supabase = await getSupabaseClient();
    if (!supabase) return null;
    const { data } = await supabase.from('credentials').select('credential_value').eq('credential_key', key).eq('status', 'active').single();
    return data?.credential_value ?? null;
  } catch {
    return null;
  }
}

export async function storeCredential(credentialKey: string, credentialValue: string): Promise<void> {
  try {
    const supabase = await getSupabaseClient();
    const service = REQUIRED_CREDENTIALS.find(c => c.key === credentialKey)?.service || 'unknown';
    if (supabase) {
      await supabase.from('credentials').upsert({
        service,
        credential_key: credentialKey,
        credential_value: credentialValue,
        status: 'active',
      }, { onConflict: 'credential_key' });
    }
  } catch { /* in-memory only */ }
  process.env[credentialKey] = credentialValue;
}

export async function testGeminiConnection(apiKey: string): Promise<{ ok: boolean; error?: string }> {
  if (!apiKey || apiKey.length < 10) {
    return { ok: false, error: 'Gemini API Key appears too short. Check you copied the full key.' };
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'Reply with just the word ok' }] }] }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data: any = await res.json();
      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) return { ok: true };
      return { ok: false, error: 'Gemini returned an unexpected response format.' };
    }
    const errData: any = await res.json().catch(() => ({}));
    const errMsg = errData?.error?.message || res.statusText;
    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: 'Gemini API Key is invalid or expired.' };
    }
    if (res.status === 429) {
      return { ok: true, error: 'Gemini key is valid but rate-limited. Analysis will fall back to local mode.' };
    }
    return { ok: false, error: `Gemini API error (${res.status}): ${errMsg}` };
  } catch (err: any) {
    const msg = err.message || String(err);
    if (msg.includes('aborted') || msg.includes('timeout')) {
      return { ok: false, error: 'Gemini API connection timed out. Check your network or API key region.' };
    }
    return { ok: false, error: `Gemini connection error: ${msg.slice(0, 100)}` };
  }
}

export async function testSupabaseConnection(url: string, serviceRoleKey: string): Promise<{ ok: boolean; error?: string }> {
  if (!url || !serviceRoleKey) {
    return { ok: false, error: 'Supabase URL and Service Role Key are required.' };
  }
  if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
    return { ok: false, error: 'Invalid Supabase URL format. Should be https://xxxxx.supabase.co' };
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const healthRes = await fetch(`${url}/rest/v1/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (healthRes.ok || healthRes.status === 200 || healthRes.status === 404) {
      return { ok: true };
    }
    if (healthRes.status === 401 || healthRes.status === 403) {
      return { ok: false, error: 'Incorrect Supabase URL or Service Role Key (unauthorized).' };
    }
    return { ok: false, error: `Supabase returned HTTP ${healthRes.status}. Project may be paused or misconfigured.` };
  } catch (err: any) {
    const msg = err.message || String(err);
    if (msg.includes('aborted') || msg.includes('timeout')) {
      return { ok: false, error: 'Supabase connection timed out. Project may be paused or unreachable.' };
    }
    if (msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED') || msg.includes('fetch')) {
      return { ok: false, error: 'Supabase project is paused, disabled, or unreachable.' };
    }
    return { ok: false, error: `Supabase connection failed: ${msg.slice(0, 100)}` };
  }
}
