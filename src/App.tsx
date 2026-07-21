import React, { useEffect, useRef, useState } from 'react';
import { AppProvider, useAppState } from './store/index';
import { useTickets } from './hooks/useTickets';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Toast from './components/Layout/Toast';
import Inbox from './components/Dashboard/Inbox';
import TicketList from './components/Queue/TicketList';
import TicketDetail from './components/Workspace/TicketDetail';
import KEDBLibrary from './components/KEDB/KEDBLibrary';
import IngressStream from './components/Ingress/IngressStream';
import SettingsPanel from './components/Settings/SettingsPanel';
import ProjectAnalyzer from './components/Project/ProjectAnalyzer';
import SetupScreen from './components/Onboarding/SetupScreen';
import { Plus, X, Ticket as TicketIcon, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function AppContent() {
  const { state, dispatch } = useAppState();
  const { fetchInitialData, analyzeTicket } = useTickets();
  const hasAutoAnalyzed = useRef(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [form, setForm] = useState({
    customerName: '', customerEmail: '', company: '', tier: 'Free' as const,
    subject: '', description: '', sentiment: 'Neutral' as const, logs: '',
  });

  useEffect(() => {
    fetchInitialData().then(tickets => {
      if (tickets.length > 0 && !hasAutoAnalyzed.current) {
        hasAutoAnalyzed.current = true;
        setTimeout(() => analyzeTicket(tickets[0].id), 500);
      }
    });
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const payloadLogs = form.logs
      ? form.logs.split('\n').filter(l => l.trim())
      : [`[${new Date().toISOString().replace('T', ' ').slice(0, 19)}] INFO: Diagnostic trace registered.`];

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.customerName || 'Oliver Twist',
          customerEmail: form.customerEmail || 'oliver@example.com',
          company: form.company || 'Twist Logistics Ltd',
          tier: form.tier,
          subject: form.subject,
          description: form.description,
          sentiment: form.sentiment,
          logs: payloadLogs,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        dispatch({ type: 'SET_TICKETS', payload: [created, ...state.tickets] });
        dispatch({ type: 'SET_ACTIVE_TICKET', payload: created.id });
        setIsCreateModalOpen(false);
        setForm({ customerName: '', customerEmail: '', company: '', tier: 'Free', subject: '', description: '', sentiment: 'Neutral', logs: '' });
      }
    } catch { /* ignore */ }
  };

  const renderMainContent = () => {
    switch (state.activeNav) {
      case 'inbox':
        return <Inbox />;
      case 'project':
        return <ProjectAnalyzer />;
      case 'queue':
        return (
          <div className="flex-1 flex overflow-hidden">
            <div className="w-80 border-r border-slate-200 bg-white flex flex-col shrink-0">
              <TicketList onOpenCreate={() => setIsCreateModalOpen(true)} />
            </div>
            <TicketDetail />
          </div>
        );
      case 'kedb':
        return <KEDBLibrary />;
      case 'ingress':
        return <IngressStream />;
      case 'settings':
        return <SettingsPanel />;
    }
  };

  if (state.isOnboarding) {
    return <SetupScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <div className="flex-1 overflow-y-auto">
            {renderMainContent()}
          </div>
        </div>
      </div>

      <Toast />

      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TicketIcon size={16} />
                  <h3 className="font-bold text-sm">Create Customer Ticket</h3>
                </div>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="p-5 overflow-y-auto space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Customer Name</label>
                    <input type="text" placeholder="e.g. Sarah Jenkins" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-900" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Email</label>
                    <input type="email" placeholder="e.g. sarah@example.com" value={form.customerEmail} onChange={e => setForm({ ...form, customerEmail: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-900" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Company</label>
                    <input type="text" placeholder="e.g. Acme Corp" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-900" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Account Tier</label>
                    <select value={form.tier} onChange={e => setForm({ ...form, tier: e.target.value as any })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-900">
                      <option value="Free">Free</option>
                      <option value="SME">SME</option>
                      <option value="Enterprise">Enterprise</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Sentiment</label>
                    <select value={form.sentiment} onChange={e => setForm({ ...form, sentiment: e.target.value as any })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-900">
                      <option value="Neutral">Neutral</option>
                      <option value="Frustrated">Frustrated</option>
                      <option value="Anxious">Anxious</option>
                      <option value="Calm">Calm</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Subject</label>
                    <input type="text" placeholder="Issue summary" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-900" required />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Description</label>
                  <textarea rows={4} placeholder="Describe the issue..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-900" required />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Logs (optional, one per line)</label>
                  <textarea rows={3} placeholder="[2026-06-28] ERROR: Database timeout&#10;[2026-06-28] SEVERE: pool exhaustion" value={form.logs} onChange={e => setForm({ ...form, logs: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono text-[10px]" />
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                  <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 hover:bg-slate-100 text-slate-700 border border-slate-300 rounded transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold shadow flex items-center gap-1.5 transition-colors">
                    <Send size={12} />Create Ticket
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
