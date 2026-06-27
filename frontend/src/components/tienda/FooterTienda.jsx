// src/components/tienda/FooterTienda.jsx
import { useNavigate } from "react-router-dom";

const columnas = [
  {
    titulo: "Ayuda",
    links: [
      { nombre: "Envíos",        id: "envios" },
      { nombre: "Devoluciones",  id: "devoluciones" },
      { nombre: "Guía de tallas", id: "guia-tallas" },
      { nombre: "Contacto",      id: "contacto" },
      { nombre: "FAQ",           id: "faq" },
    ],
  },
  {
    titulo: "Empresa",
    links: [
      { nombre: "Sobre AURA",       id: "sobre-aura" },
      { nombre: "Sustentabilidad",  id: "sustentabilidad" },
      { nombre: "Términos",         id: "terminos" },
    ],
  },
];

const redesSociales = [
  { nombre: "Instagram", icono: "bi-instagram", url: "https://www.instagram.com/softaura.bliss/" },
  { nombre: "Twitter/X", icono: "bi-twitter-x", url: "https://x.com/aura_clothes" },
  
];

const rutas = {
  envios:           "/tienda/envios",
  devoluciones:     "/tienda/devoluciones",
  "guia-tallas":    "/tienda/guia-tallas",
  contacto:         "/tienda/contacto",
  faq:              "/tienda/faq",
  "sobre-aura":     "/tienda/sobre-aura",
  sustentabilidad:  "/tienda/sustentabilidad",
  terminos:         "/tienda/terminos",
};

export default function FooterTienda() {
  const navigate = useNavigate();

  return (
    <footer className="mt-16 bg-oscuro-card border-t border-lila/10">
      <div className="max-w-[1480px] mx-auto px-6 lg:px-10 py-12 grid grid-cols-2 md:grid-cols-5 gap-8">

        {/* Marca */}
        <div className="col-span-2">
          <h3 className="text-3xl text-lila tracking-tight" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
            AURA
          </h3>
          <p className="mt-3 text-sm text-lila-soft max-w-sm">
            Boutique digital de moda urbana. Diseñado en CDMX con piezas en edición limitada para cada mood.
          </p>
          <div className="mt-4 flex gap-3">
            {redesSociales.map((red) => (
              <a key={red.nombre} href={red.url} target="_blank" rel="noreferrer"
                aria-label={red.nombre}
                className="w-9 h-9 rounded-full bg-lila/10 text-lila hover:bg-lila hover:text-oscuro transition flex items-center justify-center"
              >
                <i className={`bi ${red.icono}`} />
              </a>
            ))}
          </div>
        </div>

        {/* Columnas de links */}
        {columnas.map((col) => (
          <div key={col.titulo}>
            <p className="text-[11px] tracking-[3px] text-lila-mid uppercase font-bold mb-3">
              {col.titulo}
            </p>
            <ul className="m-0 p-0 list-none flex flex-col gap-2">
              {col.links.map((link) => (
                <li key={link.id}>
                  <button
                    onClick={() => navigate(rutas[link.id])}
                    className="text-sm text-lila-soft hover:text-blanco cursor-pointer transition-colors text-left bg-transparent border-none p-0 m-0 font-normal"
                  >
                    {link.nombre}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Copyright */}
      <div className="border-t border-lila/10 py-4">
        <div className="max-w-[1480px] mx-auto px-6 lg:px-10 flex justify-between items-center flex-wrap gap-3">
          <p className="text-xs text-text-muted">© 2026 AURA Boutique · Todos los derechos reservados</p>
          <div className="flex gap-2 items-center text-text-muted">
            <span className="text-[10px] tracking-widest uppercase">Aceptamos</span>
            <i className="bi bi-credit-card-2-front text-lg" />
            <i className="bi bi-paypal text-lg" />
            <i className="bi bi-apple text-lg" />
            <i className="bi bi-shop text-lg" />
          </div>
        </div>
      </div>
    </footer>
  );
}