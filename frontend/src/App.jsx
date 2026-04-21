import React, { useState, useEffect } from 'react';
import { Activity, Radio, BarChart3, ShieldAlert, Wifi, ScrollText } from 'lucide-react';
import MissionCommand from './components/MissionCommand';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import ThreatMonitor from './components/ThreatMonitor';
import NetworkOps from './components/NetworkOps';
import EventTimeline from './components/EventTimeline';

const TABS = [
  { id: 'command',   label: 'COMMAND',   icon: Radio },
  { id: 'analytics', label: 'ANALYTICS', icon: BarChart3 },
  { id: 'threats',   label: 'THREATS',   icon: ShieldAlert },
  { id: 'network',   label: 'NETWORK',   icon: Wifi },
  { id: 'timeline',  label: 'EVENTS',    icon: ScrollText },
];

const PANELS = {
  command: MissionCommand,
  analytics: AnalyticsDashboard,
  threats: ThreatMonitor,
  network: NetworkOps,
  timeline: EventTimeline,
};

export default function App() {
  const [data, setData] = useState({
    intents: {},
    packets: [],
    analytics: {
      total_packets: 0,
      total_bytes: 0,
      bps: 0,
      pps: 0,
      uptime: 0,
      throughput_history: [],
      per_mission: {},
    },
    threats: [],
    health: {},
    timeline: [],
  });
  const [status, setStatus] = useState('DISCONNECTED');
  const [tab, setTab] = useState('command');

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/grid');
    ws.onopen = () => setStatus('ONLINE');
    ws.onclose = () => setStatus('DISCONNECTED');
    ws.onerror = () => setStatus('ERROR');
    ws.onmessage = (e) => {
      try {
        setData(JSON.parse(e.data));
      } catch {}
    };
    return () => ws.close();
  }, []);

  const Panel = PANELS[tab];

  return (
    <div className="min-h-screen p-6 font-mono bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-cyan-900/40 pb-4 mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]">
            <Activity className="animate-pulse text-cyan-300" size={28} />
            MISSION DATA GRID
          </h1>
          <p className="text-cyan-800 text-xs mt-1 tracking-[0.25em] uppercase">
            AutoNet Integration Platform / v2.0
          </p>
        </div>
        <div className={`px-3 py-1.5 border rounded text-xs font-bold tracking-widest ${
          status === 'ONLINE'
            ? 'border-emerald-500/50 text-emerald-400 bg-emerald-950/20'
            : 'border-red-500/50 text-red-400 bg-red-950/20'
        }`}>
          {status === 'ONLINE' ? '\u25C9' : '\u25CB'} AUTONET: {status}
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold tracking-wider rounded-t border-b-2 transition-all whitespace-nowrap ${
              tab === id
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/30'
                : 'border-transparent text-slate-600 hover:text-slate-400 hover:bg-slate-900/30'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </nav>

      {/* Active Panel */}
      <Panel data={data} />
    </div>
  );
}
