import { useState, useEffect } from "react";
import img1 from "../../assets/images/clothes-rack-1.jpg";
import img2 from "../../assets/images/clothes-rack-2.jpg";
import img3 from "../../assets/images/clothes-rack-3.jpg";

const beneficios = [
  { icono: "bi-truck",         titulo: "Envío express 24h",   sub: "CDMX · GDL · MTY"       },
  { icono: "bi-arrow-repeat", titulo: "30 días devolución",  sub: "Cambios sin costo"       },
  { icono: "bi-shield-check", titulo: "Pagos seguros",       sub: "Tarjeta · OXXO · SPEI"  },
  { icono: "bi-star-fill",    titulo: "4.8 ★ promedio",      sub: "+24,800 reseñas"         },
];

const banners = [
  {
    kicker: "Quiénes somos",
    titulo: "Moda que te define",
    sub: "AURA nació en CDMX con una misión: piezas únicas para personas que no siguen tendencias, las crean",
    cta: "Conoce AURA",
    imagen: img1,
  },
  {
    kicker: "Por qué AURA",
    titulo: "Por qué elegirnos",
    sub: "Cada prenda AURA es seleccionada a mano. Sin producción masiva, sin repetidos — solo piezas que valen la pena",
    cta: "Ver colección",
    imagen: img2,
  },
  {
    kicker: "Compra sin complicaciones",
    titulo: "Rápido, seguro y a tu puerta",
    sub: "Envío express 24h · Paga con tarjeta, OXXO o transferencia · 30 días de devolución",
    cta: "Comprar ahora",
    imagen: img3,
  },
];

export default function HeroCarrusel() {
  const [indiceActivo, setIndiceActivo] = useState(0);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndiceActivo((i) => (i + 1) % banners.length);
    }, 6000);
    return () => clearInterval(intervalo);
  }, []);

  const banner = banners[indiceActivo];

  return (
    <section className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-10 mt-4 md:mt-6 box-border w-full overflow-x-hidden">
      <div className="relative rounded-2xl md:rounded-3xl overflow-hidden border border-lila/15 shadow-2xl h-[340px] sm:h-[420px] md:h-[500px] w-full box-border">

        <img
          src={banner.imagen}
          alt={banner.titulo}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-oscuro via-oscuro/70 to-oscuro/40 md:bg-gradient-to-r md:from-oscuro/95 md:via-oscuro/60 md:to-transparent" />

        <div className="relative h-full flex flex-col justify-end md:justify-center p-5 sm:p-8 md:p-14 max-w-2xl box-border z-10">
          <p className="text-[10px] md:text-[12px] tracking-[3px] md:tracking-[5px] text-lila-soft uppercase font-bold">
            {banner.kicker}
          </p>
          <h2
            className="mt-2 md:mt-3 text-3xl sm:text-5xl md:text-7xl font-extrabold text-blanco leading-[1.1] md:leading-[0.95] break-words"
            style={{ fontFamily: "'Cinzel Decorative', serif" }}
          >
            {banner.titulo}
          </h2>
          <p className="mt-2 md:mt-4 text-xs sm:text-base md:text-lg text-lila-soft/90 max-w-md line-clamp-2 sm:line-clamp-none">
            {banner.sub}
          </p>
          
          <div className="mt-4 md:mt-7 flex items-center gap-2 md:gap-3 flex-wrap">
            <button className="bg-lila text-oscuro font-bold text-xs sm:text-sm px-4 sm:px-7 py-2.5 sm:py-3.5 rounded-full hover:bg-lila-soft hover:scale-[1.02] transition-all flex items-center gap-2 active:scale-95">
              <span className="whitespace-nowrap">{banner.cta}</span>
              <i className="bi bi-arrow-right" />
            </button>
            <button className="bg-transparent text-blanco font-bold text-xs sm:text-sm px-4 sm:px-7 py-2.5 sm:py-3.5 rounded-full border border-lila/30 hover:border-lila transition-all active:scale-95 whitespace-nowrap">
              Ver lookbook
            </button>
          </div>

          <div className="mt-5 md:mt-8 flex items-center gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndiceActivo(i)}
                className={`h-1.5 rounded-full transition-all active:scale-95 ${
                  i === indiceActivo ? "w-8 md:w-10 bg-lila" : "w-3 md:w-4 bg-lila/30"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-3 mt-3 md:mt-4 w-full box-border">
        {beneficios.map((b) => (
          <div
            key={b.titulo}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 bg-bg-card border border-lila/10 rounded-xl p-3 md:p-4 box-border min-w-0"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-lila/10 text-lila flex items-center justify-center shrink-0">
              <i className={`bi ${b.icono} text-base sm:text-xl`} />
            </div>
            <div className="min-w-0 w-full">
              <p className="text-xs sm:text-sm font-bold text-blanco truncate">{b.titulo}</p>
              <p className="text-[10px] sm:text-xs text-text-muted truncate">{b.sub || "\u00A0"}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}