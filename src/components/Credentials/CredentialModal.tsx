import React, { useState } from 'react';
import { useAppState } from '../../store/index';
import { motion, AnimatePresence } from 'motion/react';
import { Key, X, Shield, RefreshCw, Check } from 'lucide-react';

export default function CredentialModal() {
  const { state, dispatch } = useAppState();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      for (const key of state.missingCredentials) {
        const val = values[key];
        if (val) {
          await fetch('/api/credentials/store', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value: val }),
          });
        }
      }
      dispatch({ type: 'SET_CREDENTIAL_MODAL', payload: { open: false, missing: [] } });
      dispatch({ type: 'SHOW_TOAST', payload: 'Credentials saved successfully.' });
    } catch {
      dispatch({ type: 'SHOW_TOAST', payload: 'Error saving credentials.' });
    }
    setSaving(false);
  };

  return (
    <AnimatePresence>
      {state.isCredentialModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
          >
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500 p-2 rounded-lg">
                  <Shield size={18} className="text-slate-900" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Credentials Required</h3>
                  <p className="text-[10px] text-slate-400">Configure service integrations</p>
                </div>
              </div>
              <button
                onClick={() => dispatch({ type: 'SET_CREDENTIAL_MODAL', payload: { open: false, missing: [] } })}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <p className="text-xs text-slate-600">
                The following credentials are missing. They will be stored securely and used for API integrations.
              </p>

              {state.missingCredentials.map(key => (
                <div key={key} className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                    <Key size={12} className="inline mr-1" />
                    {key.replace(/_/g, ' ')}
                  </label>
                  <input
                    type="password"
                    placeholder={`Enter ${key}`}
                    value={values[key] || ''}
                    onChange={e => setValues({ ...values, [key]: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    required
                  />
                </div>
              ))}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_CREDENTIAL_MODAL', payload: { open: false, missing: [] } })}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  Skip for now
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white text-xs px-5 py-2.5 rounded-lg font-semibold shadow flex items-center gap-2 transition-all"
                >
                  {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  {saving ? 'Saving...' : 'Save Credentials'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
