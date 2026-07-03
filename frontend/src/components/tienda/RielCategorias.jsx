export const categorias = [
  { id: "todas",      label: "Todas",      icono: "bi-grid-3x3-gap"    },
  { id: "Playeras",   label: "Playeras",   icono: "bi-bag-heart"       },
  { id: "Blusas",     label: "Blusas",     icono: "bi-flower1"         },
  { id: "Camisas",    label: "Camisas",    icono: "bi-person-badge"    },
  { id: "Suéteres",   label: "Suéteres",   icono: "bi-cloud-drizzle"   },
  { id: "Sudaderas",  label: "Sudaderas",  icono: "bi-cloud-snow"      },
  { id: "Chamarras",  label: "Chamarras",  icono: "bi-fire"            },
  { id: "Abrigos",    label: "Abrigos",    icono: "bi-umbrella"        },
  { id: "Vestidos",   label: "Vestidos",   icono: "bi-flower2"         },
  { id: "Faldas",     label: "Faldas",     icono: "bi-stars"           },
  { id: "Shorts",     label: "Shorts",     icono: "bi-scissors"        },
  { id: "Pantalones", label: "Pantalones", icono: "bi-rulers"          },
  { id: "Calzado",    label: "Calzado",    icono: "bi-geo-alt"         },
  { id: "Accesorios", label: "Accesorios", icono: "bi-gem"             },
];

export default function RielCategorias({ categoriaActiva, onSeleccionarCategoria }) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-14 gap-3 mb-8">
      {categorias.map((cat) => {
        const activa = categoriaActiva === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSeleccionarCategoria(cat.id)}
            className={`flex flex-col items-center gap-2 p-3 rounded-[2px] border transition-all ${
              activa
                ? "bg-[var(--gold-08)] border-[var(--border-gold-40)]"
                : "border-transparent hover:bg-[var(--gold-08)] hover:border-[var(--border-gold-20)]"
            }`}
          >
            {/* Círculo con ícono */}
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                activa
                  ? "bg-[var(--gold-08)] border-[var(--gold)]"
                  : "bg-[var(--noir-soft)] border-[var(--border-gold-20)]"
              }`}
            >
              <i className={`bi ${cat.icono} text-xl lg:text-2xl ${activa ? "text-[var(--gold-light)]" : "text-[var(--ash)]"}`} />
            </div>

            {/* Nombre */}
            <span
              className={`font-tag text-xs lg:text-sm font-semibold text-center leading-tight uppercase tracking-wide ${
                activa ? "text-[var(--snow)]" : "text-[var(--ash)]"
              }`}
            >
              {cat.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}