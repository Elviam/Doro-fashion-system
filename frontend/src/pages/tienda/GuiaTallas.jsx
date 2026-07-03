import LayoutSeccionTienda from "../../components/tienda/LayoutSeccionTienda";

const tallas = [
  { talla: "XS", pecho: "80–84",  cintura: "60–64", cadera: "86–90",   equivalencia: "32–34" },
  { talla: "S",  pecho: "84–88",  cintura: "64–68", cadera: "90–94",   equivalencia: "34–36" },
  { talla: "M",  pecho: "88–92",  cintura: "68–72", cadera: "94–98",   equivalencia: "36–38" },
  { talla: "L",  pecho: "92–96",  cintura: "72–76", cadera: "98–102",  equivalencia: "38–40" },
  { talla: "XL", pecho: "96–100", cintura: "76–80", cadera: "102–106", equivalencia: "40–42" },
];

export default function GuiaTallas() {
  return (
    <LayoutSeccionTienda>

      <div className="mb-12 md:mb-16">
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-[var(--gold-dark)] dark:text-[var(--gold-light)] mb-5 leading-tight">
          Guía de Tallas
        </h1>
        <p className="font-body text-sm lg:text-base text-[var(--noir-soft)] dark:text-[var(--ash)] max-w-2xl leading-relaxed">
          Encuentra tu talla perfecta. Recuerda que ofrecemos cambio gratis por talla
          incorrecta en los primeros 14 días.
        </p>
      </div>

      {/* Cómo medirse */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { icon: "bi-rulers",           titulo: "Pecho",   texto: "Mide alrededor de la parte más ancha del pecho, manteniendo la cinta paralela al suelo." },
          { icon: "bi-circle",           titulo: "Cintura", texto: "Mide en la parte más estrecha del torso, generalmente 2 cm sobre el ombligo." },
          { icon: "bi-arrow-left-right", titulo: "Cadera",  texto: "Mide alrededor de la parte más ancha de las caderas, con los pies juntos." },
        ].map((m) => (
          <div key={m.titulo} className="bg-[var(--snow)] dark:bg-[var(--noir-soft)] border border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] rounded-[2px] p-7 text-center">
            <div className="w-14 h-14 rounded-full bg-[var(--gold-08)] flex items-center justify-center mx-auto mb-4">
              <i className={`bi ${m.icon} text-2xl text-[var(--gold-dark)] dark:text-[var(--gold-light)]`} />
            </div>
            <h3 className="font-body text-[var(--noir)] dark:text-[var(--snow)] font-semibold text-sm lg:text-base mb-3">{m.titulo}</h3>
            <p className="font-body text-sm text-[var(--noir-soft)] dark:text-[var(--ash)] leading-relaxed">{m.texto}</p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-[var(--snow)] dark:bg-[var(--noir-soft)] border border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] rounded-[2px] overflow-hidden mb-8 w-full">
        <div className="px-6 py-4 border-b border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)]">
          <h2 className="font-body text-[var(--gold-dark)] dark:text-[var(--gold-light)] font-semibold text-base lg:text-lg tracking-wide">Tabla de medidas (cm)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)]">
                {["Talla", "Pecho", "Cintura", "Cadera", "Equivalencia EU"].map((h) => (
                  <th key={h} className="font-tag text-left px-6 py-4 text-[var(--gold-dark)] dark:text-[var(--gold-light)] font-semibold tracking-wider text-xs uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tallas.map((t) => (
                <tr key={t.talla} className="border-b border-[var(--border-gold-25)] hover:bg-[var(--gold-08)] transition-colors">
                  <td className="px-6 py-4 font-black text-[var(--gold-dark)] dark:text-[var(--gold-light)] text-lg">{t.talla}</td>
                  <td className="px-6 py-4 text-[var(--noir-soft)] dark:text-[var(--ash)] text-sm">{t.pecho}</td>
                  <td className="px-6 py-4 text-[var(--noir-soft)] dark:text-[var(--ash)] text-sm">{t.cintura}</td>
                  <td className="px-6 py-4 text-[var(--noir-soft)] dark:text-[var(--ash)] text-sm">{t.cadera}</td>
                  <td className="px-6 py-4 text-[var(--noir-soft)] dark:text-[var(--ash)] text-sm">{t.equivalencia}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-[var(--gold-08)] border border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] rounded-[2px] px-6 py-5 flex items-start gap-4">
        <i className="bi bi-info-circle text-[var(--gold-dark)] dark:text-[var(--gold-light)] text-xl mt-0.5" />
        <p className="font-body text-sm text-[var(--noir-soft)] dark:text-[var(--ash)] leading-relaxed">
          Si estás entre dos tallas, te recomendamos elegir la más grande para mayor comodidad.
          ¿Tienes dudas? Escríbenos a <span className="text-[var(--gold-dark)] dark:text-[var(--gold-light)]">support@doro.com</span>.
        </p>
      </div>

    </LayoutSeccionTienda>
  );
}