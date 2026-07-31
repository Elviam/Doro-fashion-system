import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import hero from "../assets/images/hero.png";
import Store from "../assets/images/Store.png";
import clothesRack1 from "../assets/images/clothes-rack-1.png";
import clothesRack2 from "../assets/images/clothes-rack-2.png";
import products from "../assets/images/products.png"
import useTitulo from "../hooks/useTitulo";

// ---------------------------------------------------------------------------
// Google Fonts
// ---------------------------------------------------------------------------
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Josefin+Sans:wght@300;400;600&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');
  `}</style>
);

// ---------------------------------------------------------------------------
// Global styles — solo animaciones y clases utilitarias
// ---------------------------------------------------------------------------
const GlobalStyles = () => (
  <style>{`
    html, body {
      width: 100%;
      margin: 0;
      padding: 0;
      overflow-x: hidden;
      background: var(--ivory);
    }
    #root {
      width: 100%;
      max-width: 100% !important;
      padding: 0 !important;
      margin: 0 !important;
    }

    /* ── Animations ── */
    @keyframes heroReveal {
      from { opacity: 0; letter-spacing: 0.35em; }
      to   { opacity: 1; letter-spacing: 0.15em; }
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(30px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes shimmer {
      0%   { background-position: -200% center; }
      100% { background-position: 200% center; }
    }

    .hero-title {
      animation: heroReveal 1.4s cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    .fade-up  { animation: fadeUp 0.9s ease both; }
    .delay-1  { animation-delay: 0.2s; }
    .delay-2  { animation-delay: 0.4s; }
    .delay-3  { animation-delay: 0.6s; }
    .delay-4  { animation-delay: 0.8s; }

    /* Gold divider line */
    .gold-line {
      display: block;
      height: 1px;
      background: var(--gold);
      transform-origin: left center;
      transform: scaleX(0);
      transition: transform 1s cubic-bezier(0.22, 1, 0.36, 1);
      width: 100%;
    }
    .gold-line.visible { transform: scaleX(1); }

    /* Shimmer text */
    .shimmer-text {
      background: linear-gradient(
        120deg,
        var(--gold-dark) 6%,
        var(--gold) 20%,
        #725b0e 30%,
        var(--gold) 40%,
        var(--gold-dark) 100%
      );
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: shimmer 4s linear infinite;
    }

    /* Scroll reveal */
    .reveal {
      opacity: 0;
      transform: translateY(28px);
      transition: opacity 0.8s ease, transform 0.8s ease;
    }
    .reveal.visible  { opacity: 1; transform: translateY(0); }
    .reveal.delay-r1 { transition-delay: 0.1s; }
    .reveal.delay-r2 { transition-delay: 0.25s; }
    .reveal.delay-r3 { transition-delay: 0.4s; }

    /* Card hover */
    .pillar-card {
      transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
    }
    .pillar-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 20px 48px rgba(13,13,13,0.14);
      border-color: var(--gold) !important;
    }

    /* Image zoom */
    .img-zoom {
      transition: transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    .img-zoom:hover { transform: scale(1.04); }

    /* Footer links */
    .footer-link {
      transition: color 0.2s, letter-spacing 0.3s;
    }
    .footer-link:hover {
      color: var(--gold) !important;
      letter-spacing: 0.2em;
    }

    /* ── Header responsive ── */
    .header-nav   { display: flex; gap: 36px; align-items: center; }
    .header-btns  { display: flex; gap: 12px; align-items: center; }

    /* ── Layout helpers ── */
    .split-section  { display: flex; flex-wrap: wrap; width: 100%; }
    .strip-section  { display: flex; width: 100%; min-height: 400px; }
    .stats-row      { display: flex; flex-wrap: wrap; width: 100%; }
    .pillars-grid   { display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; }
    .hero-cta-group { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }

    /* ══════════════════════════════════════════════════════
       RESPONSIVE — Tablet  (≤ 900px)
    ══════════════════════════════════════════════════════ */
    @media (max-width: 900px) {
      .header-nav { display: none; }  /* nav colapsada */

      .stats-row > div {
        flex: 1 1 45% !important;
        border-right: none !important;
        border-bottom: 1px solid var(--border-gold-20);
        padding: 36px 32px !important;
      }

      .split-section > div { flex: 1 1 100% !important; }
      .split-section .manifesto-text { padding: 60px 48px !important; }

      .strip-section { flex-direction: column; }
      .strip-center-card { flex: 0 0 auto !important; min-height: 200px !important; }

      .pillars-grid > div { flex: 1 1 45% !important; max-width: 100% !important; }

      .quote-strip  { padding: 72px 48px !important; }
      .cta-band     { padding: 60px 48px !important; }
      .footer-inner { flex-direction: column; gap: 36px !important; }
      .footer-nav   { flex-wrap: wrap; gap: 32px !important; }
    }

    /* ══════════════════════════════════════════════════════
       RESPONSIVE — Mobile  (≤ 540px)
    ══════════════════════════════════════════════════════ */
    @media (max-width: 540px) {
      .header-root  { padding: 14px 20px !important; }
      .header-btns button { padding: 8px 14px !important; font-size: 10px !important; }

      .hero-cta-group { flex-direction: column; align-items: center; }

      .stats-row > div {
        flex: 1 1 100% !important;
        padding: 28px 20px !important;
      }

      .split-section .manifesto-text { padding: 48px 24px !important; }

      .pillars-grid > div { flex: 1 1 100% !important; }
      .pillar-card  { padding: 32px 24px !important; }

      .quote-strip  { padding: 60px 24px !important; }
      .manifesto-text { padding: 48px 24px !important; }
      .cta-band     { padding: 52px 24px !important; }

      .footer-root  { padding: 40px 24px !important; }
      .footer-nav   { flex-direction: column; gap: 28px !important; }

      .copyright-bar { padding: 14px 24px !important; flex-direction: column; gap: 4px; }
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
  `}</style>
);

// ---------------------------------------------------------------------------
// D'oro Wordmark
// ---------------------------------------------------------------------------
const DoroWordmark = ({ size = 28, color = "var(--noir)" }) => (
  <div
    style={{
      fontFamily: "var(--font-display)",
      fontSize: size,
      fontWeight: 300,
      letterSpacing: "0.22em",
      color,
      userSelect: "none",
      display: "flex",
      alignItems: "baseline",
      gap: "2px",
    }}
  >
    D
    <span style={{ fontStyle: "italic", color: "var(--gold)", marginRight: "1px" }}>
      '
    </span>
    ORO
  </div>
);

// ---------------------------------------------------------------------------
// Gold Line Divider (scroll-triggered)
// ---------------------------------------------------------------------------
const GoldDivider = () => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add("visible"); },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <span ref={ref} className="gold-line" />;
};

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------
const IconInstagram = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L2.14 2.25H8.38l4.259 5.631L18.244 2.25zM17.08 19.77h1.833L7.084 4.126H5.117L17.08 19.77z" />
  </svg>
);

// ---------------------------------------------------------------------------
// Hook: scroll reveal
// ---------------------------------------------------------------------------
function useReveal() {
  const refs = useRef([]);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.12 }
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);
  const add = (el) => { if (el && !refs.current.includes(el)) refs.current.push(el); };
  return { add };
}

// ---------------------------------------------------------------------------
// Home Component
// ---------------------------------------------------------------------------
export default function Home() {
  useTitulo("D'oro — Alta Moda");
  const navigate = useNavigate();
  const { add } = useReveal();

  const btnPrimary = {
    fontFamily: "var(--font-tag)",
    fontWeight: 600,
    fontSize: "11px",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    padding: "14px 40px",
    background: "var(--gold)",
    color: "var(--noir)",
    border: "none",
    borderRadius: "2px",
    cursor: "pointer",
    transition: "background 0.3s, transform 0.2s, box-shadow 0.3s",
  };

  const btnGhost = {
    fontFamily: "var(--font-tag)",
    fontWeight: 400,
    fontSize: "11px",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    padding: "13px 38px",
    background: "transparent",
    color: "var(--snow)",
    border: "1px solid var(--border-gold-55)",
    borderRadius: "2px",
    cursor: "pointer",
    transition: "border-color 0.3s, color 0.3s, background 0.3s",
    textDecoration: "none",
    display: "inline-block",
  };

  return (
    <div style={{ width: "100%", overflowX: "hidden", background: "var(--ivory)" }}>
      <FontLoader />
      <GlobalStyles />

      {/* ══════════════════════════════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════════════════════════════ */}
      <header
        className="header-root"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 52px",
          background: "rgba(247,240,230,0.88)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid var(--border-gold-20)",
          boxSizing: "border-box",
        }}
      >
        <DoroWordmark size={22} color="var(--noir)" />

        <nav className="header-nav">
          {["Colección", "Historia", "Contacto"].map((item) => (
            <a
              key={item}
              style={{
                fontFamily: "var(--font-tag)",
                fontSize: "11px",
                fontWeight: 400,
                letterSpacing: "0.14em",
                color: "var(--ash)",
                textDecoration: "none",
                textTransform: "uppercase",
                transition: "color 0.2s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ash)")}
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="header-btns">
          <button
            onClick={() => navigate("/Register")}
            style={{
              fontFamily: "var(--font-tag)",
              fontSize: "11px",
              fontWeight: 400,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              padding: "9px 22px",
              background: "transparent",
              color: "var(--gold-dark)",
              border: "1px solid rgba(122,92,30,0.35)",
              borderRadius: "2px",
              cursor: "pointer",
              transition: "border-color 0.25s, color 0.25s, background 0.25s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--gold-08)";
              e.currentTarget.style.borderColor = "var(--gold)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "rgba(122,92,30,0.35)";
            }}
          >
            Registro
          </button>

          <button
            onClick={() => navigate("/login")}
            style={{
              fontFamily: "var(--font-tag)",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              padding: "9px 22px",
              background: "var(--noir)",
              color: "var(--gold-light)",
              border: "1px solid var(--noir)",
              borderRadius: "2px",
              cursor: "pointer",
              transition: "background 0.25s, color 0.25s, border-color 0.25s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--gold-dark)";
              e.currentTarget.style.borderColor = "var(--gold-dark)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--noir)";
              e.currentTarget.style.borderColor = "var(--noir)";
            }}
          >
            Ingresar
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          position: "relative",
          width: "100%",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <img
          src={hero}
          alt="D'oro — alta moda"
          className="img-zoom"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center top",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(13,13,13,0.75) 0%, rgba(13,13,13,0.55) 50%, rgba(13,13,13,0.35) 100%)",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 2,
            textAlign: "center",
            padding: "0 24px",
            maxWidth: "820px",
            width: "100%",
          }}
        >
          
          <h1
            className="hero-title"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(52px, 8vw, 110px)",
              fontWeight: 300,
              fontStyle: "italic",
              color: "var(--snow)",
              lineHeight: 0.95,
              margin: "0 0 12px",
              letterSpacing: "0.15em",
            }}
          >
            D'ORO
          </h1>

          <p
            className="fade-up delay-1"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(13px, 2vw, 20px)",
              fontWeight: 300,
              letterSpacing: "0.25em",
              color: "var(--gold-light)",
              textTransform: "uppercase",
              marginBottom: "36px",
            }}
          >
            Donde el lujo encuentra su forma
          </p>
          <div style={{
            width: "50%",
            height: "1px",
            background: "linear-gradient(90deg, transparent, var(--gold), transparent)",
            margin: "0 auto 36px",
          }} />

          <p
            className="fade-up delay-2"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "clamp(15px, 1.9vw, 22px)",
              fontStyle: "italic",
              color: "var(--snow-78)",
              maxWidth: "520px",
              margin: "0 auto 48px",
            }}
          >
            Prendas construidas con materia prima excepcional, diseño
            atemporal y una obsesión silenciosa por la perfección.
          </p>

          <div className="fade-up delay-3 hero-cta-group">
            <button
              onClick={() => navigate("/tienda")}
              style={btnPrimary}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--gold-light)";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 28px var(--gold-15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--gold)";
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Explorar Tienda
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="fade-up delay-4"
          style={{
            position: "absolute",
            bottom: "40px",
            left: "0",
            right: "0",
            margin: "0 auto", 
            width: "fit-content",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-tag)",
              fontSize: "9px",
              letterSpacing: "0.3em",
              color: "var(--snow-45)",
              textTransform: "uppercase",
            }}
          >
            Descubrir
          </span>
          <div
            style={{
              width: "1px",
              height: "40px",
              background: "linear-gradient(to bottom, var(--gold), transparent)",
              animation: "fadeUp 1.5s ease infinite alternate",
            }}
          />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════════════════════════════ */}
      <section
        className="stats-row"
        style={{
          background: "var(--ivory-deep)",
          borderTop: "1px solid var(--border-gold-25)",
          borderBottom: "1px solid var(--border-gold-25)",
        }}
      >
        {[
          { num: "38",  suffix: "años",   label: "de tradición en alta costura" },
          { num: "210", suffix: "puntos", label: "de venta en cuatro continentes" },
          { num: "14",  suffix: "colec.", label: "presentadas en pasarelas internacionales" },
        ].map((stat, i) => (
          <div
            key={i}
            ref={add}
            className="reveal"
            style={{
              flex: "1 1 220px",
              padding: "52px 48px",
              borderRight: i < 2 ? "2px solid var(--border-gold-20)" : "none",
              textAlign: "left",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(62px, 7vw, 92px)",
                fontWeight: 300,
                color: "var(--noir)",
                lineHeight: 1,
                display: "flex",
                alignItems: "baseline",
                gap: "8px",
              }}
            >
              <span className="shimmer-text">{stat.num}</span>
              <span
                style={{
                  fontFamily: "var(--font-tag)",
                  fontSize: "clamp(13px, 1.3vw, 15px)",
                  fontWeight: 300,
                  letterSpacing: "0.12em",
                  color: "var(--gold-dark)",
                  textTransform: "uppercase",
                  marginLeft: "2px",
                }}
              >
                {stat.suffix}
              </span>
            </div>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "clamp(18px, 1.4vw, 16px)",
                color: "var(--ash)",
                marginTop: "10px",
                lineHeight: 1.5,
                fontStyle: "italic",
              }}
            >
              {stat.label}
            </p>
          </div>
        ))}
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          HERITAGE SPLIT
      ══════════════════════════════════════════════════════════════════ */}
      <section className="split-section">
        <div
          style={{
            flex: "1 1 380px",
            minHeight: "480px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <img
            src={Store}
            alt="Atelier D'oro"
            className="img-zoom"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "36px",
              left: "36px",
              background: "var(--noir-soft)",
              border: "1px solid var(--border-gold-40)",
              padding: "16px 24px",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-tag)",
                fontSize: "9px",
                letterSpacing: "0.24em",
                color: "var(--gold)",
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              Fundada en 1986 · Milán
            </p>
          </div>
        </div>

        <div
          ref={add}
          className="reveal manifesto-text"
          style={{
            flex: "1 1 380px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "80px 72px",
            background: "var(--snow)",
            gap: "28px",
            boxSizing: "border-box",
          }}
        >
          <GoldDivider />
          <p
            style={{
              fontFamily: "var(--font-tag)",
              fontSize: "10px",
              fontWeight: 400,
              letterSpacing: "0.22em",
              color: "var(--gold-dark)",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            Herencia y Maestría
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(26px, 3.5vw, 42px)",
              fontWeight: 300,
              fontStyle: "italic",
              color: "var(--noir)",
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            Cuatro décadas construyendo el lenguaje del lujo
          </h2>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "clamp(15px, 1.6vw, 18px)",
              color: "var(--ash)",
              lineHeight: 1.85,
              margin: 0,
            }}
          >
            D'oro nació de la convicción de que la moda verdadera no caduca. Cada
            colección es un diálogo entre la tradición italiana del bordado a mano
            y la precisión del diseño contemporáneo. No fabricamos prendas: creamos
            piezas que envejecen con elegancia.
          </p>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "clamp(14px, 1.4vw, 16px)",
              color: "var(--ash)",
              lineHeight: 1.8,
              margin: 0,
              opacity: 0.85,
            }}
          >
            Nuestros talleres seleccionan únicamente materias primas certificadas:
            seda de Como, lana merino andina y lino belga de primera extracción.
          </p>
          <GoldDivider />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          PHOTO STRIP
      ══════════════════════════════════════════════════════════════════ */}
      <div className="strip-section">
        <div style={{ flex: "1 1 200px", overflow: "hidden", minHeight: "300px" }}>
          <img
            src={clothesRack1}
            alt="Colección D'oro"
            className="img-zoom"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              filter: "brightness(0.82) saturate(0.9)",
            }}
          />
        </div>

        <div
          className="strip-center-card"
          style={{
            flex: "0 0 240px",
            background: "var(--noir)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 32px",
            gap: "20px",
            minHeight: "300px",
            boxSizing: "border-box",
          }}
        >
          <div style={{ width: "40px", height: "1px", background: "var(--gold)", marginBottom: "8px" }} />
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 3vw, 40px)",
              fontWeight: 300,
              fontStyle: "italic",
              color: "var(--snow)",
              letterSpacing: "0.06em",
              textAlign: "center",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Atelier
          </p>
          <p
            style={{
              fontFamily: "var(--font-tag)",
              fontSize: "9px",
              letterSpacing: "0.3em",
              color: "var(--gold)",
              textTransform: "uppercase",
              textAlign: "center",
              margin: 0,
            }}
          >
            D'oro · Milán
          </p>
          <div style={{ width: "40px", height: "1px", background: "var(--gold)", marginTop: "8px" }} />
        </div>

        <div style={{ flex: "1 1 200px", overflow: "hidden", minHeight: "300px" }}>
          <img
            src={products}
            alt="Detalle D'oro"
            className="img-zoom"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              filter: "brightness(0.82) saturate(0.9)",
            }}
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          QUOTE STRIP
      ══════════════════════════════════════════════════════════════════ */}
      <section
        ref={add}
        className="reveal quote-strip"
        style={{
          background: "var(--noir)",
          textAlign: "center",
          padding: "96px 80px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-tag)",
            fontSize: "10px",
            letterSpacing: "0.3em",
            color: "var(--gold)",
            textTransform: "uppercase",
            marginBottom: "36px",
          }}
        >
          Manifesto D'oro
        </p>
        <blockquote
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(22px, 4vw, 52px)",
            fontWeight: 300,
            fontStyle: "italic",
            color: "var(--snow)",
            lineHeight: 1.3,
            maxWidth: "860px",
            margin: "0 auto 36px",
          }}
        >
          "El lujo verdadero no se anuncia: se percibe en cada costura, en cada
          elección de hilo, en el silencio entre dos detalles."
        </blockquote>
        <p
          style={{
            fontFamily: "var(--font-tag)",
            fontSize: "10px",
            letterSpacing: "0.22em",
            color: "var(--gold-60)",
            textTransform: "uppercase",
          }}
        >
          — Lorenzo D'Aquino, Fundador
        </p>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          PILLARS
      ══════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          background: "var(--ivory)",
          padding: "96px 60px 80px",
          width: "100%",
          boxSizing: "border-box",
          textAlign: "center",
        }}
      >
        <p
          ref={add}
          className="reveal"
          style={{
            fontFamily: "var(--font-tag)",
            fontSize: "10px",
            letterSpacing: "0.28em",
            color: "var(--gold-dark)",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          Los pilares de D'oro
        </p>
        <h2
          ref={add}
          className="reveal delay-r1"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(24px, 3.5vw, 40px)",
            fontWeight: 300,
            fontStyle: "italic",
            color: "var(--noir)",
            lineHeight: 1.2,
            maxWidth: "540px",
            margin: "0 auto 20px",
          }}
        >
          Manufactura, excelencia y permanencia
        </h2>
        <p
          ref={add}
          className="reveal delay-r2"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "clamp(14px, 1.5vw, 18px)",
            color: "var(--ash)",
            lineHeight: 1.75,
            maxWidth: "620px",
            margin: "0 auto 64px",
            fontStyle: "italic",
          }}
        >
          Cada decisión en D'oro parte de un principio: la prenda que viste hoy
          debe ser la que recuerdes dentro de veinte años.
        </p>

        <div className="pillars-grid">
          {[
            {
              icon: "◈",
              title: "Materia Prima Certificada",
              text: "Seleccionamos fibras con trazabilidad completa. Seda, lana y lino provenientes de productores artesanales con prácticas éticas y sostenibles.",
            },
            {
              icon: "◇",
              title: "Confección a Mano",
              text: "Cada pieza pasa por un mínimo de dieciséis manos expertas antes de salir del taller. Los acabados internos reciben la misma atención que el exterior.",
            },
            {
              icon: "◉",
              title: "Diseño Atemporal",
              text: "No seguimos tendencias: las redefinimos. Nuestras colecciones están construidas para trascender estaciones y convertirse en referentes de guardarropa.",
            },
          ].map((card, i) => (
            <div
              key={i}
              ref={add}
              className="reveal pillar-card"
              style={{
                flex: "1 1 260px",
                maxWidth: "320px",
                background: "var(--snow)",
                border: "1px solid var(--border-gold-20)",
                borderRadius: "2px",
                padding: "44px 36px",
                textAlign: "left",
                boxSizing: "border-box",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "28px",
                  color: "var(--gold)",
                  display: "block",
                  marginBottom: "20px",
                }}
              >
                {card.icon}
              </span>
              <p
                style={{
                  fontFamily: "var(--font-tag)",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  color: "var(--noir)",
                  textTransform: "uppercase",
                  marginBottom: "14px",
                }}
              >
                {card.title}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "15px",
                  color: "var(--ash)",
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                {card.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════════════ */}
      <footer
        className="footer-root"
        style={{
          background: "var(--noir-soft)",
          padding: "52px 60px",
          width: "100%",
          boxSizing: "border-box",
          borderTop: "1px solid var(--border-gold-20)",
        }}
      >
        <div
          className="footer-inner"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "40px",
          }}
        >
          {/* Brand */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <DoroWordmark size={22} color="var(--gold-light)" />
          <p
            style={{
                fontFamily: "var(--font-tag)",
                fontSize: "10px",
                letterSpacing: "0.2em",
                color: "var(--gold-50)",
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              Alta Moda · Desde 1986
            </p>
          </div>

          {/* Nav columns */}
          <div className="footer-nav" style={{ display: "flex", gap: "56px", flexWrap: "wrap" }}>
            {[
              { title: "Colección", links: ["Primavera 2026", "Invierno 2025", "Archivo"] },
              { title: "Maison",    links: ["Historia", "Atelier", "Sostenibilidad"] },
              { title: "Servicio",  links: ["Contacto", "Envíos", "Devoluciones"] },
            ].map((col) => (
              <div key={col.title} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <p
                  style={{
                    fontFamily: "var(--font-tag)",
                    fontSize: "9px",
                    fontWeight: 600,
                    letterSpacing: "0.24em",
                    color: "var(--gold)",
                    textTransform: "uppercase",
                    margin: 0,
                  }}
                >
                  {col.title}
                </p>
                {col.links.map((link) => (
                  <a
                    key={link}
                    className="footer-link"
                    style={{
                      fontFamily: "var(--font-tag)",
                      fontSize: "10px",
                      fontWeight: 300,
                      letterSpacing: "0.14em",
                      color: "var(--snow-45)",
                      textDecoration: "none",
                      textTransform: "uppercase",
                      cursor: "pointer",
                    }}
                  >
                    {link}
                  </a>
                ))}
              </div>
            ))}
          </div>

          {/* Social */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p
              style={{
                fontFamily: "var(--font-tag)",
                fontSize: "9px",
                fontWeight: 600,
                letterSpacing: "0.24em",
                color: "var(--gold)",
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              Redes
            </p>
            <div style={{ display: "flex", gap: "16px" }}>
              {[
                { label: "Instagram", href: "https://www.instagram.com", Icon: IconInstagram },
                { label: "X",         href: "https://x.com",             Icon: IconX },
              ].map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  style={{
                    color: "var(--gold-50)",
                    display: "inline-flex",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--gold-50)")}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Copyright bar */}
      <div
        className="copyright-bar"
        style={{
          background: "var(--noir)",
          borderTop: "1px solid rgba(201,168,76,0.1)",
          padding: "16px 60px",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
          boxSizing: "border-box",
          width: "100%",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-tag)",
            fontSize: "9px",
            letterSpacing: "0.16em",
            color: "var(--snow-25)",
            margin: 0,
            textTransform: "uppercase",
          }}
          >
            © 2026 D'oro Maison · Todos los derechos reservados
          </p>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "10px",
              lineHeight: 1.45,
              color: "var(--snow-45)",
              margin: 0,
              maxWidth: "520px",
              textAlign: "center",
            }}
          >
            D'oro es una marca ficticia creada con fines académicos y de portafolio. Los nombres, ubicaciones y datos comerciales forman parte del concepto del proyecto.
          </p>
        <p
          style={{
            fontFamily: "var(--font-tag)",
            fontSize: "9px",
            letterSpacing: "0.16em",
            color: "var(--gold-30)",
            margin: 0,
            textTransform: "uppercase",
          }}
        >
          Milán · París · Ciudad de México
        </p>
      </div>
    </div>
  );
}
