import LayoutSeccionTienda from "../../components/tienda/LayoutSeccionTienda";

const zonas = [
  { zona: "CDMX y Área Metropolitana", tiempo: "1–2 días hábiles", costo: "$99 MXN", gratis: "desde $799" },
  { zona: "Norte del país",             tiempo: "3–4 días hábiles", costo: "$99 MXN", gratis: "desde $799" },
  { zona: "Sur y Sureste",              tiempo: "4–5 días hábiles", costo: "$99 MXN", gratis: "desde $799" },
];

export default function Envios() {
  return (
    <LayoutSeccionTienda>

      <div className="mb-12 md:mb-16">
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-[var(--gold-dark)] dark:text-[var(--gold-light)] mb-5 leading-tight">
          Envíos
        </h1>
        <p className="font-body text-sm lg:text-base text-[var(--noir-soft)] dark:text-[var(--ash)] max-w-2xl leading-relaxed">
          Llevamos tus piezas favoritas hasta tu puerta con cuidado y rapidez. Aquí encontrarás
          todo sobre nuestros tiempos, costos y políticas.
        </p>
      </div>

      {/* Tabla */}
      <div className="bg-[var(--snow)] dark:bg-[var(--noir-soft)] border border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] rounded-[2px] overflow-hidden mb-10 w-full">
        <div className="px-6 py-4 border-b border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)]">
          <h2 className="font-body text-[var(--gold-dark)] dark:text-[var(--gold-light)] font-semibold text-base lg:text-lg tracking-wide">Tiempos y costos por zona</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)]">
                {["Zona", "Tiempo estimado", "Costo", "Envío gratis"].map((h) => (
                  <th key={h} className="font-tag text-left px-6 py-4 text-[var(--gold-dark)] dark:text-[var(--gold-light)] font-semibold tracking-wider text-xs uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {zonas.map((z, i) => (
                <tr key={i} className="border-b border-[var(--border-gold-25)] hover:bg-[var(--gold-08)] transition-colors">
                  <td className="px-6 py-4 text-[var(--noir)] dark:text-[var(--snow)] font-medium text-sm">{z.zona}</td>
                  <td className="px-6 py-4 text-[var(--noir-soft)] dark:text-[var(--ash)] text-sm">{z.tiempo}</td>
                  <td className="px-6 py-4 text-[var(--noir-soft)] dark:text-[var(--ash)] text-sm">{z.costo}</td>
                  <td className="px-6 py-4 text-green-700 dark:text-verde font-semibold text-sm">{z.gratis}</td>
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
          <div key={card.titulo} className="bg-[var(--snow)] dark:bg-[var(--noir-soft)] border border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] rounded-[2px] p-7">
            <div className="w-12 h-12 rounded-[2px] bg-[var(--gold-08)] flex items-center justify-center mb-4">
              <i className={`bi ${card.icon} text-2xl text-[var(--gold-dark)] dark:text-[var(--gold-light)]`} />
            </div>
            <h3 className="font-body text-[var(--noir)] dark:text-[var(--snow)] font-semibold text-sm lg:text-base mb-3">{card.titulo}</h3>
            <p className="font-body text-sm text-[var(--noir-soft)] dark:text-[var(--ash)] leading-relaxed">{card.texto}</p>
          </div>
        ))}
      </div>

    </LayoutSeccionTienda>
  );
}
