import LayoutSeccionTienda from "../../components/tienda/LayoutSeccionTienda";

const valores = [
  { icon: "bi-gem",            titulo: "Calidad artesanal", texto: "Cada prenda pasa por un proceso riguroso de selección de materiales y control de calidad antes de llegar a tus manos." },
  { icon: "bi-stars",          titulo: "Edición limitada",  texto: "Nunca producimos en masa. Cada colección tiene piezas contadas para que tu estilo sea verdaderamente único." },
  { icon: "bi-heart-pulse",    titulo: "Comunidad primero", texto: "D'oro nació de y para la comunidad. Escuchamos activamente a nuestros clientes para crear lo que realmente quieren usar." },
  { icon: "bi-globe-americas", titulo: "Visión latina",     texto: "Nuestro diseño está enraizado en la cultura urbana latinoamericana, mezclando tradición y modernidad en cada colección." },
];

export default function SobreDoro() {
  return (
    <LayoutSeccionTienda>

      {/* Hero de marca */}
      <div className="mb-16 flex flex-col items-center text-center">
        <h1
          className="font-display text-6xl md:text-8xl text-[var(--gold-dark)] dark:text-[var(--gold-light)] tracking-tight leading-none drop-shadow-[0_0_40px_rgba(231,214,255,0.2)]"
        >
          D'ORO
        </h1>
        <div className="w-24 h-px bg-gradient-to-r from-transparent via-[var(--gold)]/50 to-transparent my-6" />
        <p className="font-body text-base lg:text-lg text-[var(--noir-soft)] dark:text-[var(--ash)] max-w-2xl leading-relaxed">
          Somos una boutique digital de moda urbana fundada en Milán con alma
          latinoamericana. Cada colección es un acto de identidad: piezas pensadas para
          quienes saben lo que quieren.
        </p>
      </div>

      {/* Historia */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
        <div className="bg-[var(--snow)] dark:bg-[var(--noir-soft)] border border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] rounded-[2px] p-8">
          <p className="font-tag text-xs lg:text-sm tracking-[4px] text-[var(--gold-dark)] dark:text-[var(--gold-light)] uppercase font-bold mb-3">Nuestra historia</p>
          <h2 className="font-display text-xl lg:text-2xl text-[var(--noir)] dark:text-[var(--snow)] font-semibold mb-5">
            Nació de la necesidad de vestirse con intención
          </h2>
          <p className="font-body text-sm text-[var(--noir-soft)] dark:text-[var(--ash)] leading-relaxed mb-4">
            D'oro comenzó en 2022 como un proyecto personal: encontrar ropa que fuera bonita,
            accesible y con carácter sin tener que sacrificar ninguna de las tres cosas.
          </p>
          <p className="font-body text-sm text-[var(--noir-soft)] dark:text-[var(--ash)] leading-relaxed">
            Hoy somos un equipo pequeño con grandes ideas, diseñando desde CDMX para toda
            Latinoamérica. Cada colección lleva semanas de trabajo, inspiración y amor por el detalle.
          </p>
        </div>
        <div className="bg-gradient-to-br from-[var(--gold)]/10 to-[var(--snow)] dark:to-[var(--noir-soft)] border border-[var(--border-gold-55)] rounded-[2px] p-8 flex flex-col justify-center">
          <div className="grid grid-cols-2 gap-8">
           {[
            { num: "2022",  label: "Año de fundación",     color: "text-[var(--gold-dark)] dark:text-[var(--gold-light)]" },
            { num: "+500",  label: "Clientes felices",      color: "text-green-700 dark:text-verde"    },
            { num: "4",     label: "Colecciones lanzadas",  color: "text-rosa"     },
            { num: "100%",  label: "Digital y orgullosos",  color: "text-amber-700 dark:text-amarillo" },
            ].map((s) => (
            <div key={s.label} className="text-center">
                <p className={`font-display text-3xl lg:text-4xl font-black ${s.color} mb-2`}>
                {s.num}
                </p>
                <p className="font-body text-sm text-[var(--noir-soft)] dark:text-[var(--ash)] tracking-wide">{s.label}</p>
            </div>
            ))}
          </div>
        </div>
      </div>

      {/* Valores */}
      <p className="font-tag text-xs lg:text-sm tracking-[4px] text-[var(--gold-dark)] dark:text-[var(--gold-light)] uppercase font-bold mb-6">Lo que nos mueve</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {valores.map((v) => (
          <div key={v.titulo} className="bg-[var(--snow)] dark:bg-[var(--noir-soft)] border border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] rounded-[2px] p-7">
            <div className="w-12 h-12 rounded-[2px] bg-[var(--gold-08)] flex items-center justify-center mb-4">
              <i className={`bi ${v.icon} text-2xl text-[var(--gold-dark)] dark:text-[var(--gold-light)]`} />
            </div>
            <h3 className="font-body text-[var(--noir)] dark:text-[var(--snow)] font-semibold text-sm lg:text-base mb-3">{v.titulo}</h3>
            <p className="font-body text-sm text-[var(--noir-soft)] dark:text-[var(--ash)] leading-relaxed">{v.texto}</p>
          </div>
        ))}
      </div>

    </LayoutSeccionTienda>
  );
}