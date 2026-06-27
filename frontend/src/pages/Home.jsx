import { use, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import heroCollage from "../assets/images/hero-collage.jpg";
import clothesRack1 from "../assets/images/clothes-rack-1.jpg";
import clothesRack2 from "../assets/images/clothes-rack-2.jpg";
import clothesRack3 from "../assets/images/clothes-rack-3.jpg";
import useTitulo from "../hooks/useTitulo";



// ─── Google Fonts ───────────────────────────────────────────────────────────
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Aboreto&family=Cinzel+Decorative:wght@400;700&family=Baskervville:ital@0;1&display=swap');
  `}</style>
);

// ─── Global Styles: fix #root + fuentes + animaciones ──────────────────────
const GlobalStyles = () => (
  <style>{`
    html, body {
      width: 100%;
      margin: 0;
      padding: 0;
      overflow-x: hidden;
    }
    #root {
      width: 100%;
      max-width: 100% !important;
      padding: 0 !important;
      margin: 0 !important;
    }

    :root {
      --font-display: 'Cinzel Decorative', serif;
      --font-tag:     'Aboreto', cursive;
      --font-body:    'Baskervville', serif;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(28px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .fade-up  { animation: fadeUp 0.9s ease both; }
    .delay-1  { animation-delay: 0.15s; }
    .delay-2  { animation-delay: 0.3s;  }
    .delay-3  { animation-delay: 0.45s; }
    .delay-4  { animation-delay: 0.6s;  }

    @keyframes countPulse {
      0%   { transform: scale(0.8); opacity: 0; }
      60%  { transform: scale(1.05); opacity: 1; }
      100% { transform: scale(1); }
    }
    .stat-num          { animation: countPulse 0.7s ease both; }
    .stat-num.delay-1  { animation-delay: 0.1s;  }
    .stat-num.delay-2  { animation-delay: 0.25s; }
    .stat-num.delay-3  { animation-delay: 0.4s;  }

    @media (max-width: 900px) {
      .enfoque-strip {
        flex-direction: column;
        align-items: stretch;
        height: auto;
      }
      .enfoque-strip > .enfoque-img-1,
      .enfoque-strip > .enfoque-card,
      .enfoque-strip > .enfoque-img-2 {
        width: 100%;
        min-height: 240px;
      }
      .enfoque-img-1 { order: 1; }
      .enfoque-card  { order: 2; }
      .enfoque-img-2 { order: 3; }
    }
  `}</style>
);

// ─── Inline styles ──────────────────────────────────────────────────────────
const s = {
  /* HEADER */
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 40px",
    background: "var(--color-bg)",        
    width: "100%",
    boxSizing: "border-box",
  },
  logoImg: { height: 45 },
  signInBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 10px",
    background: "rgba(201,184,232,0.35)",
    border: "0.5px solid var(--color-oscuro-card)",  
    borderRadius: "10px",
    color: "var(--color-oscuro)",                 
    fontFamily: "var(--font-tag)",
    fontSize: "13px",
    letterSpacing: "0.08em",
    cursor: "pointer",
    transition: "background 0.25s, box-shadow 0.25s",
    textDecoration: "none",
    whiteSpace: "nowrap",
  },

  /* HERO */
  hero: {
    display: "flex",
    flexWrap: "wrap",
    minHeight: "520px",
    background: "var(--color-lila-soft)",  
    width: "100%",
  },
  heroLeft: {
    flex: "1 1 340px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "60px 50px 60px 60px",
    gap: "40px",
  },
  tagline: {
    fontFamily: "var(--font-tag)",
    fontSize: "clamp(16px, 2vw, 24px)",
    color: "var(--color-oscuro)",         
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    textAlign: "center",
  },
  heroHeading: {
    fontFamily: "var(--font-display)",
    fontSize: "clamp(32px, 5vw, 55px)",
    color: "var(--color-oscuro)",          
    lineHeight: 1.15,
    fontWeight: 400,
    textAlign: "center",
  },
  heroParagraph: {
    fontFamily: "var(--font-body)",
    fontSize: "clamp(16px, 1.8vw, 22px)",
    color: "var(--color-oscuro)",          
    lineHeight: 1.7,
    maxWidth: "420px",
    margin: "0 auto",
    textAlign: "center",
  },
  heroRight: {
    flex: "1 1 300px",
    minHeight: "380px",
    overflow: "hidden",
  },
  heroImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  /* STATS BAR 3 TARJETAS*/
  statsBar: {
    display: "flex",
    flexWrap: "wrap",
    background: "var(--color-oscuro)",     
    width: "100%",
  },
  statItem: {
    flex: "1 1 200px",
    padding: "36px 40px",
    borderRight: "var(--color-blanco) solid 1px",
    borderBottom: "var(--color-blanco) solid 1px",
    borderTop: "var(--color-blanco) solid 1px",
    
  },
  statItemLast: {
    flex: "1 1 200px",
    padding: "36px 40px",
    borderBottom: "var(--color-blanco) solid 1px",
    borderTop: "var(--color-blanco) solid 1px",
    
  },
  statBig: {
    fontFamily: "var(--font-display)",
    fontSize: "clamp(45px, 5vw, 64px)",
    color: "var(--color-blanco)",      
    lineHeight: 1,
    display: "flex",
    alignItems: "baseline",
    gap: "6px",
    fontWeight: 400,
  },
  statPlus: {
    fontFamily: "var(--font-body)",
    fontSize: "clamp(20px, 2.5vw, 32px)",
    color: "var(--color-lila)",       
  },
  statSuffix: {
    fontFamily: "var(--font-tag)",
    fontSize: "clamp(11px, 1.2vw, 14px)",
    color: "var(--color-lila)",       
    letterSpacing: "0.12em",
    marginLeft: "4px",
  },
  statLabel: {
    fontFamily: "var(--font-body)",
    fontSize: "clamp(13px, 1.4vw, 16px)",
    color: "var(--color-lila)",       
    marginTop: "10px",
    lineHeight: 1.4,
  },

  /* IDENTITY SECTION */
  identitySection: {
    display: "flex",
    flexWrap: "wrap",
    width: "100%",
  },
  identityImgWrap: {
    flex: "1 1 320px",
    minHeight: "420px",
    display: "flex",
    flexDirection: "column",
  },
  identityImgTop: {
    flex: 1,
    overflow: "hidden",
    minHeight: "260px",
  },
  identityImgTopImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  //esencia card 
  identityLavenderCard: {
    background: "var(--color-lila-mid)", 
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    minHeight: "200px",
  },
  identityLavenderLabel: {
    fontFamily: "var(--font-tag)",
    fontSize: "clamp(28px, 2.5vw, 38px)",
    color: "rgba(44, 40, 105, 0.5)",         
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  //identidad
  identityText: {
    flex: "1 1 320px",
    padding: "60px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "30px",
    background: "var(--color-blanco)",   
  },
  sectionEyebrow: {
    fontFamily: "var(--font-tag)",
    fontSize: "clamp(12px, 3vw, 14px)",
    letterSpacing: "0.1em",
    color: "var(--color-oscuro)",        
    textTransform: "uppercase",
     textAlign: "center", 
  },
  sectionHeading: {
    fontFamily: "var(--font-display)",
    fontSize: "clamp(15px, 3vw, 28px)",
    color: "var(--color-oscuro)",          
    lineHeight: 1.25,
    fontWeight: 400,
    textAlign: "center", 
     
  },
  sectionParagraph: {
    fontFamily: "var(--font-body)",
    fontSize: "clamp(15px, 1.5vw, 18px)",
    color: "var(--color-text-muted)",      
    lineHeight: 1.75,
     textAlign: "center", 
    
  },

  /* ENFOQUE PHOTO STRIP */
  enfoqueStrip: {
    display: "flex",
    flexWrap: "wrap",
    height: "auto",
    overflow: "hidden",
    position: "relative",
    width: "100%",
    alignItems: "stretch",
  },
  enfoqueImg: {
    flex: "1 1 200px",
    overflow: "hidden",
    minHeight: "250px",
    display: "flex",
  },
  enfoqueCard: {
    flex: "1 1 240px",
    minHeight: "250px",
    background: "var(--color-oscuro)",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    boxSizing: "border-box",
  },
  enfoqueImgEl: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    filter: "brightness(0.72)",
    transition: "transform 0.6s ease, filter 0.4s",
  },
  enfoqueOverlay: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  enfoqueLabel: {
    fontFamily: "var(--font-tag)",
    fontSize: "clamp(28px, 2.5vw, 38px)",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  

  /* MANUFACTURE SECTION */
  manufactureSection: {
    background: "var(--color-bg)",        
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "30px",
    width: "100%",
    boxSizing: "border-box",
  },
  manufactureHeading: {
    fontFamily: "var(--font-display)",
    fontSize: "clamp(24px, 4vw, 38px)",
    color: "var(--color-oscuro)",          
    lineHeight: 1.25,
    fontWeight: 400,
    maxWidth: "600px",
  },
  manufactureParagraph: {
    fontFamily: "var(--font-body)",
    fontSize: "clamp(15px, 1.6vw, 20px)",
    color: "var(--color-text-muted)",      
    lineHeight: 1.75,
    maxWidth: "700px",
  },

  /* FEATURE CARDS */
  cardsGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0",
    padding: "0 60px 80px",
    background: "var(--color-bg)",         
    justifyContent: "center",
    width: "100%",
    boxSizing: "border-box",
  },
  card: {
    flex: "1 1 220px",
    background: "rgba(204, 183, 244, 0.35)",  
    border: "1px solid rgba(166,141,200,0.3)",
    borderRadius: "4px",
    padding: "32px 28px",
    margin: "8px",
    maxWidth: "340px",
    transition: "transform 0.3s, box-shadow 0.3s",
    cursor: "default",
  },
  cardTitle: {
    fontFamily: "var(--font-tag)",
    fontSize: "15px",
    letterSpacing: "0.1em",
    color: "var(--color-oscuro)",          
    textTransform: "uppercase",
    marginBottom: "14px",
  },
  cardText: {
    fontFamily: "var(--font-body)",
    fontSize: "14.5px",
    color: "var(--color-text-muted)",      
    lineHeight: 1.5,
    
  },

  /* FOOTER */
  footer: {
    background: "var(--color-oscuro)",     
    padding: "40px 50px",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "24px",
    width: "100%",
    boxSizing: "border-box",
  },
  footerLogoWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  footerLogo: { height: 38, 
    filter: "brightness(0) invert(1)", 
    color: "var(--color-lila-soft)",
  },
  footerTagline: {
    fontFamily: "var(--font-tag)",
    fontSize: "11px",
    color: "var(--color-lila-soft)",      
    letterSpacing: "0.12em",
  },
  footerNav: {
    display: "flex",
    gap: "32px",
    flexWrap: "wrap",
  },
  footerLink: {
    fontFamily: "var(--font-tag)",
    fontSize: "12px",
    letterSpacing: "0.14em",
    color: "var(--color-lila-soft)",
    textDecoration: "none",
    textTransform: "uppercase",
    transition: "color 0.2s",
  },
  footerSocial: {
    display: "flex",
    gap: "18px",
    alignItems: "center",
    
  },
  socialIcon: {
    width: "20px",
    height: "20px",
    fill: "var(--color-lila-soft)",
    cursor: "pointer",
    transition: "fill 0.2s",
  },
};


const AuraLogo = ({ size = 45, color = "#000" }) => {
  return (
    <div
      style={{
        display: "flex",
        gap: "6px",
        fontFamily: "var(--font-display)",
        fontSize: size,
        letterSpacing: "5px",
        color: color, 
      }}
    >
      AURA
    </div>
  );
};
// ─── SVG Social Icons ───────────────────────────────────────────────────────
const IconInstagram = () => (
  <svg viewBox="0 0 24 24" style={s.socialIcon}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);
const IconX = () => (
  <svg viewBox="0 0 24 24" style={s.socialIcon}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L2.14 2.25H8.38l4.259 5.631L18.244 2.25zM17.08 19.77h1.833L7.084 4.126H5.117L17.08 19.77z" />
  </svg>
);

// ─── Home Component ─────────────────────────────────────────────────────────
export default function Home() {
  useTitulo("Home");
  const cardRefs = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
          }
        });
      },
      { threshold: 0.15 }
    );
    cardRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const addRef = (el) => {
    if (el && !cardRefs.current.includes(el)) cardRefs.current.push(el);
  };

  const observedStyle = {
    opacity: 0,
    transform: "translateY(32px)",
    transition: "opacity 0.7s ease, transform 0.7s ease",
  };

  return (
    <div style={{ width: "100%", overflowX: "hidden" }}>
      <FontLoader />
      <GlobalStyles />

      {/* ── HEADER ── */}
<header style={s.header}>
  <AuraLogo size={32} color="var(--color-oscuro-card)" />
    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
    <button
      style={s.signInBtn}
      onClick={() => navigate("/Register")}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(201,184,232,0.6)";
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(166,141,200,0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(201,184,232,0.35)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      REGISTER
    </button>

    <button
      style={s.signInBtn}
      onClick={() => navigate("/login")}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(201,184,232,0.6)";
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(166,141,200,0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(201,184,232,0.35)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      SIGN IN
    </button>
  </div>
</header>

      {/* ── HERO ── */}
      <section style={s.hero}>
        <div style={s.heroLeft}>
          <p className="fade-up" style={s.tagline}>Viste tu esencia</p>
          <h1 className="fade-up delay-1" style={s.heroHeading}>
            Detrás de cada gran diseño existe un Aura
          </h1>
          <p className="fade-up delay-2" style={s.heroParagraph}>
            Acompañamos a nuestros clientes en cada momento de su estilo. En Aura
            materializamos la esencia de quienes se atreven a destacar.
          </p>
          <button
            className="fade-up delay-3"
            onClick={() => navigate("/tienda")}
            style={{
              fontFamily: "var(--font-tag)",
              fontSize: "13px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              padding: "14px 36px",
              background: "var(--color-oscuro)",
              color: "var(--color-lila-soft)",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "background 0.25s, transform 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-oscuro-card)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--color-oscuro)";
              e.currentTarget.style.transform = "none";
            }}
        >
            Ir a tienda
  </button>
  
        </div>
        <div style={s.heroRight}>
          <img src={heroCollage} alt="Hero collage AURA" style={s.heroImg} />
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div style={s.statsBar}>
        {[
          { plus: "+", num: "25",  suffix: "mil", label: "Prendas producidas mensualmente" },
          { plus: "+", num: "150", suffix: "",    label: "Tiendas asociadas en AURA" },
          { plus: "+", num: "50",  suffix: "mil", label: "Prendas vendidas" },
        ].map((stat, i) => (
          <div key={i} style={i < 2 ? s.statItem : s.statItemLast}>
            <div className={`stat-num delay-${i + 1}`} style={s.statBig}>
              <span style={s.statPlus}>{stat.plus}</span>
              {stat.num}
              {stat.suffix && <span style={s.statSuffix}>{stat.suffix}</span>}
            </div>
            <p style={s.statLabel}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── IDENTITY ── */}
      <section style={s.identitySection}>
        <div style={s.identityImgWrap}>
          <div style={{ ...s.identityImgTop, minHeight: "260px" }}>
            <img src={clothesRack1} alt="Ropa en perchero" style={s.identityImgTopImg} />
          </div>
          <div style={s.identityLavenderCard}>
            <span style={s.identityLavenderLabel}>Esencia</span>
          </div>
        </div>
        <div ref={addRef} style={{ ...s.identityText, ...observedStyle }}>
          <p style={s.sectionEyebrow}>Base de identidad</p>
          <h2 style={s.sectionHeading}>El estilo como declaración de existencia</h2>
          <p style={s.sectionParagraph}>
            Cada prenda es una declaración de quiénes somos. En Aura materializamos la
            esencia de quienes se atreven a destacar, a través de materiales y colecciones
            que honran esa visión única.
          </p>
        </div>
      </section>

      {/* ── ENFOQUE PHOTO STRIP ── */}
      <div style={s.enfoqueStrip} className="enfoque-strip">
        <div style={s.enfoqueImg} className="enfoque-img-1">
          <img src={clothesRack2} alt="Prendas en foco" style={s.enfoqueImgEl} />
        </div>
        <div style={s.enfoqueCard} className="enfoque-card">
          <div style={s.enfoqueOverlay}>
            <span style={s.enfoqueLabel}>Enfoque</span>
          </div>
        </div>
        <div style={s.enfoqueImg} className="enfoque-img-2">
          <img src={clothesRack3} alt="Prendas en exhibición" style={s.enfoqueImgEl} />
        </div>
      </div>

      {/* ── MANUFACTURE ── */}
      <section ref={addRef} style={{ ...s.manufactureSection, ...observedStyle }}>
        <p style={s.sectionEyebrow}>Enfoque moderno y tecnológico</p>
        <h2 style={s.manufactureHeading}>
          Manufactura inteligente, calidad imperecedera
        </h2>
        <p style={s.manufactureParagraph}>
          La intersección entre innovación tecnológica y maestría artesanal. Procesos
          digitalizados con control de inventario inteligente para una manufactura
          transparente y humana.
        </p>
      </section>

      {/* ── FEATURE CARDS ── */}
      <div style={s.cardsGrid}>
        {[
          {
            title: "Inventario Digital",
            text: "Control inteligente en tiempo real que reduce desperdicios y optimiza cada proceso productivo de principio a fin.",
          },
          {
            title: "Red de Distribución",
            text: "Más de 150 tiendas conectadas a un ecosistema transparente y eficiente en toda la región latinoamericana.",
          },
          {
            title: "Manufactura Ética",
            text: "Cada prenda nace de un proceso que respeta el trabajo artesanal y honra la sostenibilidad de los materiales.",
          },
        ].map((card, i) => (
          <div
            key={i}
            ref={addRef}
            style={{ ...s.card, ...observedStyle }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 12px 32px rgba(44,42,74,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <p style={s.cardTitle}>{card.title}</p>
            <p style={s.cardText}>{card.text}</p>
          </div>
        ))}
      </div>

      {/* ── FOOTER ── */}
      <footer style={s.footer}>
        <div style={s.footerLogoWrap}>
          <AuraLogo size={28} color="var(--color-lila-soft)" />
          <span style={s.footerTagline}>Viste tu esencia</span>
        </div>
        <nav style={s.footerNav}>
          {["Colección", "Empresa", "Soporte"].map((item) => (
            <a
              key={item}
              
              style={s.footerLink}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-lila-soft)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}
            >
              {item}
            </a>
          ))}
        </nav>
        <div style={s.footerSocial}>
          <a
            href="https://www.instagram.com/softaura.bliss/"
            target="_blank"
            rel="noreferrer"
            style={{ display: "inline-flex", padding: 0 }}
            aria-label="Instagram"
          >
            <IconInstagram />
          </a>
          <a
            href="https://x.com"
            target="_blank"
            rel="noreferrer"
            style={{ display: "inline-flex", padding: 0 }}
            aria-label="X"
          >
            <IconX />
          </a>
        </div>
      </footer>
    </div>
  );
}