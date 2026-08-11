import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import hero from "../assets/images/hero.png";
import products from "../assets/images/products.png"
import useTitulo from "../hooks/useTitulo";
import FooterTienda from "../components/tienda/FooterTienda";

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
  .header-nav {
    display: none;
  }

  .split-section {
    flex-direction: column;
  }

  .split-section > div {
    flex: 1 1 100% !important;
  }

  .split-section .manifesto-text {
    order: 1;
    padding: 60px 48px !important;
  }

  .split-section .heritage-image {
    order: 2;
  }

  .pillars-grid > div {
    flex: 1 1 45% !important;
    max-width: 100% !important;
  }

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

    .heritage-image {
      min-height: 320px !important;
    }
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
        <div className="header-btns">
          <button
            onClick={() => navigate("/login")}
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
            Iniciar sesión
          </button>

          <button
            onClick={() => navigate("/tienda")}
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
            Tienda
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
          HERITAGE SPLIT
      ══════════════════════════════════════════════════════════════════ */}
     <section className="split-section">
 <div
  className="heritage-image"
  style={{
    flex: "1 1 380px",
    minHeight: "480px",
    overflow: "hidden",
    position: "relative",
  }}
>
  <img
    src={products}
    alt="Colección D'oro"
    className="img-zoom"
    style={{
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      objectPosition: "center",
      display: "block",
    }}
  />

  <div
    style={{
      position: "absolute",
      bottom: "36px",
      left: "36px",
      zIndex: 2,
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
      D'oro Boutique
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
      Identidad D'oro
    </p>

    <h2
      style={{
        fontFamily: "var(--font-display)",
        fontSize: "clamp(28px, 3.6vw, 42px)",
        fontWeight: 300,
        fontStyle: "italic",
        color: "var(--noir)",
        lineHeight: 1.2,
        margin: 0,
      }}
    >
      Estilo atemporal para cada ocasión
    </h2>

    <p
      style={{
        fontFamily: "var(--font-body)",
        fontSize: "clamp(16px, 1.8vw, 18px)",
        color: "var(--ash)",
        lineHeight: 1.85,
        margin: 0,
      }}
    >
      En D'oro, cada prenda forma parte de una colección pensada para
      expresar elegancia, personalidad y estilo atemporal.
    </p>

    <GoldDivider />
  </div>
</section>

      {/* ══════════════════════════════════════════════════════════════════
          PILLARS
      ══════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          background: "var(--ivory-clear)",
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
             fontSize: "clamp(28px, 3.6vw, 42px)",
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
             fontSize: "clamp(16px, 1.8vw, 18px)",
            color: "var(--ash)",
            lineHeight: 1.75,
            maxWidth: "620px",
            margin: "0 auto 64px",
            
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

      <FooterTienda />
    </div>
  );
}
