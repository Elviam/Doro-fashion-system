const anuncios = [
  "🚚  Envío express GRATIS desde $999",
  "♻  30 días de devolución",
  "✨  Drops nuevos cada miércoles",
  "🎁  Empaque eco amigable en cada orden",
];

export default function BarraAnuncios() {
  const items = [...anuncios, ...anuncios, ...anuncios];

  return (
    <div className="bg-oscuro-card border-b border-lila/10 overflow-hidden">
      <div
        className="flex gap-12 py-2 px-6 whitespace-nowrap"
        style={{
          width: "max-content",
          animation: "marquee 38s linear infinite",
        }}
      >
        {items.map((texto, i) => (
          <span
            key={i}
            className="text-[11px] tracking-[3px] text-lila-soft uppercase font-medium"
          >
            {texto}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-33.33%); }
        }
      `}</style>
    </div>
  );
}
