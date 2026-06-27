import LayoutSeccionTienda from "../../components/tienda/LayoutSeccionTienda";

const compromisos = [
  { icon: "bi-recycle",       porcentaje: "75%",  label: "Reducción de desperdicios en manufactura" },
  { icon: "bi-wind",          porcentaje: "2027", label: "Meta de carbono-neutralidad" },
  { icon: "bi-bag-heart",     porcentaje: "100%", label: "Empaques reutilizables o biodegradables" },
  { icon: "bi-people",        porcentaje: "+30",  label: "Artesanos locales con trabajo digno" },
];

export default function Sustentabilidad() {
  return (
    <LayoutSeccionTienda>

      <div className="mb-12 md:mb-16">
        <p className="text-sm tracking-[4px] text-lila-mid uppercase font-bold mb-3">Nuestro compromiso</p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl text-lila mb-5 leading-tight"
          style={{ fontFamily: "'Cinzel Decorative', serif" }}>
          Sustentabilidad
        </h1>
        <p className="text-sm md:text-base text-lila-soft max-w-2xl leading-relaxed">
          La moda puede ser bonita y responsable al mismo tiempo. Aquí te contamos cómo
          trabajamos cada día para que así sea.
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {compromisos.map((c) => (
          <div key={c.label} className="bg-oscuro-card border border-verde/20 rounded-2xl p-7 text-center">
            <div className="w-12 h-12 rounded-full bg-verde/10 flex items-center justify-center mx-auto mb-3">
              <i className={`bi ${c.icon} text-2xl text-verde`} />
            </div>
            <p className="text-4xl font-black text-verde mb-2">{c.porcentaje}</p>
            <p className="text-sm text-lila-soft leading-snug">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Pilares */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: "bi-tree",           titulo: "Materiales conscientes", texto: "Trabajamos exclusivamente con proveedores certificados en prácticas eco-amigables. Priorizamos telas orgánicas, recicladas o de origen controlado." },
          { icon: "bi-box-seam",       titulo: "Empaques con propósito", texto: "Eliminamos el plástico de un solo uso. Cada pedido va en papel reciclado y bolsas de tela que puedes reutilizar en tu día a día." },
          { icon: "bi-hand-thumbs-up", titulo: "Comercio justo",         texto: "Pagamos salarios dignos a cada persona en nuestra cadena de producción. La moda que amas no debe costarle a nadie su bienestar." },
        ].map((p) => (
          <div key={p.titulo} className="bg-oscuro-card border border-lila/10 rounded-2xl p-7">
            <div className="w-12 h-12 rounded-xl bg-lila/10 flex items-center justify-center mb-4">
              <i className={`bi ${p.icon} text-2xl text-lila`} />
            </div>
            <h3 className="text-blanco font-semibold text-base mb-3">{p.titulo}</h3>
            <p className="text-sm text-lila-soft leading-relaxed">{p.texto}</p>
          </div>
        ))}
      </div>

    </LayoutSeccionTienda>
  );
}