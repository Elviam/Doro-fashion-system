import LayoutSeccionTienda from "../../components/tienda/LayoutSeccionTienda";

export default function Contacto() {
  return (
    <LayoutSeccionTienda>

      <div className="mb-12 md:mb-16">
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-[var(--gold-dark)] dark:text-[var(--gold-light)] mb-5 leading-tight">
          Contacto
        </h1>
        <p className="font-body text-sm lg:text-base text-[var(--noir-soft)] dark:text-[var(--ash)] max-w-2xl leading-relaxed">
          ¿Tienes una pregunta, comentario o simplemente quieres saludarnos? Escríbenos,
          respondemos en máximo 24 horas.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-5">
        {[
          { icon: "bi-envelope-heart", titulo: "Email",     valor: "support@doro.com",                        href: null },
          { icon: "bi-whatsapp",       titulo: "WhatsApp",  valor: "+52 55 1234 5678",                           href: null },
          { icon: "bi-instagram",      titulo: "Instagram", valor: "@Doro_Boutique",
            href: "https://www.instagram.com" },
          { icon: "bi-geo-alt",        titulo: "Ubicación", valor: "Ciudad de México, México",                   href: null },
        ].map((c) => (
          <div
            key={c.titulo}
            className="flex-1 min-w-[220px] bg-[var(--snow)] dark:bg-[var(--noir-soft)] border border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] rounded-[2px] p-6 flex items-center gap-5"
          >
            <div className="w-12 h-12 rounded-[2px] bg-[var(--gold-08)] flex items-center justify-center shrink-0">
              <i className={`bi ${c.icon} text-2xl text-[var(--gold-dark)] dark:text-[var(--gold-light)]`} />
            </div>
            <div>
              <p className="font-tag text-xs lg:text-sm text-[var(--gold-dark)] dark:text-[var(--gold-light)] uppercase tracking-wider font-semibold mb-1">{c.titulo}</p>
              {c.href ? (
                <a
                  href={c.href}
                  target="_blank"
                  rel="noreferrer"
                  className="font-body text-sm text-[var(--noir)] dark:text-[var(--snow)] hover:text-[var(--gold-dark)] dark:hover:text-[var(--gold-light)] transition-colors"
                >
                  {c.valor}
                </a>
              ) : (
                <p className="font-body text-sm text-[var(--noir)] dark:text-[var(--snow)]">{c.valor}</p>
              )}
            </div>
          </div>
        ))}
      </div>

    </LayoutSeccionTienda>
  );
}