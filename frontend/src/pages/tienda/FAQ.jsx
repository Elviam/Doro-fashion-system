import { useState } from "react";
import LayoutSeccionTienda from "../../components/tienda/LayoutSeccionTienda";

const preguntas = [
  {
    q: "¿Qué hace a D'oro diferente de otras tiendas de ropa?",
    a: "D'oro no produce en masa. Cada colección es una edición limitada diseñada con materiales cuidadosamente seleccionados. No encontrarás nuestras piezas en ningún otro lugar: cada prenda es una declaración de identidad."
  },
  {
    q: "¿Cómo rastreo mi pedido?",
    a: "Al confirmar tu compra recibirás un correo con tu número de guía y el enlace de seguimiento de la paquetería asignada. También puedes escribirnos a support@doro.com y con gusto te ayudamos a localizarlo."
  },
  {
    q: "¿Aceptan tarjetas internacionales?",
    a: "Sí. Aceptamos Visa, Mastercard y American Express de cualquier país. Los cargos se procesan en MXN y tu banco aplicará el tipo de cambio del día. También ofrecemos pago a meses sin intereses con tarjetas participantes."
  },
  {
    q: "¿Puedo modificar o cancelar mi pedido?",
    a: "Puedes cancelarlo dentro de las primeras 2 horas después de la compra escribiéndonos a support@doro.com. Una vez que el pedido entra al proceso de empaque o envío, ya no es posible modificarlo."
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
        <p className="font-tag text-xs lg:text-sm tracking-[4px] text-[var(--gold-dark)] dark:text-[var(--gold-light)] uppercase font-bold mb-3">
          Respuestas rápidas
        </p>
        <h1
          className="font-display text-3xl sm:text-4xl md:text-5xl text-[var(--gold-dark)] dark:text-[var(--gold-light)] mb-5 leading-tight"
        >
          Preguntas Frecuentes
        </h1>
        <p className="font-body text-sm lg:text-base text-[var(--noir-soft)] dark:text-[var(--ash)] max-w-2xl leading-relaxed">
          Todo lo que necesitas saber antes de hacer tu compra. Si no encuentras tu respuesta,
          escríbenos a <span className="text-[var(--gold-dark)] dark:text-[var(--gold-light)]">support@doro.com</span> y te respondemos en menos de 24 horas.
        </p>
      </div>

      {/* Acordeón */}
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-3 px-0">
        {preguntas.map((item, i) => (
          <div
            key={i}
            className="bg-[var(--snow)] dark:bg-[var(--noir-soft)] border border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] rounded-[2px] overflow-hidden w-full"
          >
            <button
              onClick={() => setAbierta(abierta === i ? null : i)}
              className="w-full flex items-center justify-between px-6 md:px-8 py-5 md:py-6 text-left group gap-4"
            >
              <span
                className={`font-body text-sm lg:text-base font-semibold transition-colors leading-snug ${
                  abierta === i ? "text-[var(--gold-dark)] dark:text-[var(--gold-light)]" : "text-[var(--noir)] dark:text-[var(--snow)] group-hover:text-[var(--gold-dark)] dark:group-hover:text-[var(--gold-light)]"
                }`}
              >
                {item.q}
              </span>
              <i
                className={`bi bi-chevron-down text-[var(--gold-dark)] dark:text-[var(--gold-light)] text-lg flex-shrink-0 transition-transform duration-300 ${
                  abierta === i ? "rotate-180" : ""
                }`}
              />
            </button>

            {abierta === i && (
              <div className="px-6 md:px-8 pb-6 border-t border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] pt-5">
                <p className="font-body text-sm lg:text-base text-[var(--noir-soft)] dark:text-[var(--ash)] leading-relaxed">
                  {item.a}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CTA inferior */}
      <div className="mt-12 md:mt-16 w-full max-w-4xl mx-auto bg-[var(--gold-08)] border border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] rounded-[2px] px-6 md:px-10 py-8 flex flex-col sm:flex-row items-center gap-5 sm:gap-8">
        <div className="w-14 h-14 rounded-full bg-[var(--gold-08)] flex items-center justify-center flex-shrink-0">
          <i className="bi bi-chat-heart text-2xl text-[var(--gold-dark)] dark:text-[var(--gold-light)]" />
        </div>
        <div className="text-center sm:text-left">
          <p className="font-body text-[var(--noir)] dark:text-[var(--snow)] font-semibold text-sm lg:text-base mb-1">¿No encontraste tu respuesta?</p>
          <p className="font-body text-[var(--noir-soft)] dark:text-[var(--ash)] text-sm">
            Escríbenos directamente y te ayudamos con lo que necesites.
          </p>
        </div>
        <a
        href="/tienda/contacto"
        className="flex-shrink-0 px-7 py-3 bg-[var(--gold)] text-[var(--noir)] font-bold rounded-[2px] hover:bg-[var(--gold-light)] transition text-sm tracking-wide"
        >
        Ir a Contacto
        </a>
      </div>

    </LayoutSeccionTienda>
  );
}