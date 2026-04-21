import React from 'react';
import { Wifi, Lock, Eye, Layers, Signal } from 'lucide-react';

function HealthBar({ score }) {
  const color =
    score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500';
  const glow =
    score >= 70
      ? 'shadow-[0_0_6px_rgba(16,185,129,0.4)]'
      : score >= 40
      ? 'shadow-[0_0_6px_rgba(245,158,11,0.4)]'
      : 'shadow-[0_0_6px_rgba(239,68,68,0.4)]';
  return (
    <div className="w-full bg-slate-800 rounded-full h-2">
      <div
        className={`h-2 rounded-full ${color} ${glow} transition-all duration-500`}
        style={{ width: `${Math.max(score, 2)}%` }}
      />
    </div>
  );
}

const STATUS_BADGE = {
  ACTIVE: 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30',
  DEGRADED: 'bg-amber-900/30 text-amber-400 border-amber-500/30',
  DOWN: 'bg-red-900/30 text-red-400 border-red-500/30',
};

export default function NetworkOps({ data }) {
  const missions = Object.values(data.health || {});
  const avgScore = missions.length
    ? (missions.reduce((s, m) => s + m.score, 0) / missions.length).toFixed(1)
    : 0;
  const activeCount = missions.filter((m) => m.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/40 border border-cyan-800/40 p-5 rounded-xl text-center">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">
            System Health
          </p>
          <p className="text-4xl font-black text-cyan-400">
            {avgScore}
            <span className="text-lg text-cyan-700">%</span>
          </p>
        </div>
        <div className="bg-slate-900/40 border border-cyan-800/40 p-5 rounded-xl text-center">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">
            Active Links
          </p>
          <p className="text-4xl font-black text-emerald-400">
            {activeCount}
            <span className="text-lg text-emerald-700">/{missions.length}</span>
          </p>
        </div>
        <div className="bg-slate-900/40 border border-cyan-800/40 p-5 rounded-xl text-center">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">
            Encrypted Channels
          </p>
          <p className="text-4xl font-black text-cyan-400">{missions.length}</p>
        </div>
      </div>

      {/* Mission Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {missions.length === 0 && (
          <p className="text-cyan-900 text-sm italic col-span-full">
            No mission data.
          </p>
        )}
        {missions.map((m) => (
          <div
            key={m.mission_id}
            className="bg-slate-900/40 border border-slate-800/40 p-4 rounded-xl"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-white">{m.mission_id}</span>
              <span
                className={`text-[9px] px-2 py-0.5 rounded border ${
                  STATUS_BADGE[m.status] || STATUS_BADGE.DOWN
                }`}
              >
                {m.status}
              </span>
            </div>

            <div className="mb-3">
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-slate-500">Health</span>
                <span className="text-cyan-400">{m.score}%</span>
              </div>
              <HealthBar score={m.score} />
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px]">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Signal size={10} /> Latency
              </div>
              <span className="text-cyan-400 text-right">{m.latency_ms}ms</span>

              <div className="flex items-center gap-1.5 text-slate-500">
                <Signal size={10} /> Jitter
              </div>
              <span className="text-cyan-400 text-right">{m.jitter_ms}ms</span>

              <div className="flex items-center gap-1.5 text-slate-500">
                <Lock size={10} /> Encrypt
              </div>
              <span className="text-cyan-400 text-right">{m.encryption}</span>

              <div className="flex items-center gap-1.5 text-slate-500">
                <Eye size={10} /> Obfuscate
              </div>
              <span className="text-cyan-400 text-right">{m.obfuscation}</span>

              <div className="flex items-center gap-1.5 text-slate-500">
                <Layers size={10} /> Tunnel
              </div>
              <span className="text-cyan-400 text-right">{m.tunnel}</span>

              <div className="flex items-center gap-1.5 text-slate-500">
                <Wifi size={10} /> Port
              </div>
              <span className="text-cyan-400 text-right">{m.port}</span>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800/50 flex justify-between text-[9px] text-slate-600">
              <span>{m.packets} pkts</span>
              <span>{((m.bytes || 0) / 1024).toFixed(1)} KB</span>
              <span>{m.threats} threats</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
