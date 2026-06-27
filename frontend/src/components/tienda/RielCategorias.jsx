const categorias = [
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
            className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
              activa
                ? "bg-lila/10 border-lila/40"
                : "border-transparent hover:bg-lila/5 hover:border-lila/20"
            }`}
          >
            {/* Círculo con ícono */}
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                activa
                  ? "bg-lila/20 border-lila/50"
                  : "bg-bg-card border-lila/15"
              }`}
            >
              <i className={`bi ${cat.icono} text-xl ${activa ? "text-lila" : "text-lila-soft"}`} />
            </div>

            {/* Nombre */}
            <span
              className={`text-xs font-semibold text-center leading-tight ${
                activa ? "text-blanco" : "text-lila-soft"
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
