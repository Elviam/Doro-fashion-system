// src/components/tienda/FooterTienda.jsx
import { useNavigate } from "react-router-dom";

const IconInstagram = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L2.14 2.25H8.38l4.259 5.631L18.244 2.25zM17.08 19.77h1.833L7.084 4.126H5.117L17.08 19.77z" />
  </svg>
);

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

const redesSociales = [
  { nombre: "Instagram", url: "https://www.instagram.com", Icon: IconInstagram },
  { nombre: "X",         url: "https://x.com",             Icon: IconX         },
];

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
            <div style={{ display: "flex", gap: "16px", marginTop: "4px" }}>
              {redesSociales.map(({ nombre, url, Icon }) => (
                <a
                  key={nombre}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={nombre}
                  style={{
                    color: "var(--gold-50, rgba(214,171,52,0.5))",
                    display: "inline-flex",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--gold-50, rgba(214,171,52,0.5))")}
                >
                  <Icon />
                </a>
              ))}
            </div>
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
                { icono: "bi-paypal",              label: "PayPal"  },
                { icono: "bi-apple",               label: "Apple Pay" },
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
        <div
          className="max-w-[1480px] mx-auto px-6 lg:px-10 flex flex-wrap justify-between items-center gap-2"
        >
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