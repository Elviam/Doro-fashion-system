export default function GraficaVentas({ data }) {
  const W = 900, H = 160;
  const pad = { l: 42, r: 14, t: 14, b: 26 };
  const iW = W - pad.l - pad.r;
  const iH = H - pad.t - pad.b;
  const max = Math.max(...data.map((d) => d.monto), 1);
  const xStep = iW / (data.length - 1);
  const y = (v) => pad.t + iH - (v / max) * iH;
  const pts = data.map((d, i) => [pad.l + i * xStep, y(d.monto)]);
  const linea = pts.map((p, i) => (i ? `L${p[0]},${p[1]}` : `M${p[0]},${p[1]}`)).join(" ");
  const area  = `${linea} L${pts[pts.length - 1][0]},${pad.t + iH} L${pts[0][0]},${pad.t + iH} Z`;
  const ticks = [0, 0.33, 0.66, 1].map((t) => Math.round(max * t));

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[600px] h-40 relative">
      <svg className="w-full h-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          {/* Gradiente Modo Claro */}
          <linearGradient id="vg-light" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#56538E" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#56538E" stopOpacity="0" />
          </linearGradient>
          
          {/* Gradiente Modo Oscuro */}
          <linearGradient id="vg-dark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E7D6FF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#E7D6FF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Líneas horizontales de referencia */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line 
              x1={pad.l} y1={y(t)} x2={W - pad.r} y2={y(t)} 
              stroke="currentColor" 
              strokeDasharray="2 4" 
              className="text-morado/10 dark:text-lila/10" 
            />
            <text 
              x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="10" 
              fill="currentColor"
              className="text-morado/50 dark:text-lila-soft/50"
            >
              {t >= 1000 ? `${(t / 1000).toFixed(0)}k` : t}
            </text>
          </g>
        ))}

        {/* Etiquetas del eje X (Días) */}
        {data.map((d, i) => i % 5 === 0 && (
          <text 
            key={i} x={pad.l + i * xStep} y={H - 6} textAnchor="middle" fontSize="10" 
            fill="currentColor"
            className="text-morado/50 dark:text-lila-soft/50"
          >
            {d.label}
          </text>
        ))}

        {/* --- DIBUJO MODO CLARO --- */}
        <g className="dark:hidden">
          <path d={area} fill="url(#vg-light)" />
          <path d={linea} fill="none" stroke="#56538E" strokeWidth="2.5" />
          <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="7" fill="#56538E" opacity="0.2" />
          <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="4" fill="#56538E" />
        </g>

        {/* --- DIBUJO MODO OSCURO --- */}
        <g className="hidden dark:block">
          <path d={area} fill="url(#vg-dark)" />
          <path d={linea} fill="none" stroke="#E7D6FF" strokeWidth="2.5" />
          <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="7" fill="#E7D6FF" opacity="0.2" />
          <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="4" fill="#E7D6FF" />
        </g>
      </svg>
      </div>
    </div>
  );
}