import { useState } from "react";

export default function GraficaVentas({ data }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const W = 900, H = 360;
  const pad = { l: 42, r: 14, t: 14, b: 26 };
  const iW = W - pad.l - pad.r;
  const iH = H - pad.t - pad.b;
  const max = Math.max(...data.map((d) => d.monto), 1);
  const xStep = data.length > 1 ? iW / (data.length - 1) : iW;
  const y = (v) => pad.t + iH - (v / max) * iH;
  const pts = data.map((d, i) => [pad.l + i * xStep, y(d.monto)]);
  const linea = pts.map((p, i) => (i ? `L${p[0]},${p[1]}` : `M${p[0]},${p[1]}`)).join(" ");
  const area  = `${linea} L${pts[pts.length - 1][0]},${pad.t + iH} L${pts[0][0]},${pad.t + iH} Z`;
  const ticks = [0, 0.33, 0.66, 1].map((t) => Math.round(max * t));
  const labelStep = Math.max(1, Math.ceil(data.length / 8));
  const activePoint = activeIndex === null ? null : pts[activeIndex];
  const activeData = activeIndex === null ? null : data[activeIndex];
  const tooltipAbove = activePoint ? activePoint[1] > 95 : true;

  const seleccionarPunto = (event) => {
    if (!data.length) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const clientX = event.touches?.[0]?.clientX ?? event.clientX;
    const x = ((clientX - bounds.left) / bounds.width) * W;
    const nearest = pts.reduce((best, point, index) =>
      Math.abs(point[0] - x) < Math.abs(pts[best][0] - x) ? index : best, 0);
    setActiveIndex(nearest);
  };

  return (
    <div className="w-full overflow-x-auto bg-[var(--ivory-deep)] dark:bg-[var(--noir-soft)]" onMouseLeave={() => setActiveIndex(null)}>
      <div className="relative h-[50vh] min-h-[320px] w-full">
      <svg className="w-full h-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" onMouseMove={seleccionarPunto} onTouchMove={seleccionarPunto} onTouchStart={seleccionarPunto}>
        <defs>
          {/* Gradiente Modo Claro */}
          <linearGradient id="vg-light" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--gold-dark)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--gold-dark)" stopOpacity="0" />
          </linearGradient>
          
          {/* Gradiente Modo Oscuro */}
          <linearGradient id="vg-dark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--gold-light)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--gold-light)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Líneas horizontales de referencia */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line 
              x1={pad.l} y1={y(t)} x2={W - pad.r} y2={y(t)} 
              stroke="currentColor" 
              strokeDasharray="2 4" 
              className="text-[var(--border-gold-25)] dark:text-[var(--border-gold-20)]" 
            />
            <text 
              x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="10" 
              fill="currentColor"
              className="font-tag text-[var(--noir-soft)] dark:text-[var(--ash)]"
            >
              {t >= 1000 ? `${(t / 1000).toFixed(0)}k` : t}
            </text>
          </g>
        ))}

        {/* Etiquetas del eje X (Días) */}
        {data.map((d, i) => i % labelStep === 0 && (
          <text 
            key={i} x={pad.l + i * xStep} y={H - 6} textAnchor="middle" fontSize="10" 
            fill="currentColor"
            className="font-tag text-[var(--noir-soft)] dark:text-[var(--ash)]"
          >
            {d.label}
          </text>
        ))}

        {activePoint && (
          <g pointerEvents="none">
            <line x1={activePoint[0]} y1={pad.t} x2={activePoint[0]} y2={pad.t + iH} stroke="var(--gold-light)" strokeWidth="1" strokeDasharray="3 3" opacity="0.85" />
            <line x1={pad.l} y1={activePoint[1]} x2={W - pad.r} y2={activePoint[1]} stroke="var(--gold-light)" strokeWidth="1" strokeDasharray="3 3" opacity="0.85" />
            <circle cx={activePoint[0]} cy={activePoint[1]} r="7" fill="var(--gold-light)" opacity="0.25" />
            <circle cx={activePoint[0]} cy={activePoint[1]} r="4" fill="var(--gold-light)" stroke="var(--noir)" strokeWidth="1.5" />
            <text x={activePoint[0]} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--gold-light)" fontWeight="600">{activeData.label}</text>
            <text x={pad.l - 8} y={activePoint[1] + 4} textAnchor="end" fontSize="10" fill="var(--gold-light)" fontWeight="600">{activeData.monto >= 1000 ? `${(activeData.monto / 1000).toFixed(0)}k` : activeData.monto}</text>
          </g>
        )}

        {/* --- DIBUJO MODO CLARO --- */}
        <g className="dark:hidden">
          <path d={area} fill="url(#vg-light)" />
          <path d={linea} fill="none" stroke="var(--gold-dark)" strokeWidth="2.5" />
          <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="7" fill="var(--gold-dark)" opacity="0.2" />
          <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="4" fill="var(--gold-dark)" />
        </g>

        {/* --- DIBUJO MODO OSCURO --- */}
        <g className="hidden dark:block">
          <path d={area} fill="url(#vg-dark)" />
          <path d={linea} fill="none" stroke="var(--gold-light)" strokeWidth="2.5" />
          <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="7" fill="var(--gold-light)" opacity="0.2" />
          <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="4" fill="var(--gold-light)" />
        </g>
      </svg>
      {activePoint && (
        <div className={`pointer-events-none absolute z-10 min-w-32 -translate-x-1/2 rounded-[2px] border border-[var(--border-gold-40)] bg-[var(--noir)] px-3 py-2 text-xs text-[var(--snow)] shadow-xl ${tooltipAbove ? "-translate-y-full" : "translate-y-2"}`} style={{ left: `${(activePoint[0] / W) * 100}%`, top: `${(activePoint[1] / H) * 100}%` }}>
          <p className="font-semibold text-[var(--gold-light)]">{activeData.label}</p>
          <p>Ventas: {activeData.ventas ?? 0}</p>
          <p>Importe: ${Number(activeData.monto || 0).toLocaleString("es-MX", { maximumFractionDigits: 0 })}</p>
        </div>
      )}
      </div>
    </div>
  );
}
