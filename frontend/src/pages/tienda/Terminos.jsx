// src/pages/tienda/Terminos.jsx
import LayoutSeccionTienda from "../../components/tienda/LayoutSeccionTienda";

const secciones = [
  {
    num: "01",
    titulo: "Uso del sitio",
    icono: "bi-globe",
    texto:
      "Al acceder a doro.com aceptas estos términos de uso. El sitio está destinado exclusivamente a uso personal y no comercial. Queda estrictamente prohibida la reproducción, distribución o modificación de cualquier contenido —incluyendo diseños, textos e imágenes— sin autorización escrita de D'oro Boutique.",
  },
  {
    num: "02",
    titulo: "Productos y precios",
    icono: "bi-tag",
    texto:
      "Todos los precios están expresados en pesos mexicanos (MXN) e incluyen IVA. D'oro opera con un modelo de edición limitada: los productos pueden agotarse sin previo aviso. Nos reservamos el derecho de modificar precios en cualquier momento. Las promociones tienen vigencia y condiciones específicas que se indicarán en cada caso.",
  },
  {
    num: "03",
    titulo: "Proceso de compra e inventario",
    icono: "bi-bag-check",
    texto:
      "Al confirmar un pedido aceptas el precio, descripción y condiciones de compra vigentes en ese momento. Nuestro sistema de inventario digital refleja disponibilidad en tiempo real. Si por alguna razón tu pedido no puede procesarse (falta de stock o error en el precio), te contactaremos de inmediato para ofrecerte una solución.",
  },
  {
    num: "04",
    titulo: "Manufactura y calidad",
    icono: "bi-stars",
    texto:
      "D'oro garantiza que cada prenda pasa por un proceso de control de calidad antes de ser enviada. Trabajamos con materiales seleccionados y procesos de manufactura ética. Si tu prenda presenta defectos de fabricación, la reponemos sin costo dentro de los primeros 60 días desde la compra.",
  },
  {
    num: "05",
    titulo: "Propiedad intelectual",
    icono: "bi-shield-lock",
    texto:
      "Los diseños, logotipos, fotografías, textos y colecciones de D'oro son propiedad exclusiva de la marca y están protegidos por la legislación mexicana e internacional de propiedad intelectual. No está permitida su reproducción total o parcial sin autorización expresa y por escrito.",
  },
  {
    num: "06",
    titulo: "Privacidad y datos",
    icono: "bi-person-lock",
    texto:
      "Tus datos personales son tratados con estricta confidencialidad conforme a nuestra Política de Privacidad y la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP). No compartimos tu información con terceros salvo lo estrictamente necesario para procesar pagos y coordinar envíos.",
  },
  {
    num: "07",
    titulo: "Envíos y responsabilidad",
    icono: "bi-box-seam",
    texto:
      "D'oro no se hace responsable por demoras causadas por la paquetería, fenómenos meteorológicos, caso fortuito o fuerza mayor. En cualquiera de estos escenarios, nuestro equipo trabajará contigo para encontrar la mejor solución posible, incluyendo reenvío o reembolso según corresponda.",
  },
  {
    num: "08",
    titulo: "Modificaciones a estos términos",
    icono: "bi-arrow-repeat",
    texto:
      "Estos términos pueden actualizarse en cualquier momento para reflejar cambios en nuestras operaciones o en la legislación aplicable. La versión vigente siempre estará disponible en esta página con la fecha de última actualización. El uso continuo del sitio después de cualquier modificación implica la aceptación de los nuevos términos.",
  },
];

export default function Terminos() {
  return (
    <LayoutSeccionTienda>

      {/* Hero */}
      <div className="mb-12 md:mb-16">
        <p className="font-tag text-xs lg:text-sm tracking-[4px] text-[var(--gold-dark)] dark:text-[var(--gold-light)] uppercase font-bold mb-3">
          Legal
        </p>
        <h1
          className="font-display text-3xl sm:text-4xl md:text-5xl text-[var(--gold-dark)] dark:text-[var(--gold-light)] mb-5 leading-tight"
        >
          Términos y Condiciones
        </h1>
        <p className="font-body text-sm lg:text-base text-[var(--noir-soft)] dark:text-[var(--ash)] max-w-2xl leading-relaxed">
        Redactamos esta sección de forma clara y sencilla para que conozcas
        cómo funciona D'oro y las condiciones de compra dentro de la tienda.
        </p>
      </div>

      {/* Secciones */}
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-4 px-0">
        {secciones.map((s) => (
          <div
            key={s.num}
            className="bg-[var(--snow)] dark:bg-[var(--noir-soft)] border border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] rounded-[2px] p-6 md:p-8 w-full relative overflow-hidden"
          >
            {/* Número decorativo de fondo */}
            <span className="absolute top-4 right-6 text-7xl font-black text-[var(--gold)]/5 select-none leading-none pointer-events-none">
              {s.num}
            </span>

            {/* Encabezado */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-11 h-11 rounded-[2px] bg-[var(--gold-08)] flex items-center justify-center flex-shrink-0">
                <i className={`bi ${s.icono} text-xl text-[var(--gold-dark)] dark:text-[var(--gold-light)]`} />
              </div>
              <h2 className="font-body text-[var(--noir)] dark:text-[var(--snow)] font-semibold text-sm lg:text-base leading-snug">
                {s.titulo}
              </h2>
            </div>

            {/* Texto */}
            <p className="font-body text-sm lg:text-base text-[var(--noir-soft)] dark:text-[var(--ash)] leading-relaxed pl-0 md:pl-[60px]">
              {s.texto}
            </p>
          </div>
        ))}
      </div>

      {/* Nota legal inferior */}
      <div className="mt-12 md:mt-16 w-full max-w-4xl mx-auto bg-[var(--gold-08)] border border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] rounded-[2px] px-6 md:px-10 py-8 flex flex-col sm:flex-row items-center gap-5 sm:gap-8">
        <div className="w-14 h-14 rounded-full bg-[var(--gold-08)] flex items-center justify-center flex-shrink-0">
          <i className="bi bi-info-circle text-2xl text-[var(--gold-dark)] dark:text-[var(--gold-light)]" />
        </div>
        <div className="text-center sm:text-left">
          <p className="font-body text-[var(--noir)] dark:text-[var(--snow)] font-semibold text-sm lg:text-base mb-1">¿Tienes dudas sobre algún punto?</p>
          <p className="font-body text-[var(--noir-soft)] dark:text-[var(--ash)] text-sm">
            Escríbenos a{" "}
            <span className="text-[var(--gold-dark)] dark:text-[var(--gold-light)]">support@doro.com</span>
            {" "}y nuestro equipo te responde en menos de 24 horas.
          </p>
        </div>
        <a
          href="/tienda/contacto"
          className="flex-shrink-0 px-7 py-3 bg-[var(--gold)] text-[var(--noir)] font-bold rounded-[2px] hover:bg-[var(--gold-light)] transition text-sm tracking-wide"
         >
          Contactarnos
        </a>
      </div>

    </LayoutSeccionTienda>
  );
}