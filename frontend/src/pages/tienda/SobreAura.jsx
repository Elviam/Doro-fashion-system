import LayoutSeccionTienda from "../../components/tienda/LayoutSeccionTienda";

const valores = [
  { icon: "bi-gem",            titulo: "Calidad artesanal", texto: "Cada prenda pasa por un proceso riguroso de selección de materiales y control de calidad antes de llegar a tus manos." },
  { icon: "bi-stars",          titulo: "Edición limitada",  texto: "Nunca producimos en masa. Cada colección tiene piezas contadas para que tu estilo sea verdaderamente único." },
  { icon: "bi-heart-pulse",    titulo: "Comunidad primero", texto: "AURA nació de y para la comunidad. Escuchamos activamente a nuestros clientes para crear lo que realmente quieren usar." },
  { icon: "bi-globe-americas", titulo: "Visión latina",     texto: "Nuestro diseño está enraizado en la cultura urbana latinoamericana, mezclando tradición y modernidad en cada colección." },
];

export default function SobreAura() {
  return (
    <LayoutSeccionTienda>

      {/* Hero de marca */}
      <div className="mb-16 flex flex-col items-center text-center">
        <h1
          className="text-6xl md:text-8xl text-lila tracking-tight leading-none drop-shadow-[0_0_40px_rgba(231,214,255,0.2)]"
          style={{ fontFamily: "'Cinzel Decorative', serif" }}
        >
          AURA
        </h1>
        <div className="w-24 h-px bg-gradient-to-r from-transparent via-lila/50 to-transparent my-6" />
        <p className="text-base md:text-lg text-lila-soft max-w-2xl leading-relaxed">
          Somos una boutique digital de moda urbana fundada en Ciudad de México con alma
          latinoamericana. Cada colección es un acto de identidad: piezas pensadas para
          quienes saben lo que quieren.
        </p>
      </div>

      {/* Historia */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
        <div className="bg-oscuro-card border border-lila/10 rounded-2xl p-8">
          <p className="text-sm tracking-[4px] text-lila-mid uppercase font-bold mb-3">Nuestra historia</p>
          <h2 className="text-2xl text-blanco font-semibold mb-5" style={{ fontFamily: "'Baskervville', serif" }}>
            Nació de la necesidad de vestirse con intención
          </h2>
          <p className="text-sm text-lila-soft leading-relaxed mb-4">
            AURA comenzó en 2022 como un proyecto personal: encontrar ropa que fuera bonita,
            accesible y con carácter sin tener que sacrificar ninguna de las tres cosas.
          </p>
          <p className="text-sm text-lila-soft leading-relaxed">
            Hoy somos un equipo pequeño con grandes ideas, diseñando desde CDMX para toda
            Latinoamérica. Cada colección lleva semanas de trabajo, inspiración y amor por el detalle.
          </p>
        </div>
        <div className="bg-gradient-to-br from-lila/10 to-oscuro-card border border-lila/20 rounded-2xl p-8 flex flex-col justify-center">
          <div className="grid grid-cols-2 gap-8">
           {[
            { num: "2022",  label: "Año de fundación",     color: "text-lila"     },
            { num: "+500",  label: "Clientes felices",      color: "text-verde"    },
            { num: "4",     label: "Colecciones lanzadas",  color: "text-rosa"     },
            { num: "100%",  label: "Digital y orgullosos",  color: "text-amarillo" },
            ].map((s) => (
            <div key={s.label} className="text-center">
                <p className={`text-4xl font-black ${s.color} mb-2`} style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                {s.num}
                </p>
                <p className="text-sm text-lila-soft tracking-wide">{s.label}</p>
            </div>
            ))}
          </div>
        </div>
      </div>

      {/* Valores */}
      <p className="text-sm tracking-[4px] text-lila-mid uppercase font-bold mb-6">Lo que nos mueve</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {valores.map((v) => (
          <div key={v.titulo} className="bg-oscuro-card border border-lila/10 rounded-2xl p-7">
            <div className="w-12 h-12 rounded-xl bg-lila/10 flex items-center justify-center mb-4">
              <i className={`bi ${v.icon} text-2xl text-lila`} />
            </div>
            <h3 className="text-blanco font-semibold text-base mb-3">{v.titulo}</h3>
            <p className="text-sm text-lila-soft leading-relaxed">{v.texto}</p>
          </div>
        ))}
      </div>

    </LayoutSeccionTienda>
  );
}