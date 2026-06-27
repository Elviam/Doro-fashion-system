import LayoutSeccionTienda from "../../components/tienda/LayoutSeccionTienda";

const zonas = [
  { zona: "CDMX y Área Metropolitana", tiempo: "1–2 días hábiles", costo: "$59 MXN",      gratis: "desde $800"   },
  { zona: "Norte del país",             tiempo: "3–4 días hábiles", costo: "$99 MXN",      gratis: "desde $1,200" },
  { zona: "Sur y Sureste",              tiempo: "4–5 días hábiles", costo: "$99 MXN",      gratis: "desde $1,200" },
  { zona: "Internacional",              tiempo: "7–15 días hábiles", costo: "Desde $250 MXN", gratis: "—"         },
];

export default function Envios() {
  return (
    <LayoutSeccionTienda>

      <div className="mb-12 md:mb-16">
        <h1 className="text-3xl sm:text-4xl md:text-5xl text-lila mb-5 leading-tight"
          style={{ fontFamily: "'Cinzel Decorative', serif" }}>
          Envíos
        </h1>
        <p className="text-sm md:text-base text-lila-soft max-w-2xl leading-relaxed">
          Llevamos tus piezas favoritas hasta tu puerta con cuidado y rapidez. Aquí encontrarás
          todo sobre nuestros tiempos, costos y políticas.
        </p>
      </div>

      {/* Tabla */}
      <div className="bg-oscuro-card border border-lila/10 rounded-2xl overflow-hidden mb-10 w-full">
        <div className="px-6 py-4 border-b border-lila/10">
          <h2 className="text-lila font-semibold text-lg tracking-wide">Tiempos y costos por zona</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-lila/10">
                {["Zona", "Tiempo estimado", "Costo", "Envío gratis"].map((h) => (
                  <th key={h} className="text-left px-6 py-4 text-lila-mid font-semibold tracking-wider text-xs uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {zonas.map((z, i) => (
                <tr key={i} className="border-b border-lila/5 hover:bg-lila/5 transition-colors">
                  <td className="px-6 py-4 text-blanco font-medium text-sm">{z.zona}</td>
                  <td className="px-6 py-4 text-lila-soft text-sm">{z.tiempo}</td>
                  <td className="px-6 py-4 text-lila-soft text-sm">{z.costo}</td>
                  <td className="px-6 py-4 text-verde font-semibold text-sm">{z.gratis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: "bi-box-seam",    titulo: "Embalaje cuidadoso",   texto: "Cada prenda se empaca con papel de seda y cinta sellada. Los pedidos especiales incluyen bolsa de tela reutilizable." },
          { icon: "bi-geo-alt",     titulo: "Rastreo en tiempo real", texto: "Recibirás un correo con tu número de guía al momento del envío. Puedes rastrear tu pedido directamente con la paquetería." },
          { icon: "bi-shield-check", titulo: "Envío asegurado",     texto: "Todos los paquetes viajan asegurados. En caso de pérdida o daño, gestionamos el reembolso sin costo para ti." },
        ].map((card) => (
          <div key={card.titulo} className="bg-oscuro-card border border-lila/10 rounded-2xl p-7">
            <div className="w-12 h-12 rounded-xl bg-lila/10 flex items-center justify-center mb-4">
              <i className={`bi ${card.icon} text-2xl text-lila`} />
            </div>
            <h3 className="text-blanco font-semibold text-base mb-3">{card.titulo}</h3>
            <p className="text-sm text-lila-soft leading-relaxed">{card.texto}</p>
          </div>
        ))}
      </div>

    </LayoutSeccionTienda>
  );
}