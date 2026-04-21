import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Activity, HardDrive, Zap, Radio, Target, Clock } from 'lucide-react';

function formatBytes(b) {
  if (b == null || b === 0) return '0 B';
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

function formatUptime(s) {
  if (!s) return '0s';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function CustomTooltip({ active, payload }) {
  if (active && payload && payload[0]) {
    return (
      <div className="bg-slate-900 border border-cyan-800/50 px-2 py-1 rounded text-[10px] text-cyan-400">
        {formatBytes(payload[0].value)}/s
      </div>
    );
  }
  return null;
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-4">
      <div className="flex items-center gap-1.5 text-slate-600 text-[10px] mb-1.5 tracking-wider uppercase">
        <Icon size={12} />
        {label}
      </div>
      <div className="text-xl font-bold text-cyan-400">{value}</div>
    </div>
  );
}

export default function AnalyticsDashboard({ data }) {
  const a = data.analytics || {};
  const totalPackets = a.total_packets || 0;
  const totalBytes = a.total_bytes || 0;
  const bps = a.bps || 0;
  const pps = a.pps || 0;
  const uptime = a.uptime || 0;
  const throughput = a.throughput_history || [];
  const perMission = a.per_mission || {};
  const missionCount = Object.keys(data.intents || {}).length;
  const missionData = Object.entries(perMission).map(([id, d]) => ({ id, ...d }));

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Packets" value={totalPackets.toLocaleString()} icon={Activity} />
        <StatCard label="Data Volume" value={formatBytes(totalBytes)} icon={HardDrive} />
        <StatCard label="Throughput" value={`${formatBytes(bps)}/s`} icon={Zap} />
        <StatCard label="Packet Rate" value={`${pps} pkt/s`} icon={Radio} />
        <StatCard label="Missions" value={missionCount} icon={Target} />
        <StatCard label="Uptime" value={formatUptime(uptime)} icon={Clock} />
      </div>

      {/* Throughput Chart */}
      <div className="bg-slate-900/40 border border-cyan-800/40 p-5 rounded-xl">
        <h3 className="text-sm font-semibold text-cyan-300 mb-4 tracking-wider">
          THROUGHPUT OVER TIME
        </h3>
        <div className="h-48">
          {throughput.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={throughput}>
                <defs>
                  <linearGradient id="gradBps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="t" hide />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="bps"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#gradBps)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-cyan-900 text-sm">
              Collecting data...
            </div>
          )}
        </div>
      </div>

      {/* Per-Mission Breakdown */}
      <div className="bg-slate-900/40 border border-cyan-800/40 p-5 rounded-xl">
        <h3 className="text-sm font-semibold text-cyan-300 mb-4 tracking-wider">
          MISSION BREAKDOWN
        </h3>
        {missionData.length === 0 ? (
          <p className="text-cyan-900 text-sm">No mission data yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {missionData.map((m) => {
              const intent = Object.values(data.intents || {}).find(
                (i) => i.mission_id === m.id
              );
              return (
                <div
                  key={m.id}
                  className="bg-slate-950/50 border border-slate-800/30 rounded-lg p-3"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white text-xs font-bold">{m.id}</span>
                    {intent && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded ${
                          intent.level >= 8
                            ? 'bg-red-900/30 text-red-400'
                            : intent.level >= 5
                            ? 'bg-amber-900/30 text-amber-400'
                            : 'bg-cyan-900/30 text-cyan-400'
                        }`}
                      >
                        P{intent.level}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                    <span className="text-slate-600">Packets</span>
                    <span className="text-cyan-400 text-right">{m.packets}</span>
                    <span className="text-slate-600">Volume</span>
                    <span className="text-cyan-400 text-right">
                      {formatBytes(m.bytes)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
