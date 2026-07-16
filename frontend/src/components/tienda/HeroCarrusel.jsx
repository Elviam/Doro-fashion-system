import { useState, useEffect } from "react";
import img1 from "../../assets/images/clothes-rack-1.png";
import img2 from "../../assets/images/clothes-rack-2.png";
import img3 from "../../assets/images/products.png";

const banners = [
  {
    kicker: "Herencia y maestria",
    titulo: "Cuatro decadas de oficio",
    sub: "Desde 1986, D'oro construye prendas que no caducan. Cada pieza nace del dialogo entre la tradicion italiana y el diseno contemporaneo.",
    cta: "Conoce nuestra historia",
    imagen: img1,
  },
  {
    kicker: "Confeccion a mano",
    titulo: "Dieciseis manos, una pieza",
    sub: "Sin produccion masiva. Cada prenda pasa por un taller donde el acabado interior recibe la misma atencion que el exterior.",
    cta: "Ver la coleccion",
    imagen: img2,
  },
  {
    kicker: "Diseno atemporal",
    titulo: "Lo que viste hoy, lo recordaras",
    sub: "Materia prima certificada, confeccion artesanal y un principio que no negociamos: la elegancia no pasa de moda.",
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

        <div
          className="absolute inset-0 md:hidden"
          style={{
            background:
              "linear-gradient(to top, rgba(13,13,13,0.92) 10%, rgba(13,13,13,0.50) 65%, transparent 100%)",
          }}
        />

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
    </section>
  );
}
