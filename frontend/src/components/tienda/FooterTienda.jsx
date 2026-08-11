// src/components/tienda/FooterTienda.jsx
import { useNavigate } from "react-router-dom";

const columnas = [
  {
    titulo: "Ayuda",
    links: [
      { nombre: "Envíos",         id: "envios" },
      { nombre: "Devoluciones",   id: "devoluciones" },
      { nombre: "Guía de tallas", id: "guia-tallas" },
      { nombre: "Contacto",       id: "contacto" },
      { nombre: "FAQ",            id: "faq" },
    ],
  },
  {
    titulo: "Maison",
    links: [
      { nombre: "Sobre D'oro",     id: "sobre-doro" },
      { nombre: "Sustentabilidad", id: "sustentabilidad" },
      { nombre: "Términos",        id: "terminos" },
    ],
  },
];

const rutas = {
  envios:           "/tienda/envios",
  devoluciones:     "/tienda/devoluciones",
  "guia-tallas":    "/tienda/guia-tallas",
  contacto:         "/tienda/contacto",
  faq:              "/tienda/faq",
  "sobre-doro":     "/tienda/sobre-doro",
  sustentabilidad:  "/tienda/sustentabilidad",
  terminos:         "/tienda/terminos",
};

// D'oro wordmark — idéntico al de la landing
const DoroWordmark = () => (
  <div
    style={{
      fontFamily: "var(--font-display)",
      fontSize: 22,
      fontWeight: 300,
      letterSpacing: "0.22em",
      color: "var(--gold-light)",
      userSelect: "none",
      display: "flex",
      alignItems: "baseline",
      gap: "2px",
    }}
  >
    D
    <span style={{ fontStyle: "italic", color: "var(--gold)", marginRight: "1px" }}>'</span>
    ORO
  </div>
);

export default function FooterTienda() {
  const navigate = useNavigate();

  return (
    <footer
      style={{
        background: "var(--noir)",
        borderTop: "1px solid var(--border-gold-20)",
      }}
    >
      <div className="max-w-[1480px] mx-auto px-6 lg:px-10 py-12">
        <div
          className="flex flex-wrap gap-10"
          style={{ justifyContent: "space-between", alignItems: "flex-start" }}
        >

          {/* Marca */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "300px" }}>
            <DoroWordmark />
            <p
              style={{
                fontFamily: "var(--font-tag)",
                fontSize: "10px",
                letterSpacing: "0.2em",
                color: "var(--gold-50, rgba(214,171,52,0.5))",
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              Alta Moda · Desde 1986
            </p>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                fontStyle: "italic",
                color: "var(--ash)",
                lineHeight: 1.7,
                marginTop: "4px",
              }}
            >
              Prendas construidas con materia prima excepcional, diseño atemporal y una obsesión silenciosa por la perfección.
            </p>
          </div>

          {/* Columnas de links */}
          <div style={{ display: "flex", gap: "56px", flexWrap: "wrap" }}>
            {columnas.map((col) => (
              <div key={col.titulo} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
                  {col.titulo}
                </p>
                <ul className="m-0 p-0 list-none" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {col.links.map((link) => (
                    <li key={link.id}>
                      <button
                        onClick={() => navigate(rutas[link.id])}
                        className="bg-transparent border-none p-0 m-0 cursor-pointer text-left"
                        style={{
                          fontFamily: "var(--font-tag)",
                          fontSize: "10px",
                          fontWeight: 300,
                          letterSpacing: "0.14em",
                          color: "var(--ash)",
                          textTransform: "uppercase",
                          transition: "color 0.2s, letter-spacing 0.3s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "var(--gold)";
                          e.currentTarget.style.letterSpacing = "0.2em";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "var(--ash)";
                          e.currentTarget.style.letterSpacing = "0.14em";
                        }}
                      >
                        {link.nombre}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Métodos de pago */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
              Aceptamos
            </p>
            <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
              {[
                { icono: "bi-credit-card-2-front", label: "Tarjeta" },
                { icono: "bi-shop",                label: "OXXO"    },
              ].map(({ icono, label }) => (
                <i
                  key={label}
                  className={`bi ${icono}`}
                  title={label}
                  style={{
                    fontSize: "18px",
                    color: "var(--ash)",
                    transition: "color 0.2s",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ash)")}
                />
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Copyright bar */}
      <div
        style={{
          background: "var(--noir)",
          borderTop: "1px solid rgba(201,168,76,0.1)",
          padding: "16px 0",
        }}
      >
        <div className="mx-auto grid max-w-[1480px] min-w-0 gap-3 px-6 text-center lg:grid-cols-[auto_minmax(280px,620px)_auto] lg:items-center lg:px-10 lg:text-left">
          <p
            style={{
              fontFamily: "var(--font-tag)",
              fontSize: "9px",
              letterSpacing: "0.16em",
              color: "rgba(247,240,230,0.25)",
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
              lineHeight: 1.55,
              color: "rgba(247,240,230,0.45)",
              margin: 0,
            }}
          >
            D'oro es una marca ficticia creada con fines académicos y de portafolio. Los nombres, ubicaciones y datos comerciales forman parte del concepto del proyecto.
          </p>
          <p
            className="lg:text-right"
            style={{
              fontFamily: "var(--font-tag)",
              fontSize: "9px",
              letterSpacing: "0.16em",
              color: "rgba(214,171,52,0.3)",
              margin: 0,
              textTransform: "uppercase",
            }}
          >
            Milán · París · Ciudad de México
          </p>
        </div>
      </div>
    </footer>
  );
}
