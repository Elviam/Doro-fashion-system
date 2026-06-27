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
        <h1 className="text-3xl sm:text-4xl md:text-5xl text-lila mb-5 leading-tight"
          style={{ fontFamily: "'Cinzel Decorative', serif" }}>
          Guía de Tallas
        </h1>
        <p className="text-sm md:text-base text-lila-soft max-w-2xl leading-relaxed">
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
          <div key={m.titulo} className="bg-oscuro-card border border-lila/10 rounded-2xl p-7 text-center">
            <div className="w-14 h-14 rounded-full bg-lila/10 flex items-center justify-center mx-auto mb-4">
              <i className={`bi ${m.icon} text-2xl text-lila`} />
            </div>
            <h3 className="text-blanco font-semibold text-base mb-3">{m.titulo}</h3>
            <p className="text-sm text-lila-soft leading-relaxed">{m.texto}</p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-oscuro-card border border-lila/10 rounded-2xl overflow-hidden mb-8 w-full">
        <div className="px-6 py-4 border-b border-lila/10">
          <h2 className="text-lila font-semibold text-lg tracking-wide">Tabla de medidas (cm)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-lila/10">
                {["Talla", "Pecho", "Cintura", "Cadera", "Equivalencia EU"].map((h) => (
                  <th key={h} className="text-left px-6 py-4 text-lila-mid font-semibold tracking-wider text-xs uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tallas.map((t) => (
                <tr key={t.talla} className="border-b border-lila/5 hover:bg-lila/5 transition-colors">
                  <td className="px-6 py-4 font-black text-lila text-lg">{t.talla}</td>
                  <td className="px-6 py-4 text-lila-soft text-sm">{t.pecho}</td>
                  <td className="px-6 py-4 text-lila-soft text-sm">{t.cintura}</td>
                  <td className="px-6 py-4 text-lila-soft text-sm">{t.cadera}</td>
                  <td className="px-6 py-4 text-lila-soft text-sm">{t.equivalencia}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-lila/5 border border-lila/20 rounded-2xl px-6 py-5 flex items-start gap-4">
        <i className="bi bi-info-circle text-lila text-xl mt-0.5" />
        <p className="text-sm text-lila-soft leading-relaxed">
          Si estás entre dos tallas, te recomendamos elegir la más grande para mayor comodidad.
          ¿Tienes dudas? Escríbenos a <span className="text-lila">hola@softaura.bliss</span>.
        </p>
      </div>

    </LayoutSeccionTienda>
  );
}