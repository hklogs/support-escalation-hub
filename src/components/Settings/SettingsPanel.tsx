import { useState } from 'react';
import { Settings, Key, Database, Webhook, RefreshCw, Check, AlertCircle } from 'lucide-react';

interface IntegrationCard {
  id: string;
  name: string;
  icon: typeof Key;
  description: string;
  status: 'connected' | 'disconnected' | 'pending';
  fields: { key: string; label: string; placeholder: string }[];
}

const INTEGRATIONS: IntegrationCard[] = [
  {
    id: 'supabase',
    name: 'Supabase',
    icon: Database,
    description: 'Persistent storage for tickets, logs, and KEDB articles.',
    status: 'disconnected',
    fields: [
      { key: 'SUPABASE_URL', label: 'Project URL', placeholder: 'https://xxxxx.supabase.co' },
      { key: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Service Role Key', placeholder: 'eyJhbGciOi...' },
    ],
  },
  {
    id: 'gemini',
    name: 'Gemini AI',
    icon: Key,
    description: 'Google Gemini API for autonomous ticket analysis.',
    status: 'disconnected',
    fields: [
      { key: 'GEMINI_API_KEY', label: 'API Key', placeholder: 'AIzaSy...' },
    ],
  },
  {
    id: 'stripe',
    name: 'Stripe',
    icon: Webhook,
    description: 'Payment processing and webhook event integration.',
    status: 'disconnected',
    fields: [
      { key: 'STRIPE_SECRET_KEY', label: 'Secret Key', placeholder: 'sk_live_...' },
      { key: 'STRIPE_WEBHOOK_SECRET', label: 'Webhook Secret', placeholder: 'whsec_...' },
    ],
  },
];

export default function SettingsPanel() {
  const [integrations, setIntegrations] = useState(INTEGRATIONS);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const handleSave = async (integrationId: string) => {
    setSaving(integrationId);
    const integ = integrations.find(i => i.id === integrationId);
    if (!integ) return;

    try {
      for (const field of integ.fields) {
        const val = values[field.key];
        if (val) {
          await fetch('/api/credentials/store', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: field.key, value: val }),
          });
        }
      }
      setIntegrations(prev => prev.map(i => i.id === integrationId ? { ...i, status: 'connected' as const } : i));
      setSaved(integrationId);
      setTimeout(() => setSaved(null), 3000);
    } catch { /* ignore */ }
    setSaving(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto w-full">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Settings & Integrations</h2>
        <p className="text-xs text-slate-500 mt-1">Configure external service connections</p>
      </div>

      <div className="space-y-4">
        {integrations.map(integ => {
          const Icon = integ.icon;
          return (
            <div key={integ.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${integ.status === 'connected' ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                    <Icon size={18} className={integ.status === 'connected' ? 'text-emerald-600' : 'text-slate-500'} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{integ.name}</h3>
                    <p className="text-xs text-slate-500">{integ.description}</p>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 ${
                  integ.status === 'connected' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}>
                  {integ.status === 'connected' ? <Check size={10} /> : <AlertCircle size={10} />}
                  {integ.status === 'connected' ? 'Connected' : 'Not Configured'}
                </span>
              </div>

              <div className="space-y-3">
                {integ.fields.map(field => (
                  <div key={field.key}>
                    <label className="text-xs font-medium text-slate-700 block mb-1">{field.label}</label>
                    <input
                      type="password"
                      placeholder={field.placeholder}
                      value={values[field.key] || ''}
                      onChange={e => setValues({ ...values, [field.key]: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => handleSave(integ.id)}
                  disabled={saving === integ.id}
                  className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs px-4 py-2 rounded-lg font-medium flex items-center gap-1.5 shadow transition-all duration-200"
                >
                  {saving === integ.id ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : saved === integ.id ? (
                    <Check size={12} />
                  ) : null}
                  {saving === integ.id ? 'Saving...' : saved === integ.id ? 'Saved' : 'Save & Connect'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
