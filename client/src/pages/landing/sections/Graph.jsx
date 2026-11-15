/**
 * Interactive topology graph (used by DiscoverMap).
 * Place at client/src/pages/landing/sections/Graph.jsx
 * The entrance (edges draw, nodes pop) is driven by the DiscoverMap section timeline
 * through the classes .g-edge and .g-node, so it reverses when you scroll back up.
 */
import { useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Activity, Zap } from "lucide-react";
import { IV, CORAL, INK, ease } from "../theme";

export const NODES = {
  gateway: { x: 300, y: 44, label: "api-gateway", note: "Express backend & HTTP/WebSocket gateway managing authentication, room multiplexing, and route dispatching." },
  client: { x: 110, y: 160, label: "react-vite", note: "Interactive canvas featuring real-time chat, Monaco code preview, interactive ER diagrams, and graph visualizers." },
  copilot: { x: 490, y: 160, label: "dionysus-copilot", note: "RAG engine pairing Google Gemini & Pinecone vector search for contextual codebase explanations." },
  db: { x: 200, y: 276, label: "mongodb", note: "Persistent document storage for projects, indexed files, commit history, and chat messages." },
  vec: { x: 400, y: 276, label: "pinecone", note: "High-dimensional vector index providing semantic code retrieval with file and line citations." },
  ws: { x: 300, y: 160, label: "websocket-hub", note: "Low-latency WebSocket gateway powering real-time chat rooms, live typing broadcasts, and instant replies." },
};

export const EDGES = [
  ["client", "gateway"], ["gateway", "ws"], ["gateway", "copilot"],
  ["gateway", "db"], ["copilot", "vec"], ["copilot", "db"],
];

const reach = (id) => {
  const s = new Set([id]);
  const w = (n) => EDGES.forEach(([a, b]) => { if (a === n && !s.has(b)) { s.add(b); w(b); } });
  w(id);
  s.delete(id);
  return s;
};

export default function Graph() {
  const [sel, setSel] = useState("client");
  const calm = useReducedMotion();
  const hit = useMemo(() => reach(sel), [sel]);
  const n = NODES[sel];

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-center">
      <div className="relative">
        <svg viewBox="0 0 600 330" className="w-full h-auto" role="img" aria-label="Service dependency graph">
          {EDGES.map(([a, b], i) => {
            const A = NODES[a];
            const B = NODES[b];
            const dir = B.y >= A.y ? 1 : -1; // upward edges leave from the top of the node
            const d = `M${A.x} ${A.y + 18 * dir} C${A.x} ${(A.y + B.y) / 2 + 10 * dir}, ${B.x} ${(A.y + B.y) / 2 - 10 * dir}, ${B.x} ${B.y - 18 * dir}`;
            const live = (a === sel || hit.has(a)) && hit.has(b);
            return (
              <g key={i}>
                <path
                  className="g-edge"
                  d={d} fill="none" stroke={IV} strokeOpacity={0.22} strokeWidth={1.5}
                  pathLength="1" strokeDasharray="1" strokeDashoffset={calm ? 0 : 1}
                />
                <motion.path
                  d={d} fill="none" stroke={CORAL} strokeWidth={2.5}
                  initial={false}
                  animate={{ pathLength: live ? 1 : 0, opacity: live ? 1 : 0 }}
                  transition={{ duration: 0.4 }}
                />
                {live && !calm && (
                  <circle r="4" fill={CORAL}>
                    <animateMotion dur="1.3s" repeatCount="indefinite" path={d} />
                  </circle>
                )}
              </g>
            );
          })}

          {Object.entries(NODES).map(([id, p]) => {
            const active = id === sel;
            const lit = hit.has(id);
            return (
              <g key={id} className="g-node" data-x={p.x} data-y={p.y}>
                <motion.g
                  tabIndex={0}
                  role="button"
                  aria-label={`Inspect ${p.label}`}
                  className="cursor-pointer outline-none"
                  onClick={() => setSel(id)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSel(id)}
                  style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                  whileHover={{ scale: 1.08 }}
                >
                  {lit && !calm && (
                    <motion.circle
                      cx={p.x} cy={p.y} fill="none" stroke={CORAL} strokeWidth={1.5}
                      initial={{ r: 24, opacity: 0.9 }}
                      animate={{ r: 48, opacity: 0 }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                    />
                  )}
                  <motion.rect
                    x={p.x - 62} y={p.y - 18} width={124} height={36} rx={18} strokeWidth={1.5}
                    animate={{ fill: active ? CORAL : lit ? IV : "#0F4A46" }}
                    stroke={lit || active ? CORAL : IV}
                    strokeOpacity={lit || active ? 1 : 0.3}
                  />
                  <text x={p.x} y={p.y + 4.5} textAnchor="middle" fontSize="12.5" className="dn-m font-medium" fill={active || lit ? INK : IV}>
                    {p.label}
                  </text>
                </motion.g>
              </g>
            );
          })}
        </svg>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={sel}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.22, ease }}
          className="space-y-4 rounded-2xl p-6 glass-dark text-white shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <h3 className="dn-m text-lg font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4" style={{ color: CORAL }} />
              {n.label}
            </h3>
            <span className="dn-m text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 opacity-70">service</span>
          </div>
          <p className="leading-relaxed text-xs sm:text-sm opacity-85">{n.note}</p>
          <div className="pt-3 border-t border-white/10">
            <p className="text-xs sm:text-sm font-semibold flex items-center gap-2" style={{ color: CORAL }}>
              <Zap className="h-4 w-4 shrink-0" />
              {hit.size ? `Impacts ${hit.size} downstream ${hit.size === 1 ? "service" : "services"}.` : "Isolated service (no downstream dependencies)."}
            </p>
          </div>
          <p className="text-[11px] opacity-50">Select any node in the topology map to trace change vectors.</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}