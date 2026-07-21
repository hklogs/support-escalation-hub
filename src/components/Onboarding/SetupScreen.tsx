import React, { useState, useEffect } from 'react';
import { useAppState } from '../../store/index';
import { Key, Database, RefreshCw, Check, Shield, Activity, XCircle, AlertTriangle, Sparkles, ArrowRight, Loader, FolderCode } from 'lucide-react';

interface MissingCred {
  service: string;
  key: string;
  description: string;
  envVar: string;
}

type FieldStatus = 'empty' | 'filled' | 'testing' | 'valid' | 'warning' | 'invalid';
type PageStep = 'checking' | 'form' | 'done';

export default function SetupScreen() {
  const { dispatch } = useAppState();
  const [missing, setMissing] = useState<MissingCred[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, FieldStatus>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pageStep, setPageStep] = useState<PageStep>('checking');
  const [isVerifying, setIsVerifying] = useState(false);

  const REQUIRED_SERVICES = ['supabase', 'gemini'];

  useEffect(() => {
    fetch('/api/credentials/check')
      .then(r => r.json())
      .then(data => {
        const essential = (data.missing || []).filter((c: MissingCred) => REQUIRED_SERVICES.includes(c.service));
        if (essential.length > 0) {
          setMissing(essential);
          const initialStatus: Record<string, FieldStatus> = {};
          const initialValues: Record<string, string> = {};
          for (const c of essential) {
            initialStatus[c.key] = 'empty';
            initialValues[c.key] = '';
          }
          setStatuses(initialStatus);
          setValues(initialValues);
          setPageStep('form');
        } else {
          setPageStep('done');
          setTimeout(() => dispatch({ type: 'SET_ONBOARDING_DONE' }), 800);
        }
      })
      .catch(() => {
        const fallback: MissingCred[] = [
          { service: 'supabase', key: 'SUPABASE_URL', description: 'Supabase Project URL', envVar: 'SUPABASE_URL' },
          { service: 'supabase', key: 'SUPABASE_SERVICE_ROLE_KEY', description: 'Supabase Service Role Key', envVar: 'SUPABASE_SERVICE_ROLE_KEY' },
          { service: 'gemini', key: 'GEMINI_API_KEY', description: 'Google Gemini API Key', envVar: 'GEMINI_API_KEY' },
        ];
        setMissing(fallback);
        const initialStatus: Record<string, FieldStatus> = {};
        const initialValues: Record<string, string> = {};
        for (const c of fallback) {
          initialStatus[c.key] = 'empty';
          initialValues[c.key] = '';
        }
        setStatuses(initialStatus);
        setValues(initialValues);
        setPageStep('form');
      });
  }, []);

  const handleValueChange = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
    setStatuses(prev => ({ ...prev, [key]: value.trim() ? 'filled' : 'empty' }));
    if (errors[key]) {
      setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
    }
  };

  const testGemini = async (apiKey: string): Promise<boolean> => {
    setStatuses(prev => ({ ...prev, GEMINI_API_KEY: 'testing' }));
    try {
      const res = await fetch('/api/credentials/test/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      const data = await res.json();
      if (data.ok && !data.error) {
        setStatuses(prev => ({ ...prev, GEMINI_API_KEY: 'valid' }));
        return true;
      } else if (data.ok && data.error) {
        setStatuses(prev => ({ ...prev, GEMINI_API_KEY: 'warning' }));
        setErrors(prev => ({ ...prev, GEMINI_API_KEY: data.error }));
        return true;
      } else {
        setStatuses(prev => ({ ...prev, GEMINI_API_KEY: 'invalid' }));
        setErrors(prev => ({ ...prev, GEMINI_API_KEY: data.error || 'Gemini API connection failed.' }));
        return false;
      }
    } catch {
      setStatuses(prev => ({ ...prev, GEMINI_API_KEY: 'invalid' }));
      setErrors(prev => ({ ...prev, GEMINI_API_KEY: 'Network error testing Gemini connection.' }));
      return false;
    }
  };

  const testSupabase = async (url: string, key: string): Promise<boolean> => {
    setStatuses(prev => ({ ...prev, SUPABASE_URL: 'testing', SUPABASE_SERVICE_ROLE_KEY: 'testing' }));
    try {
      const res = await fetch('/api/credentials/test/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, serviceRoleKey: key }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatuses(prev => ({ ...prev, SUPABASE_URL: 'valid', SUPABASE_SERVICE_ROLE_KEY: 'valid' }));
        return true;
      } else {
        setStatuses(prev => ({ ...prev, SUPABASE_URL: 'invalid', SUPABASE_SERVICE_ROLE_KEY: 'invalid' }));
        const errMsg = data.error || 'Supabase connection failed.';
        setErrors(prev => ({ ...prev, SUPABASE_URL: errMsg, SUPABASE_SERVICE_ROLE_KEY: errMsg }));
        return false;
      }
    } catch {
      setStatuses(prev => ({ ...prev, SUPABASE_URL: 'invalid', SUPABASE_SERVICE_ROLE_KEY: 'invalid' }));
      setErrors(prev => ({ ...prev, SUPABASE_URL: 'Network error testing Supabase connection.', SUPABASE_SERVICE_ROLE_KEY: 'Network error testing Supabase connection.' }));
      return false;
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);

    const supabaseUrl = values['SUPABASE_URL']?.trim();
    const supabaseKey = values['SUPABASE_SERVICE_ROLE_KEY']?.trim();
    const geminiKey = values['GEMINI_API_KEY']?.trim();

    const hasSupabaseUrl = missing.some(c => c.key === 'SUPABASE_URL');
    const hasSupabaseKey = missing.some(c => c.key === 'SUPABASE_SERVICE_ROLE_KEY');
    const hasGemini = missing.some(c => c.key === 'GEMINI_API_KEY');

    const results: boolean[] = [];

    if (hasGemini && geminiKey) {
      results.push(await testGemini(geminiKey));
    }
    if ((hasSupabaseUrl || hasSupabaseKey) && supabaseUrl && supabaseKey) {
      results.push(await testSupabase(supabaseUrl, supabaseKey));
    }

    const allOk = results.length > 0 && results.every(Boolean);

    if (allOk) {
      for (const cred of missing) {
        const val = values[cred.key]?.trim();
        if (val) {
          await fetch('/api/credentials/store', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: cred.key, value: val }),
          });
        }
      }
      setPageStep('done');
      setTimeout(() => dispatch({ type: 'SET_ONBOARDING_DONE' }), 1200);
    }

    setIsVerifying(false);
  };

  const hasAllFilled = missing.every(c => values[c.key]?.trim());
  const hasAnyFailed = Object.values(statuses).some(s => s === 'invalid');
  const hasAnyWarning = Object.values(statuses).some(s => s === 'warning');
  const allValid = Object.values(statuses).some(s => s === 'valid' || s === 'filled' || s === 'warning') && !hasAnyFailed;

  const classify = (s: string) => {
    if (s.includes('supabase') || s.includes('SUPABASE')) return { icon: Database, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', name: 'Supabase' };
    if (s.includes('gemini') || s.includes('GEMINI')) return { icon: Sparkles, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', name: 'Gemini AI' };
    return { icon: Key, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', name: 'Integration' };
  };

  if (pageStep === 'checking') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader className="animate-spin mx-auto text-emerald-400" size={28} />
          <p className="text-slate-400 text-sm">Checking configuration...</p>
        </div>
      </div>
    );
  }

  if (pageStep === 'done') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-emerald-500/10 p-4 rounded-full w-20 h-20 mx-auto border border-emerald-500/20 flex items-center justify-center">
            <Check className="text-emerald-400" size={36} />
          </div>
          <h2 className="text-2xl font-bold text-white">All Systems Verified!</h2>
          <p className="text-slate-400 text-sm">Launching your Support Escalation Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8 space-y-3">
          <div className="bg-emerald-500/10 p-3 rounded-full w-16 h-16 mx-auto border border-emerald-500/20 flex items-center justify-center">
            <Shield className="text-emerald-400" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-white">Support Escalation Hub</h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Configure your service integrations to unlock the dashboard. Credentials are verified in real-time.
          </p>
        </div>

        <form onSubmit={handleVerify} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 backdrop-blur-sm">
          <div className="space-y-5">
            {missing.map(cred => {
              const cls = classify(cred.service);
              const Icon = cls.icon;
              const status = statuses[cred.key] || 'empty';
              const error = errors[cred.key];

              return (
                <div key={cred.key}>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-1.5">
                    <Icon size={14} className={cls.color.split(' ')[0]} />
                    <span>{cls.name} — {cred.description}</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder={`Enter your ${cred.key}`}
                      value={values[cred.key] || ''}
                      onChange={e => handleValueChange(cred.key, e.target.value)}
                      className={`w-full text-sm p-3 pr-10 bg-slate-950 border rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-all ${
                        status === 'invalid'
                          ? 'border-rose-500/60 focus:ring-rose-500/30 focus:border-rose-500'
                          : status === 'warning'
                          ? 'border-amber-500/60 focus:ring-amber-500/30 focus:border-amber-500'
                          : status === 'valid'
                          ? 'border-emerald-500/60 focus:ring-emerald-500/30 focus:border-emerald-500'
                          : 'border-slate-700 focus:ring-emerald-500/30 focus:border-emerald-500'
                      }`}
                      required
                      autoComplete="off"
                      disabled={isVerifying}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      {status === 'testing' && <Loader size={16} className="animate-spin text-blue-400" />}
                      {status === 'valid' && <Check size={16} className="text-emerald-400" />}
                      {status === 'warning' && <AlertTriangle size={16} className="text-amber-400" />}
                      {status === 'invalid' && <XCircle size={16} className="text-rose-400" />}
                      {status === 'empty' && values[cred.key]?.trim() && <Activity size={16} className="text-slate-500" />}
                    </span>
                  </div>
                  {status === 'invalid' && error && (
                    <div className="mt-1.5 flex items-start gap-1.5 text-xs text-rose-400">
                      <XCircle size={12} className="mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  {status === 'warning' && error && (
                    <div className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-400">
                      <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  {status === 'valid' && (
                    <div className="mt-1.5 text-xs text-emerald-400 flex items-center gap-1.5">
                      <Check size={12} />
                      <span>Connection verified</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-800 pt-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Verification status</span>
              <span className={`font-medium flex items-center gap-1.5 ${
                hasAnyFailed ? 'text-rose-400' : hasAnyWarning ? 'text-amber-400' : allValid ? 'text-emerald-400' : 'text-slate-400'
              }`}>
                {hasAnyFailed ? (
                  <><XCircle size={12} /> Some checks failed</>
                ) : hasAnyWarning ? (
                  <><AlertTriangle size={12} /> Connected with warnings</>
                ) : allValid ? (
                  <><Check size={12} /> Ready to launch</>
                ) : (
                  <><Activity size={12} /> Fill in all fields</>
                )}
              </span>
            </div>

            <button
              type="submit"
              disabled={!hasAllFilled || isVerifying}
              className={`w-full font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-lg text-sm ${
                hasAnyFailed
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20 hover:-translate-y-0.5 active:scale-95'
                  : hasAnyWarning
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20 hover:-translate-y-0.5 active:scale-95'
                  : 'bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white disabled:text-slate-400 shadow-emerald-600/20 disabled:shadow-none hover:-translate-y-0.5 active:scale-95 disabled:active:scale-100 disabled:hover:translate-y-0'
              }`}
            >
              {isVerifying ? (
                <><RefreshCw size={16} className="animate-spin" /> Verifying connections...</>
              ) : hasAnyFailed ? (
                <><RefreshCw size={16} /> Retry Failed & Launch</>
              ) : hasAnyWarning ? (
                <><ArrowRight size={16} /> Launch Anyway</>
              ) : (
                <><ArrowRight size={16} /> Verify & Launch</>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: 'SET_ONBOARDING_DONE' });
                  dispatch({ type: 'SET_NAV', payload: 'project' });
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2.5 px-3 rounded-xl font-medium flex items-center justify-center gap-1.5 shadow transition-all hover:-translate-y-0.5"
              >
                <FolderCode size={14} />
                <span>Upload Project</span>
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_ONBOARDING_DONE' })}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2.5 px-3 rounded-xl font-medium flex items-center justify-center gap-1.5 border border-slate-700 transition-all hover:-translate-y-0.5"
              >
                <ArrowRight size={14} />
                <span>Quick Start Mode</span>
              </button>
            </div>

            {hasAnyFailed && (
              <p className="text-[10px] text-slate-500 text-center">
                Fix the errors above and retry, or use Upload Project / Quick Start Mode to test offline.
              </p>
            )}
          </div>
        </form>

        <p className="text-[10px] text-slate-600 text-center mt-4">
          Credentials are stored in-memory for the session. Re-enter after server restart.
        </p>
      </div>
    </div>
  );
}

