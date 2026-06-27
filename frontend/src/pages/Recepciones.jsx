import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";
import { X, Calendar, User, Package } from "lucide-react";

import useTitulo from "../hooks/useTitulo";

import Encabezado from "../components/Encabezado";
import Tarjetas      from "../components/Tarjetas";
import ToolBar       from "../components/ToolBar";
import Tabla         from "../components/Tabla";
import AccionesTabla from "../components/AccionesTabla";
import Etiquetas     from "../components/Etiquetas";
import Paginacion    from "../components/Paginacion";
import ModalConfirmacion from "../components/ModalConfirmacion";
import ModalRecepciones from "../components/ModalRecepciones";
import FormRecepciones from "../components/FormRecepciones";

const LIMIT = 10;

const ENCABEZADOS = ["Folio", "Proveedor", "Fecha", "Usuario", "Items", "Total", "Estado", "Acciones"];

const OPCIONES_FILTRO = [
  { value: "",          label: "Todos"       },
  { value: "CONFIRMED", label: "Confirmadas" },
  { value: "DRAFT",     label: "Draft"       },
];

function formatMoney(n) {
  return `$${Number(n).toLocaleString("es-MX")}`;
}

function formatDate(iso) {
  if (!iso) return "—";
  if (iso.includes("-")) {
    const [year, month, day] = iso.split("T")[0].split("-");
    return `${day}/${month}/${year}`;
  }
  if (iso.includes("/")) {
    const [dia, mes, anio] = iso.split("/");
    return `${dia.padStart(2, "0")}/${mes.padStart(2, "0")}/${anio}`;
  }
  return iso;
}

/* ─── Página principal ─── */
export default function Recepciones() {
  useTitulo("Recepciones");

  const [rows, setRows]                       = useState([]);
  const [stats, setStats]                     = useState({ total: 0, confirmadas: 0, draft: 0, estaSemana: 0});
  const [filtro, setFiltro]                   = useState("");
  const [busqueda, setBusqueda]               = useState("");
  const [paginaActiva, setPaginaActiva]       = useState(1);
  const [totalRegistros, setTotalRegistros]   = useState(0);
  const [rowSeleccionada, setRowSeleccionada] = useState(null);
  const [rowEditando, setRowEditando]         = useState(null);
  const [rowEliminando, setRowEliminando]     = useState(null);
  const [mostrarNueva, setMostrarNueva]       = useState(false);
  const [loading, setLoading]                 = useState(true);
  const [refresh, setRefresh]                 = useState(0);
  const [modalExito, setModalExito]           = useState("");
  const [filtroTiempo, setFiltroTiempo]       = useState("semana"); 

  const refetch = useCallback(() => setRefresh((r) => r + 1), []);

  // Tabla
  useEffect(() => {
    const params = new URLSearchParams({ page: paginaActiva, limit: LIMIT });
    if (filtro)   params.set("status", filtro);
    if (busqueda) params.set("q", busqueda);

    api.get(`/recepciones?${params}`)
      .then((res) => { setRows(res.items); setTotalRegistros(res.total); setLoading(false); })
      .catch(() => setLoading(false));
  }, [paginaActiva, filtro, busqueda, refresh]);

  // Stats
  useEffect(() => {
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    const fechaInicio = hace7Dias.toISOString();
    Promise.all([
      api.get("/recepciones?limit=1"),
      api.get("/recepciones?status=CONFIRMED&limit=1"),
      api.get("/recepciones?status=DRAFT&limit=1"),
      api.get(`/recepciones?limit=1&fechaDesde=${fechaInicio}`)
    ]).then(([all, confirmed, draft, semana]) => {
      setStats({ total: all.total, confirmadas: confirmed.total, draft: draft.total, estaSemana: semana.total });
    }).catch(console.error);
  }, [refresh]);

  const totalPaginas = Math.ceil(totalRegistros / LIMIT);

  const handleCambiarPagina = (p) => {
    if (p === "‹") setPaginaActiva((prev) => Math.max(1, prev - 1));
    else if (p === "›") setPaginaActiva((prev) => Math.min(totalPaginas, prev + 1));
    else setPaginaActiva(Number(p));
  };

  const handleConfirmar = (id) => {
    api.patch(`/recepciones/${id}/confirm`)
      .then(() => {
        setRowSeleccionada(null);
        refetch();
        setModalExito("Recepción confirmada correctamente");
      })
      .catch(console.error);
  };

  const handleEliminar = (id) => {
    api.delete(`/recepciones/${id}`)
      .then(() => {
        refetch();
        setModalExito("Recepción eliminada correctamente");
      })
      .catch(console.error);
  };

  const plantillaNueva = {
    id: null, folio: "", supplierNombre: "", supplierId: "",
    fecha: new Date().toISOString().split("T")[0],
    comentarios: "", status: "DRAFT", total: 0,
    createdAt: null, updatedAt: null,
    items: [{ productId: "", sku: "", productNombre: "", imagen: "", cantidad: 1, costoUnitario: 0, subtotal: 0 }],
  };

  const rango = totalRegistros === 0
    ? "0"
    : `${(paginaActiva - 1) * LIMIT + 1} – ${Math.min(paginaActiva * LIMIT, totalRegistros)}`;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 p-6 lg:p-8 space-y-6 transition-colors duration-300">

        <Encabezado 
          titulo="Recepciones" 
          onActualizar={refetch} 
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full mb-8 -mt-6!">
          <Tarjetas 
            label="Historial"       
            value={stats.total}       
            sub="todas las recepciones" 
            accent="#A68DC8" 
            icon="bi bi-layers"        
            onClick={() => { 
              setFiltro(""); 
              setFiltroTiempo("todos"); 
              setPaginaActiva(1); 
            }}
            isActive={filtro === "" && filtroTiempo === "todos"}
          />

          <Tarjetas 
            label="Recepciones" 
            value={stats.estaSemana} 
            sub="últimos 7 días"    
            accent="#7C6AF7" 
            icon="bi bi-calendar-event"      
            onClick={() => { 
              setFiltro(""); 
              setFiltroTiempo(filtroTiempo === "semana" ? "todos" : "semana"); 
              setPaginaActiva(1); 
            }}
            isActive={filtroTiempo === "semana"}
          />
          
          <Tarjetas 
            label="Confirmadas" 
            value={stats.confirmadas} 
            sub={`${stats.total ? Math.round(stats.confirmadas / stats.total * 100) : 0}% del total`} 
            accent="#8DB051" 
            icon="bi bi-check-circle" 
            onClick={() => { 
              setFiltroTiempo("todos");
              setFiltro(filtro === "CONFIRMED" ? "" : "CONFIRMED"); 
              setPaginaActiva(1); 
            }}
            isActive={filtro === "CONFIRMED"}
          />
          
          <Tarjetas 
            label="Draft"       
            value={stats.draft}       
            sub="en borrador" 
            accent="#c9c225" 
            icon="bi bi-pencil-square" 
            onClick={() => { 
              setFiltroTiempo("todos"); 
              setFiltro(filtro === "DRAFT" ? "" : "DRAFT"); 
              setPaginaActiva(1); 
            }}
            isActive={filtro === "DRAFT"}
          />
        </div>

        <ToolBar
          filtro={filtro}
          setFiltro={(v) => { setFiltro(v); setPaginaActiva(1); }}
          opcionesFiltro={OPCIONES_FILTRO}
          busqueda={busqueda}
          setBusqueda={(v) => { setBusqueda(v); setPaginaActiva(1); }}
          placeholderBuscar="Buscar por folio, proveedor..."
          textoBoton="+ Recepción"
          accionBoton={() => setMostrarNueva(true)}
        />

        <Tabla encabezados={ENCABEZADOS}>
          {loading ? (
            <tr><td colSpan={8} className="text-center py-10 text-sm opacity-50">Cargando...</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={8} className="text-center py-10 text-sm opacity-50">Sin resultados</td></tr>
          ) : rows.map((row) => (
            <tr key={row.id} className="border-t hover:bg-lila/30 dark:hover:bg-oscuro/40 transition-colors">
              <td className="p-4 text-center text-sm font-bold ">{row.folio}</td>
              <td className="p-4 text-center text-sm ">{row.supplierNombre}</td>
              <td className="p-4 text-center text-sm ">{formatDate(row.fecha)}</td>
              <td className="p-4 text-center text-sm ">{row.createdBy || "—"}</td>
              <td className="p-4 text-center text-sm ">{row.items.length}</td>
              <td className="p-4 text-center text-sm font-bold text-verde">{formatMoney(row.total)}</td>
              <td className="p-4 text-center">
                <Etiquetas contenido={row.status === "CONFIRMED" ? "Confirmado" : "Draft"} />
              </td>
              <td className="p-4 text-center">
                <AccionesTabla
                  onVer={() => setRowSeleccionada(row)}
                  onEditar={row.status === "DRAFT" ? () => setRowEditando(row) : undefined}
                  onEliminar={row.status === "DRAFT" ? () => setRowEliminando(row) : undefined}
                />
              </td>
            </tr>
          ))}
        </Tabla>

        <Paginacion
          paginaActual={paginaActiva}
          totalRegistros={totalRegistros}
          rangoSiguiente={rango}
          limit={LIMIT}
          onCambiarPagina={handleCambiarPagina}
          exportTitulo="Recepciones"
          exportColumnas={[
            { header: "Folio",     key: "folio",     width: 15 },
            { header: "Proveedor", key: "proveedor", width: 28 },
            { header: "Fecha",     key: "fecha",     width: 15 },
            { header: "Usuario",   key: "usuario",   width: 20 },
            { header: "Items",     key: "items",     width: 10 },
            { header: "Total",     key: "total",     width: 15 },
            { header: "Estado",    key: "estado",    width: 15 },
          ]}
          exportFilas={rows.map((r) => ({
            folio:     r.folio,
            proveedor: r.supplierNombre,
            fecha:     formatDate(r.fecha),
            usuario:   r.createdBy || "—",
            items:     r.items.length,
            total:     `$${Number(r.total).toLocaleString("es-MX")}`,
            estado:    r.status === "CONFIRMED" ? "Confirmado" : "Draft",
          }))}
        />

      </div>

      {/* Modales */}
      {rowSeleccionada && (
        <ModalRecepciones
          isOpen={true} 
          row={rowSeleccionada}
          onClose={() => setRowSeleccionada(null)}
          onConfirmar={handleConfirmar}
          onEditar={() => { setRowEditando(rowSeleccionada); setRowSeleccionada(null); }}
          onEliminar={() => { setRowEliminando(rowSeleccionada); setRowSeleccionada(null); }}
        />
      )}

      {rowEditando && (
        <FormRecepciones
          isOpen={true} 
          row={rowEditando}
          esNuevo={false}
          onClose={() => setRowEditando(null)}
          onGuardar={() => { refetch(); setModalExito("Recepción actualizada correctamente"); }}
        />
      )}

      {mostrarNueva && (
        <FormRecepciones
          isOpen={true} 
          row={plantillaNueva}
          esNuevo={true}
          onClose={() => setMostrarNueva(false)}
          onGuardar={() => { refetch(); setMostrarNueva(false); setModalExito("Recepción creada correctamente"); }}
        />
      )}

      {rowEliminando && (
        <ModalConfirmacion
          isOpen={true}
          tipo="eliminar"
          titulo="¿Seguro que quieres eliminar esta recepción?"
          mensaje={`${rowEliminando.folio} — ${rowEliminando.supplierNombre}. Esta acción no se puede deshacer.`}
          textoConfirmar="Eliminar"
          onConfirmar={() => { handleEliminar(rowEliminando.id); setRowEliminando(null); }}
          onCancelar={() => setRowEliminando(null)}
        />
      )}

      {modalExito && (
        <ModalConfirmacion
          isOpen={true}
          tipo="exito"
          titulo={modalExito}
          onCancelar={() => setModalExito("")}
        />
      )}
    </div>
  );
}