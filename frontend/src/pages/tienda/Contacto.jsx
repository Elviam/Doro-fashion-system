import LayoutSeccionTienda from "../../components/tienda/LayoutSeccionTienda";

export default function Contacto() {
  return (
    <LayoutSeccionTienda>

      <div className="mb-12 md:mb-16">
        <h1 className="text-3xl sm:text-4xl md:text-5xl text-lila mb-5 leading-tight"
          style={{ fontFamily: "'Cinzel Decorative', serif" }}>
          Contacto
        </h1>
        <p className="text-sm md:text-base text-lila-soft max-w-2xl leading-relaxed">
          ¿Tienes una pregunta, comentario o simplemente quieres saludarnos? Escríbenos,
          respondemos en máximo 24 horas.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-5">
        {[
          { icon: "bi-envelope-heart", titulo: "Email",     valor: "hola@softaura.bliss",                        href: null },
          { icon: "bi-whatsapp",       titulo: "WhatsApp",  valor: "+52 55 1234 5678",                           href: null },
          { icon: "bi-instagram",      titulo: "Instagram", valor: "@softaura.bliss",
            href: "https://www.instagram.com/softaura.bliss/" },
          { icon: "bi-geo-alt",        titulo: "Ubicación", valor: "Ciudad de México, México",                   href: null },
        ].map((c) => (
          <div
            key={c.titulo}
            className="flex-1 min-w-[220px] bg-oscuro-card border border-lila/10 rounded-2xl p-6 flex items-center gap-5"
          >
            <div className="w-12 h-12 rounded-xl bg-lila/10 flex items-center justify-center shrink-0">
              <i className={`bi ${c.icon} text-2xl text-lila`} />
            </div>
            <div>
              <p className="text-sm text-lila-mid uppercase tracking-wider font-semibold mb-1">{c.titulo}</p>
              {c.href ? (
                <a
                  href={c.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-blanco hover:text-lila transition-colors"
                >
                  {c.valor}
                </a>
              ) : (
                <p className="text-sm text-blanco">{c.valor}</p>
              )}
            </div>
          </div>
        ))}
      </div>

    </LayoutSeccionTienda>
  );
}