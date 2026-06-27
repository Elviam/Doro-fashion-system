import { useState } from "react";
import LayoutSeccionTienda from "../../components/tienda/LayoutSeccionTienda";

const preguntas = [
  {
    q: "¿Qué hace a AURA diferente de otras tiendas de ropa?",
    a: "AURA no produce en masa. Cada colección es una edición limitada diseñada desde CDMX con materiales cuidadosamente seleccionados. No encontrarás nuestras piezas en ningún otro lugar: cada prenda es una declaración de identidad."
  },
  {
    q: "¿Cómo rastreo mi pedido?",
    a: "Al confirmar tu compra recibirás un correo con tu número de guía y el enlace de seguimiento de la paquetería asignada. También puedes escribirnos a hola@softaura.bliss y con gusto te ayudamos a localizarlo."
  },
  {
    q: "¿Aceptan tarjetas internacionales?",
    a: "Sí. Aceptamos Visa, Mastercard y American Express de cualquier país. Los cargos se procesan en MXN y tu banco aplicará el tipo de cambio del día. También ofrecemos pago a meses sin intereses con tarjetas participantes."
  },
  {
    q: "¿Puedo modificar o cancelar mi pedido?",
    a: "Puedes cancelarlo dentro de las primeras 2 horas después de la compra escribiéndonos a hola@softaura.bliss. Una vez que el pedido entra al proceso de empaque o envío, ya no es posible modificarlo."
  },
  {
    q: "¿Tienen tienda física?",
    a: "Por ahora somos 100% digitales. Esto nos permite ofrecerte precios más accesibles y colecciones en edición limitada que solo encontrarás aquí. Cada compra incluye empaque cuidado y envío a domicilio."
  },
  {
    q: "¿Las prendas tienen garantía?",
    a: "Sí. Garantizamos la calidad de todos nuestros productos. Si alguna prenda presenta defectos de fabricación, la reponemos sin costo adicional dentro de los primeros 60 días desde la fecha de compra."
  },
  {
    q: "¿Los colores de las fotos son exactos?",
    a: "Trabajamos con fotografía profesional para que las imágenes sean lo más fieles posible al producto real. Sin embargo, los colores pueden variar ligeramente dependiendo de la calibración de la pantalla de tu dispositivo."
  },
  
];

export default function FAQ() {
  const [abierta, setAbierta] = useState(null);

  return (
    <LayoutSeccionTienda>

      {/* Hero */}
      <div className="mb-12 md:mb-16">
        <p className="text-xs md:text-sm tracking-[4px] text-lila-mid uppercase font-bold mb-3">
          Respuestas rápidas
        </p>
        <h1
          className="text-3xl sm:text-4xl md:text-5xl text-lila mb-5 leading-tight"
          style={{ fontFamily: "'Cinzel Decorative', serif" }}
        >
          Preguntas Frecuentes
        </h1>
        <p className="text-sm md:text-base text-lila-soft max-w-2xl leading-relaxed">
          Todo lo que necesitas saber antes de hacer tu compra. Si no encuentras tu respuesta,
          escríbenos a <span className="text-lila">hola@softaura.bliss</span> y te respondemos en menos de 24 horas.
        </p>
      </div>

      {/* Acordeón */}
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-3 px-0">
        {preguntas.map((item, i) => (
          <div
            key={i}
            className="bg-oscuro-card border border-lila/10 rounded-2xl overflow-hidden w-full"
          >
            <button
              onClick={() => setAbierta(abierta === i ? null : i)}
              className="w-full flex items-center justify-between px-6 md:px-8 py-5 md:py-6 text-left group gap-4"
            >
              <span
                className={`text-sm md:text-base font-semibold transition-colors leading-snug ${
                  abierta === i ? "text-lila" : "text-blanco group-hover:text-lila"
                }`}
              >
                {item.q}
              </span>
              <i
                className={`bi bi-chevron-down text-lila-mid text-lg flex-shrink-0 transition-transform duration-300 ${
                  abierta === i ? "rotate-180" : ""
                }`}
              />
            </button>

            {abierta === i && (
              <div className="px-6 md:px-8 pb-6 border-t border-lila/10 pt-5">
                <p className="text-sm md:text-base text-lila-soft leading-relaxed">
                  {item.a}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CTA inferior */}
      <div className="mt-12 md:mt-16 w-full max-w-4xl mx-auto bg-lila/5 border border-lila/20 rounded-2xl px-6 md:px-10 py-8 flex flex-col sm:flex-row items-center gap-5 sm:gap-8">
        <div className="w-14 h-14 rounded-full bg-lila/10 flex items-center justify-center flex-shrink-0">
          <i className="bi bi-chat-heart text-2xl text-lila" />
        </div>
        <div className="text-center sm:text-left">
          <p className="text-blanco font-semibold text-base mb-1">¿No encontraste tu respuesta?</p>
          <p className="text-lila-soft text-sm">
            Escríbenos directamente y te ayudamos con lo que necesites.
          </p>
        </div>
        <a
        href="/tienda/contacto"
        className="flex-shrink-0 px-7 py-3 bg-lila text-oscuro font-bold rounded-xl hover:bg-lila-soft transition text-sm tracking-wide"
        >
        Ir a Contacto
        </a>
      </div>

    </LayoutSeccionTienda>
  );
}