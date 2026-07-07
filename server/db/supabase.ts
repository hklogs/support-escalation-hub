let client: any = null;
let initPromise: Promise<any> | null = null;

export async function getSupabaseClient() {
  if (client) return client;
  if (initPromise) return initPromise;

  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseKey ||
      supabaseUrl === 'MY_SUPABASE_URL' || supabaseKey === 'MY_SUPABASE_SERVICE_ROLE_KEY') {
    console.warn('Supabase credentials not configured. Falling back to in-memory store.');
    client = null;
    return null;
  }

  initPromise = (async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      let wsModule: any = undefined;
      try {
        wsModule = await import('ws');
      } catch { /* ws not available, skip */ }

      client = createClient(supabaseUrl, supabaseKey, wsModule?.default ? {
        realtime: { transport: wsModule.default },
      } : undefined);
      return client;
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', (err as Error).message);
      client = null;
      return null;
    }
  })();

  return initPromise;
}
