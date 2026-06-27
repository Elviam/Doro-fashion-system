import LayoutSeccionTienda from "../../components/tienda/LayoutSeccionTienda";

const pasos = [
  { num: "01", titulo: "Solicita la devolución", texto: "Escríbenos a hola@softaura.bliss dentro de los primeros 30 días con tu número de pedido." },
  { num: "02", titulo: "Prepara tu paquete",     texto: "Las prendas deben estar sin usar, con etiquetas intactas y en su empaque original." },
  { num: "03", titulo: "Envía el paquete",       texto: "Te compartiremos la dirección de devolución. El costo de envío corre por cuenta del cliente." },
  { num: "04", titulo: "Recibe tu reembolso",    texto: "En 5–7 días hábiles tras recibir el paquete, procesamos el reembolso al método de pago original." },
];

export default function Devoluciones() {
  return (
    <LayoutSeccionTienda>

      <div className="mb-12 md:mb-16">
        <p className="text-sm tracking-[4px] text-lila-mid uppercase font-bold mb-3">Políticas</p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl text-lila mb-5 leading-tight"
          style={{ fontFamily: "'Cinzel Decorative', serif" }}>
          Devoluciones
        </h1>
        <p className="text-sm md:text-base text-lila-soft max-w-2xl leading-relaxed">
          Tu satisfacción es nuestra prioridad. Si algo no fue como esperabas, aquí te explicamos
          cómo funciona nuestro proceso.
        </p>
      </div>

      {/* Pasos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {pasos.map((p) => (
          <div key={p.num} className="bg-oscuro-card border border-lila/10 rounded-2xl p-7 relative overflow-hidden">
            <span className="absolute top-4 right-4 text-5xl font-black text-lila/5 select-none leading-none">
              {p.num}
            </span>
            <div className="w-10 h-10 rounded-full bg-lila/10 flex items-center justify-center mb-4">
              <span className="text-sm font-black text-lila">{p.num}</span>
            </div>
            <h3 className="text-blanco font-semibold text-base mb-3">{p.titulo}</h3>
            <p className="text-sm text-lila-soft leading-relaxed">{p.texto}</p>
          </div>
        ))}
      </div>

      {/* Condiciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-oscuro-card border border-verde/20 rounded-2xl p-7">
          <div className="flex items-center gap-3 mb-5">
            <i className="bi bi-check-circle-fill text-verde text-2xl" />
            <h3 className="text-blanco font-semibold text-lg">Aceptamos devolución si…</h3>
          </div>
          <ul className="space-y-3">
            {[
              "La prenda llegó dañada o defectuosa",
              "Recibiste una talla incorrecta",
              "El producto no coincide con la descripción",
              "Está dentro del plazo de 30 días",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-lila-soft">
                <i className="bi bi-check2 text-verde mt-0.5 text-lg" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-oscuro-card border border-rojo/20 rounded-2xl p-7">
          <div className="flex items-center gap-3 mb-5">
            <i className="bi bi-x-circle-fill text-rojo text-2xl" />
            <h3 className="text-blanco font-semibold text-lg">No aceptamos devolución si…</h3>
          </div>
          <ul className="space-y-3">
            {[
              "La prenda fue usada o lavada",
              "Faltan etiquetas o empaque original",
              "Pasaron más de 30 días desde la compra",
              "Es ropa interior o accesorios de uso personal",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-lila-soft">
                <i className="bi bi-x-lg text-rojo mt-0.5 text-lg" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

    </LayoutSeccionTienda>
  );
}