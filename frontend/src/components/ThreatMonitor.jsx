import React from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

const SEVERITY_STYLES = {
  CRITICAL: 'border-red-500 bg-red-950/30 text-red-400',
  HIGH: 'border-orange-500 bg-orange-950/30 text-orange-400',
  MEDIUM: 'border-amber-500 bg-amber-950/30 text-amber-400',
  LOW: 'border-cyan-500 bg-cyan-950/30 text-cyan-400',
};

const SEVERITY_BADGE = {
  CRITICAL: 'bg-red-500/20 text-red-300 border-red-500/30',
  HIGH: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  MEDIUM: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  LOW: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
};

const RULES = [
  {
    name: 'HIGH_FREQ_BURST',
    description: '>5 packets in 3s window per mission',
    severity: 'HIGH',
  },
  {
    name: 'OVERSIZED_PAYLOAD',
    description: 'Packet exceeds 700B threshold',
    severity: 'MEDIUM',
  },
  {
    name: 'FRAG_STORM',
    description: '>=3 fragmented packets in recent window',
    severity: 'CRITICAL',
  },
];

function timeAgo(ts) {
  const s = Math.floor(Date.now() / 1000 - ts);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export default function ThreatMonitor({ data }) {
  const threats = [...(data.threats || [])].reverse();
  const critCount = threats.filter((t) => t.severity === 'CRITICAL').length;
  const highCount = threats.filter((t) => t.severity === 'HIGH').length;
  const medCount = threats.length - critCount - highCount;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Rules & Summary */}
      <div className="space-y-4">
        <div className="bg-slate-900/40 border border-cyan-800/40 p-5 rounded-xl">
          <h3 className="text-sm font-semibold text-cyan-300 mb-4 tracking-wider flex items-center gap-2">
            <ShieldCheck size={16} /> DETECTION RULES
          </h3>
          <div className="space-y-3">
            {RULES.map((r) => (
              <div
                key={r.name}
                className={`border-l-2 p-3 rounded-r ${SEVERITY_STYLES[r.severity]}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-white">{r.name}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-900/30 text-emerald-400 border border-emerald-500/20">
                    ACTIVE
                  </span>
                </div>
                <p className="text-[10px] opacity-70">{r.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/40 border border-cyan-800/40 p-5 rounded-xl">
          <h3 className="text-sm font-semibold text-cyan-300 mb-3 tracking-wider">
            SUMMARY
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Total Alerts</span>
              <span className="text-cyan-400">{threats.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-400">Critical</span>
              <span className="text-red-400">{critCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-orange-400">High</span>
              <span className="text-orange-400">{highCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-400">Medium</span>
              <span className="text-amber-400">{medCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Feed */}
      <div className="lg:col-span-2">
        <div className="bg-slate-900/40 border border-cyan-800/40 p-5 rounded-xl h-full">
          <h3 className="text-sm font-semibold text-cyan-300 mb-4 tracking-wider flex items-center gap-2">
            <AlertTriangle size={16} /> ALERT FEED
          </h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {threats.length === 0 && (
              <p className="text-cyan-900 text-sm italic">No alerts detected.</p>
            )}
            {threats.map((t, i) => (
              <div
                key={`${t.id}-${i}`}
                className={`border-l-2 p-3 rounded-r bg-slate-950/50 ${
                  SEVERITY_STYLES[t.severity] || SEVERITY_STYLES.LOW
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded border ${
                        SEVERITY_BADGE[t.severity] || SEVERITY_BADGE.LOW
                      }`}
                    >
                      {t.severity}
                    </span>
                    <span className="text-xs font-bold text-white">{t.rule}</span>
                  </div>
                  <span className="text-[10px] text-slate-600">
                    {timeAgo(t.timestamp)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{t.message}</p>
                <span className="text-[9px] text-slate-600 mt-1 inline-block">
                  {t.mission_id}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
