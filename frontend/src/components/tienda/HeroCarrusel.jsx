import { useState, useEffect } from "react";
import img1 from "../../assets/images/clothes-rack-1.png";
import img2 from "../../assets/images/clothes-rack-2.png";
import img3 from "../../assets/images/products.png";

const beneficios = [
  { icono: "bi-truck",        titulo: "Envío en 24 horas",      sub: "CDMX · GDL · MTY"            },
  { icono: "bi-arrow-repeat", titulo: "30 días de devolución",  sub: "Cambios sin costo"           },
  { icono: "bi-shield-check", titulo: "Pagos seguros",          sub: "Tarjeta · OXXO · SPEI"        },
  { icono: "bi-gem",          titulo: "Piezas certificadas",    sub: "Materia prima de origen"      },
];

const banners = [
  {
    kicker: "Herencia y maestría",
    titulo: "Cuatro décadas de oficio",
    sub: "Desde 1986, D'oro construye prendas que no caducan. Cada pieza nace del diálogo entre la tradición italiana y el diseño contemporáneo.",
    cta: "Conoce nuestra historia",
    imagen: img1,
  },
  {
    kicker: "Confección a mano",
    titulo: "Dieciséis manos, una pieza",
    sub: "Sin producción masiva. Cada prenda pasa por un taller donde el acabado interior recibe la misma atención que el exterior.",
    cta: "Ver la colección",
    imagen: img2,
  },
  {
    kicker: "Diseño atemporal",
    titulo: "Lo que viste hoy, lo recordarás",
    sub: "Materia prima certificada, confección artesanal y un principio que no negociamos: la elegancia no pasa de moda.",
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
      <div
        className="relative rounded-[2px] overflow-hidden shadow-2xl h-[340px] sm:h-[420px] md:h-[500px] w-full box-border"
        style={{ border: "1px solid var(--border-gold-20)" }}
      >

        <img
          src={banner.imagen}
          alt={banner.titulo}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
          style={{ filter: "brightness(0.82) saturate(0.9)" }}
        />

       {/* Degradado para móvil */}
        <div
          className="absolute inset-0 md:hidden"
          style={{
            background:
              "linear-gradient(to top, rgba(13,13,13,0.92) 10%, rgba(13,13,13,0.50) 65%, transparent 100%)",
          }}
        />

        {/* Degradado para escritorio */}
        <div
          className="absolute inset-0 hidden md:block"
          style={{
            background:
              "linear-gradient(to right, rgba(13,13,13,0.80) 0%, rgba(13,13,13,0.40) 45%, rgba(13,13,13,0.08) 70%, transparent 100%)",
          }}
        />

        <div className="relative h-full flex flex-col justify-end md:justify-center p-5 sm:p-8 md:p-14 max-w-2xl box-border z-10">
          <p
            style={{
              fontFamily: "var(--font-tag)",
              fontSize: "10px",
              letterSpacing: "0.28em",
              color: "var(--gold)",
              textTransform: "uppercase",
              fontWeight: 600,
              margin: 0,
            }}
          >
            {banner.kicker}
          </p>
          <h2
            className="mt-2 md:mt-3 break-words"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 300,
              fontStyle: "italic",
              fontSize: "clamp(32px, 6vw, 64px)",
              color: "var(--snow)",
              lineHeight: 1.1,
              letterSpacing: "0.02em",
              margin: 0,
            }}
          >
            {banner.titulo}
          </h2>
          <p
            className="mt-3 md:mt-4 max-w-md line-clamp-2 sm:line-clamp-none"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "clamp(15px, 1.6vw, 19px)",
              color: "var(--snow-78, rgba(247,240,230,0.78))",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {banner.sub}
          </p>

          <div className="mt-5 md:mt-8 flex items-center gap-2 md:gap-3 flex-wrap">
            <button
              className="flex items-center gap-2 transition-all active:scale-95"
              style={{
                fontFamily: "var(--font-tag)",
                fontWeight: 600,
                fontSize: "11px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                padding: "12px 28px",
                background: "var(--gold)",
                color: "var(--noir)",
                border: "none",
                borderRadius: "2px",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gold-light)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--gold)")}
            >
              <span className="whitespace-nowrap">{banner.cta}</span>
              <i className="bi bi-arrow-right" />
            </button>
            <button
              className="transition-all active:scale-95 whitespace-nowrap"
              style={{
                fontFamily: "var(--font-tag)",
                fontWeight: 400,
                fontSize: "11px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                padding: "11px 26px",
                background: "transparent",
                color: "var(--snow)",
                border: "1px solid var(--border-gold-55)",
                borderRadius: "2px",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--gold)";
                e.currentTarget.style.color = "var(--gold-light)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-gold-55)";
                e.currentTarget.style.color = "var(--snow)";
              }}
            >
              Ver lookbook
            </button>
          </div>

          <div className="mt-6 md:mt-8 flex items-center gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndiceActivo(i)}
                className="h-[2px] transition-all active:scale-95"
                style={{
                  width: i === indiceActivo ? "32px" : "14px",
                  background: i === indiceActivo ? "var(--gold)" : "rgba(247,240,230,0.3)",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-3 mt-3 md:mt-4 w-full box-border">
        {beneficios.map((b) => (
          <div
            key={b.titulo}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 rounded-[2px] p-3 md:p-4 box-border min-w-0"
            style={{ background: "var(--snow)", border: "1px solid var(--border-gold-20)" }}
          >
            <div
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-[2px] flex items-center justify-center shrink-0"
              style={{ background: "var(--gold-08)", color: "var(--gold-dark)" }}
            >
              <i className={`bi ${b.icono} text-base sm:text-xl`} />
            </div>
            <div className="min-w-0 w-full">
              <p
                className="truncate"
                style={{
                  fontFamily: "var(--font-tag)",
                  fontSize: "12px",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  color: "var(--noir)",
                }}
              >
                {b.titulo}
              </p>
              <p
                className="truncate"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "11px",
                  color: "var(--ash)",
                }}
              >
                {b.sub || "\u00A0"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}