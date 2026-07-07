import { useState, useEffect } from 'react';
import { useAppState } from '../../store/index';
import { useTickets } from '../../hooks/useTickets';
import AgentOutput from './AgentOutput';
import { Bot, User, Terminal, Cpu } from 'lucide-react';

export default function TicketDetail() {
  const { state } = useAppState();
  const { handleRunAgent, isAnalyzing } = useTickets();
  const activeTicket = state.tickets.find(t => t.id === state.activeTicketId);

  if (!activeTicket) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        <div className="text-center max-w-sm space-y-3">
          <div className="bg-slate-100 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
            <Cpu size={36} className="text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-800">No Ticket Selected</h3>
          <p className="text-xs">Select a ticket from the queue to load the escalation workspace.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border">{activeTicket.id}</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
                  { Enterprise: 'bg-purple-100 text-purple-800 border-purple-200', SME: 'bg-blue-100 text-blue-800 border-blue-200', Free: 'bg-gray-100 text-gray-800 border-gray-200' }[activeTicket.tier]
                }`}>{activeTicket.tier}</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
                  { Open: 'bg-orange-100 text-orange-800 border-orange-200', Resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200', Escalated: 'bg-rose-100 text-rose-800 border-rose-200 font-semibold', 'In Progress': 'bg-blue-100 text-blue-800 border-blue-200' }[activeTicket.status]
                }`}>{activeTicket.status}</span>
              </div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight pt-1">{activeTicket.subject}</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1"><User size={12} />{activeTicket.customerName} ({activeTicket.company})</span>
                <span className="font-mono">{activeTicket.customerEmail}</span>
              </div>
            </div>
            {!activeTicket.assignedTier && (
              <button
                onClick={handleRunAgent}
                disabled={isAnalyzing}
                className="shrink-0 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white px-4 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2 shadow transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
              >
                <Bot size={14} className={isAnalyzing ? 'animate-spin' : ''} />
                {isAnalyzing ? 'Processing...' : 'Run AI Escalation Agent'}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-semibold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
              <User size={14} />Customer Inquiry
            </h3>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
              {activeTicket.description}
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Environment: <span className="font-mono text-[10px]">{activeTicket.environment}</span></span>
            </div>
          </div>

          <div className="bg-slate-900 text-slate-300 p-5 rounded-xl border border-slate-800 shadow-sm flex flex-col h-[280px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 shrink-0">
              <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                <Terminal size={14} />Diagnostic Logs
              </h3>
              <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700 font-mono">LOG_STREAM: ACTIVE</span>
            </div>
            <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
              {activeTicket.logs.map((log, i) => {
                let color = 'text-slate-300';
                if (log.includes('SEVERE') || log.includes('FATAL') || log.includes('CRITICAL') || log.includes('ERROR')) color = 'text-rose-400';
                else if (log.includes('WARNING') || log.includes('WARN')) color = 'text-amber-400';
                else if (log.includes('DEBUG')) color = 'text-sky-400';
                return <div key={i} className={`leading-relaxed break-all ${color}`}>{log}</div>;
              })}
            </div>
          </div>
        </div>

        <AgentOutput ticket={activeTicket} />
      </div>
    </div>
  );
}
