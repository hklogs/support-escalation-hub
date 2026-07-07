import { useState, useEffect, useRef } from 'react';
import { useAppState } from '../../store/index';
import { Terminal, Activity } from 'lucide-react';

const SYSTEM_LOGS = [
  { time: '09:00:00', level: 'INFO', message: 'Core system health normal. CPU limit: 41%' },
  { time: '09:01:15', level: 'INFO', message: 'Webhook outbound runner connected to Redis cluster.' },
  { time: '09:02:40', level: 'DEBUG', message: 'Auth database cluster sync completed.' },
  { time: '09:04:10', level: 'INFO', message: 'Ingress request processed (GET /api/v1/health) — 200 OK' },
  { time: '09:05:22', level: 'CRITICAL', message: 'DB Lock detected on table accounts_subscription. Locked by uncommitted session.' },
  { time: '09:06:01', level: 'ERROR', message: 'Pool connection timeout: DB threads saturated. Active: 100/100' },
  { time: '09:06:12', level: 'WARNING', message: 'Sandbox Webhook delivery to Acme Corp failed with 401' },
  { time: '09:07:05', level: 'FATAL', message: 'PSQLException: Cannot obtain connection resource. Pool exhausted.' },
  { time: '09:08:00', level: 'INFO', message: 'Inbound telemetry pipeline synced. Ready.' },
];

export default function IngressStream() {
  const { state } = useAppState();
  const [streamLogs, setStreamLogs] = useState(SYSTEM_LOGS);
  const streamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [streamLogs]);

  const levelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': case 'FATAL': return 'text-rose-400 font-bold';
      case 'ERROR': return 'text-rose-400';
      case 'WARNING': return 'text-amber-400';
      case 'DEBUG': return 'text-sky-400';
      default: return 'text-slate-300';
    }
  };

  const activeTicket = state.tickets.find(t => t.id === state.activeTicketId);
  const ticketLogs = activeTicket?.logs || [];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto w-full">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Ingress Stream</h2>
        <p className="text-xs text-slate-500 mt-1">Live system telemetry and diagnostic log pipeline</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 text-slate-300 rounded-xl border border-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
            <h3 className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-2">
              <Terminal size={14} />System Telemetry v2.10
            </h3>
            <span className="text-[9px] text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-900/40 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />LIVE
            </span>
          </div>
          <div ref={streamRef} className="p-4 font-mono text-[10px] space-y-1.5 h-[500px] overflow-y-auto">
            {streamLogs.map((log, i) => (
              <div key={i} className={`leading-relaxed ${levelColor(log.level)}`}>
                <span className="text-slate-500">[{log.time}]</span> {log.level}: {log.message}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 text-slate-300 rounded-xl border border-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
            <h3 className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-2">
              <Activity size={14} />Ticket Log Context
            </h3>
            <span className="text-[9px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 font-mono">
              {activeTicket ? activeTicket.id : 'NO TICKET'}
            </span>
          </div>
          <div className="p-4 font-mono text-[10px] space-y-1.5 h-[500px] overflow-y-auto">
            {ticketLogs.length > 0 ? ticketLogs.map((log, i) => {
              let color = 'text-slate-300';
              if (log.includes('SEVERE') || log.includes('FATAL') || log.includes('CRITICAL') || log.includes('ERROR')) color = 'text-rose-400';
              else if (log.includes('WARNING') || log.includes('WARN')) color = 'text-amber-400';
              else if (log.includes('DEBUG')) color = 'text-sky-400';
              return <div key={i} className={`leading-relaxed break-all ${color}`}>{log}</div>;
            }) : (
              <div className="text-slate-500 italic">No logs for current ticket.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
