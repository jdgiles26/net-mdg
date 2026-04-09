import React, { useState, useEffect } from 'react';
import { Shield, Activity, Network, Cpu, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const [gridState, setGridState] = useState({ intents: {}, packets: [] });
  const [connectionStatus, setConnectionStatus] = useState('DISCONNECTED');

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/grid');

    ws.onopen = () => setConnectionStatus('ONLINE_SECURE');
    ws.onclose = () => setConnectionStatus('DISCONNECTED');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setGridState(data);
    };

    return () => ws.close();
  }, []);

  const activeMissions = Object.entries(gridState.intents);

  // Group packets by mission for stats
  const packetStats = gridState.packets.reduce((acc, pkt) => {
    const mid = pkt.mission_id || 'UNKNOWN';
    if (!acc[mid]) acc[mid] = { count: 0, fragmented: 0, totalBytes: 0 };
    acc[mid].count++;
    if (pkt.fragmented) acc[mid].fragmented++;
    acc[mid].totalBytes += pkt.size;
    return acc;
  }, {});

  return (
    <div className="min-h-screen p-8 font-mono bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      {/* Header Area */}
      <header className="flex justify-between items-center border-b border-cyan-900/50 pb-6 mb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tighter flex items-center gap-4 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
            <Activity className="animate-pulse text-cyan-300" size={36} /> 
            MISSION DATA GRID
          </h1>
          <p className="text-cyan-700 text-sm mt-1 tracking-widest uppercase">Edge Sensor Connector / Intent Engine v4.0</p>
        </div>
        <div className="flex gap-4">
          <div className={`px-4 py-2 border rounded text-xs font-bold tracking-widest shadow-[0_0_10px_rgba(0,0,0,0.5)] ${
            connectionStatus === 'ONLINE_SECURE' ? 'border-emerald-500 text-emerald-400 bg-emerald-950/30' : 'border-red-500 text-red-400 bg-red-950/30'
          }`}>
            AUTONET STATUS: {connectionStatus}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Autonet Intents */}
        <div className="col-span-1 space-y-6">
          <div className="bg-slate-900/40 border border-cyan-800/60 p-6 rounded-xl backdrop-blur-sm">
            <h2 className="text-xl mb-6 flex items-center gap-3 font-semibold text-cyan-300">
              <Network size={22}/> ACTIVE INTENTS
            </h2>
            <div className="space-y-4">
              {activeMissions.length === 0 && <p className="text-cyan-800 text-sm italic">Awaiting Autonet Signals...</p>}
              <AnimatePresence>
                {activeMissions.map(([port, data]) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={port} 
                    className={`border-l-4 p-4 rounded-r-lg bg-gradient-to-r ${
                      data.level >= 8 ? 'border-red-500 from-red-950/40' : 'border-amber-500 from-amber-950/40'
                    } to-transparent`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-white flex items-center gap-2">
                        {data.level >= 8 && <Zap size={14} className="text-red-400" />}
                        {data.mission_id}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-sm ${data.level >= 8 ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'}`}>
                        PRIORITY {data.level}
                      </span>
                    </div>
                    <div className="text-xs space-y-1">
                      <p className="text-slate-400">PORT: <span className="text-cyan-300">{data.port}</span></p>
                      <p className="text-slate-400">INTENT: <span className="text-cyan-300">{data.intent}</span></p>
                      {packetStats[data.mission_id] && (
                        <p className="text-slate-500 mt-2 pt-2 border-t border-slate-800">
                          Packets: {packetStats[data.mission_id].count} | 
                          Frag: {packetStats[data.mission_id].fragmented} |
                          {(packetStats[data.mission_id].totalBytes / 1024).toFixed(1)} KB
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Columns: SDNROUTE Visualizer */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <div className="bg-slate-900/40 border border-cyan-800/60 p-6 rounded-xl backdrop-blur-sm h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl flex items-center gap-3 font-semibold text-cyan-300">
                <Cpu size={22}/> SDNROUTE INTERCEPT STREAM
              </h2>
              <Shield className="text-cyan-700" size={24}/>
            </div>

            {/* Real-Time Packet Flow Visualizer */}
            <div className="flex-1 bg-slate-950/50 rounded border border-cyan-900/30 p-4 relative overflow-hidden flex items-end gap-[2px]">
              {gridState.packets.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-cyan-800 text-sm">No packets intercepted in current intent window.</div>
              )}
              {gridState.packets.map((pkt) => {
                // Calculate visualization height based on packet size (max 1000 bytes simulated)
                const heightPercent = Math.min(Math.max((pkt.size / 1000) * 100, 10), 100);
                
                return (
                  <motion.div
                    key={pkt.id}
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    className={`w-full rounded-t-sm origin-bottom ${
                      pkt.priority >= 8 ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]' :
                      pkt.priority >= 5 ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' :
                      'bg-cyan-500'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                    title={`${pkt.mission_id || 'Unknown'} | ${pkt.size} bytes | P${pkt.priority}`}
                  >
                    {/* Fragmentation Indicator */}
                    {pkt.fragmented && (
                      <div className="absolute top-0 w-full h-1 bg-white animate-pulse" />
                    )}
                  </motion.div>
                );
              })}
            </div>

            <div className="flex justify-between items-center mt-4 text-xs font-bold text-cyan-700 uppercase tracking-widest">
              <span>Time Domain Analysis</span>
              <div className="flex gap-4">
                <span className="flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_5px_red]"/> Critical (P8-10)</span>
                <span className="flex items-center gap-2"><div className="w-2 h-2 bg-amber-400 rounded-full shadow-[0_0_5px_orange]"/> High (P5-7)</span>
                <span className="flex items-center gap-2 border-b border-white pb-[1px]">White Cap = Fragmented</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
