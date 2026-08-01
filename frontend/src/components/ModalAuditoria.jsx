import { useEffect, useState } from "react";
import { getResourceLabel } from "./ActionBadge";
import { staffApi } from "../services/api";
import { getPasswordAuditPresentation } from "../utils/passwordAuditPresentation";

const ACTION_CFG = {
  CREATE:        { label: "Creación",  bg: "rgba(74,222,128,0.13)",  border: "rgba(74,222,128,0.40)",  colorDark: "#84B140", colorLight: "#3d7a1a" },
  UPDATE:        { label: "Actualización",  bg: "rgba(251,191,36,0.13)",  border: "rgba(251,191,36,0.40)",  colorDark: "#C9A800", colorLight: "#92720a" },
  DELETE:        { label: "Eliminación",  bg: "rgba(244,63,94,0.13)",   border: "rgba(244,63,94,0.40)",   colorDark: "#D04E37", colorLight: "#b83224" },
  TOGGLE_ACTIVE: { label: "Cambio de estado",  bg: "rgba(56,189,248,0.13)",  border: "rgba(56,189,248,0.40)",  colorDark: "#0ea5e9", colorLight: "#0369a1" },
  ADJUST:        { label: "Ajuste", bg: "rgba(56,189,248,0.13)", border: "rgba(56,189,248,0.40)", colorDark: "#0ea5e9", colorLight: "#0369a1" },
  SEND:          { label: "Envío", bg: "rgba(56,189,248,0.13)", border: "rgba(56,189,248,0.40)", colorDark: "#0ea5e9", colorLight: "#0369a1" },
  CONFIRM:       { label: "Confirmación", bg: "rgba(74,222,128,0.13)", border: "rgba(74,222,128,0.40)", colorDark: "#84B140", colorLight: "#3d7a1a" },
  CANCEL:        { label: "Cancelación", bg: "rgba(244,63,94,0.13)", border: "rgba(244,63,94,0.40)", colorDark: "#D04E37", colorLight: "#b83224" },
  CHANGE_PASSWORD: { label: "Cambio de contraseña", bg: "rgba(251,191,36,0.13)", border: "rgba(251,191,36,0.40)", colorDark: "#C9A800", colorLight: "#92720a" },
  SEED: { label: "Inicialización", bg: "var(--gold-08)", border: "var(--border-gold-40)", colorDark: "var(--gold-light)", colorLight: "var(--gold-dark)" },
  RESET_PASSWORD: { label: "Restablecimiento de contraseña", bg: "rgba(251,191,36,0.13)", border: "rgba(251,191,36,0.40)", colorDark: "#C9A800", colorLight: "#92720a" },
};

const ETIQUETAS_CAMPO = {
  sku: "SKU", nombre: "Nombre", descripcion: "Descripción", categoria: "Categoría",
  departamento: "Departamento", supplierId: "ID de proveedor", supplierNombre: "Proveedor",
  precioCompra: "Precio de compra", precioVenta: "Precio de venta", stockMinimo: "Stock mínimo",
  stockIdeal: "Stock ideal", stockMaximo: "Stock máximo", activo: "Estado", imagenes: "Imágenes",
  inventario: "Inventario", ajustes: "Ajustes de inventario", motivo: "Motivo", notas: "Notas",
  numeroPedido: "Número de pedido", estadoEnvio: "Estado de envío", cambios: "Cambios realizados",
  changes: "Cambios realizados", evidencia: "Evidencia",
};

const etiquetaCampo = (campo) => ETIQUETAS_CAMPO[campo] || String(campo).replace(/([A-Z])/g, " $1").replace(/^./, (letra) => letra.toUpperCase());

function formatearValor(campo, valor) {
  if (valor === null || valor === undefined || valor === "") return "Sin dato";
  if (campo === "activo") return valor ? "Activo" : "Inactivo";
  if (["precioCompra", "precioVenta"].includes(campo) && !Number.isNaN(Number(valor))) {
    return Number(valor).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
  }
  if (campo === "imagenes" && Array.isArray(valor)) return `${valor.length} imagen${valor.length === 1 ? "" : "es"}`;
  if (campo === "inventario" && Array.isArray(valor)) return `${valor.length} talla${valor.length === 1 ? "" : "s"}`;
  if (Array.isArray(valor)) return valor.join(", ") || "Sin dato";
  if (typeof valor === "object") return JSON.stringify(valor);
  return String(valor);
}

function fmtLong(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "2-digit" }) +
    " · " +
    d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  );
}

export default function ModalAuditoria({ isOpen, onClose, data }) {
  const [indiceEvidencia, setIndiceEvidencia] = useState(0);
  const [paginaPdf, setPaginaPdf] = useState(1);
  const [productoContexto, setProductoContexto] = useState(null);

  useEffect(() => {
    setIndiceEvidencia(0);
    setPaginaPdf(1);
  }, [data?.id, isOpen]);

  useEffect(() => {
    let activo = true;
    setProductoContexto(null);
    if (!isOpen || data?.resource !== "products" || !data.resourceId || data.action === "DELETE") return undefined;

    staffApi.get(`/products/${data.resourceId}`)
      .then((respuesta) => {
        if (activo) setProductoContexto(respuesta.item || respuesta.data?.item || respuesta);
      })
      .catch(() => {});

    return () => { activo = false; };
  }, [data?.id, data?.resource, data?.resourceId, data?.action, isOpen]);

  if (!isOpen || !data) return null;

  const cfg = ACTION_CFG[data.action] || {
    label: data.action,
    bg: "var(--gold-08)", border: "var(--border-gold-40)",
    colorDark: "var(--gold-light)", colorLight: "var(--gold-dark)",
  };

  const evidencias = Array.isArray(data.details?.evidencia)
    ? data.details.evidencia.filter((url) => typeof url === "string" && url)
    : [];
  const ajustes = Array.isArray(data.details?.ajustes) ? data.details.ajustes : [];
  const cambios = Array.isArray(data.details?.cambios)
    ? data.details.cambios
    : Array.isArray(data.details?.changes) ? data.details.changes : [];
  const esProductoCreado = data.resource === "products" && data.action === "CREATE";
  const esProductoEliminado = data.resource === "products" && data.action === "DELETE";
  const camposProductoCreado = ["imagenes", "sku", "nombre", "descripcion", "categoria", "departamento", "precioCompra", "precioVenta", "stockMinimo", "stockIdeal", "stockMaximo", "activo"];
  const camposOmitidosProductoCreado = ["supplierId", "supplierNombre", "stock", "inventario"];
  const camposProductoEliminado = ["imagenes", "sku", "nombre", "descripcion", "categoria", "departamento", "precioCompra", "precioVenta", "stock", "stockMinimo", "stockIdeal", "stockMaximo", "activo", "inventario"];
  const contextoProducto = productoContexto || (data.resource === "products" ? {
    sku: data.details?.sku,
    nombre: data.details?.nombre,
    activo: data.details?.activo,
    categoria: data.details?.categoria,
    departamento: data.details?.departamento,
    imagenes: data.details?.imagenes,
  } : null);
  const datosProductoCreado = {
    ...(productoContexto || {}),
    ...Object.fromEntries(Object.entries(data.details || {}).filter(([, valor]) => valor !== undefined)),
  };
  const passwordPresentation = getPasswordAuditPresentation(data);
  const clavesContextoProducto = ["sku", "nombre", "activo", "categoria", "departamento", "imagenes", "stock", "stockMinimo", "stockIdeal", "stockMaximo"];
  const detalles = passwordPresentation ? [] : data.details
    ? Object.entries(data.details).filter(([key]) => !["evidencia", "ajustes", "cambios", "changes", ...(esProductoCreado ? [...camposProductoCreado, ...camposOmitidosProductoCreado] : esProductoEliminado ? camposProductoEliminado : data.resource === "products" ? clavesContextoProducto : [])].includes(key))
    : [];
  const evidenciaActual = evidencias[indiceEvidencia];
  const esPdf = /\.pdf(?:$|[?#])/i.test(evidenciaActual || "");

  const mostrarAnterior = () => {
    if (esPdf && paginaPdf > 1) {
      setPaginaPdf((pagina) => pagina - 1);
      return;
    }
    if (indiceEvidencia > 0) {
      setIndiceEvidencia((indice) => indice - 1);
      setPaginaPdf(1);
    }
  };

  const mostrarSiguiente = () => {
    if (esPdf) {
      setPaginaPdf((pagina) => pagina + 1);
      return;
    }
    if (indiceEvidencia < evidencias.length - 1) {
      setIndiceEvidencia((indice) => indice + 1);
      setPaginaPdf(1);
    }
  };

  return (
    /* ── Backdrop ── */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm bg-[var(--noir)]/40 dark:bg-black/60 font-body"
      onClick={onClose}
    >
      
      <div
        className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-[2px] shadow-2xl overflow-hidden border bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)]"
        onClick={(e) => e.stopPropagation()}
      >

        
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-[var(--border-gold-25)] dark:border-[var(--border-gold-20)]">
          <div className="flex items-center gap-2">
            
            <span
              className="inline-flex items-center px-3 py-1 rounded-[2px] text-xs lg:text-sm font-bold"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
            >
              <span className="dark:hidden"  style={{ color: cfg.colorLight }}>{cfg.label}</span>
              <span className="hidden dark:inline" style={{ color: cfg.colorDark }}>{cfg.label}</span>
            </span>

            
            <span
              className="inline-flex items-center px-3 py-1 rounded-[2px] text-xs lg:text-sm font-medium"
              style={{ background: "var(--gold-08)", border: "0.5px solid var(--border-gold-40)" }}
            >
              <span className="dark:hidden"  style={{ color: "var(--gold-dark)" }}>{passwordPresentation?.resourceLabel || getResourceLabel(data.resource, data.action)}</span>
              <span className="hidden dark:inline" style={{ color: "var(--gold-light)" }}>{passwordPresentation?.resourceLabel || getResourceLabel(data.resource, data.action)}</span>
            </span>
          </div>

          
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-[2px] transition-all cursor-pointer text-[var(--gold-dark)] hover:bg-[var(--gold-08)] dark:text-[var(--ash)] dark:hover:text-[var(--snow)] dark:hover:bg-[var(--gold-08)]"
          >
            <i className="bi bi-x-lg text-sm" />
          </button>
        </div>

        
        <div className="flex-1 overflow-y-auto overscroll-contain p-6 flex flex-col gap-5
          [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:rounded-[2px] [&::-webkit-scrollbar-thumb]:bg-[var(--gold)]/20
          hover:[&::-webkit-scrollbar-thumb]:bg-[var(--gold)]/50
          dark:[&::-webkit-scrollbar-thumb]:bg-[var(--gold-light)]/30 dark:hover:[&::-webkit-scrollbar-thumb]:bg-[var(--gold-light)]">

          
          <div className="flex flex-col gap-1">
            <h2 className="text-xl lg:text-2xl font-display font-bold text-[var(--noir)] dark:text-[var(--snow)] m-0 leading-tight">
              {data.usuario || "Usuario desconocido"}
            </h2>
            <div className="flex flex-col gap-1 text-xs lg:text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">
              <span className="flex items-center gap-1">
                <i className="bi bi-calendar3 text-[11px]" />
                <strong className="text-[var(--noir)] dark:text-[var(--snow)]">Registrado:</strong>
                {fmtLong(data.createdAt)}
              </span>
            </div>

            
            {data.resourceId && (
              <p
                className="mt-1 pl-3 text-xs lg:text-sm font-mono italic text-[var(--noir-soft)] dark:text-[var(--ash)] border-l-2 m-0"
                style={{ borderColor: cfg.colorDark }}
              >
                <span className="not-italic font-semibold">ID del recurso:</span> "{data.resourceId}"
              </p>
            )}
          </div>

          {esProductoCreado && (
            <section className="flex flex-col gap-3 rounded-[2px] border border-[var(--border-gold-25)] bg-[var(--gold-08)] p-3 dark:border-[var(--border-gold-20)]">
              <p className="text-[10px] font-tag font-bold uppercase tracking-widest text-[var(--gold-dark)] dark:text-[var(--gold-light)]">Producto creado</p>
              <div className="overflow-hidden rounded-[2px] border border-[var(--border-gold-25)] dark:border-[var(--border-gold-20)]">
                <table className="w-full text-left text-xs lg:text-sm">
                  <tbody>
                    {camposProductoCreado.filter((campo) => datosProductoCreado[campo] !== undefined).map((campo) => {
                      const valor = datosProductoCreado[campo];
                      if (campo === "imagenes") {
                        const imagenes = Array.isArray(valor) ? valor : [];
                        return <tr key={campo} className="border-t border-[var(--border-gold-20)]"><td className="w-[35%] px-3 py-2.5 align-top font-semibold text-[var(--noir-soft)] dark:text-[var(--ash)]">Imagen</td><td className="px-3 py-2.5">{imagenes.length ? <div className="flex gap-2 overflow-x-auto pb-2">{imagenes.map((url, indice) => <img key={url} src={url} alt={`Imagen del producto ${indice + 1}`} className="h-28 w-20 shrink-0 rounded-[2px] object-cover" />)}</div> : <span className="text-[var(--noir-soft)] dark:text-[var(--ash)]">Sin imágenes</span>}</td></tr>;
                      }
                      return <tr key={campo} className="border-t border-[var(--border-gold-20)]"><td className="w-[35%] px-3 py-2.5 align-top font-semibold text-[var(--noir-soft)] dark:text-[var(--ash)]">{etiquetaCampo(campo)}</td><td className="px-3 py-2.5 align-top break-words text-[var(--noir)] dark:text-[var(--snow)]">{formatearValor(campo, valor)}</td></tr>;
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {esProductoEliminado && (
            <section className="flex flex-col gap-3 rounded-[2px] border border-rojo/30 bg-rojo/5 p-3 dark:border-rojo/30 dark:bg-rojo/5">
              <p className="text-[10px] font-tag font-bold uppercase tracking-widest text-rojo-dark dark:text-rojo">Producto eliminado</p>
              <div className="overflow-hidden rounded-[2px] border border-rojo/25 dark:border-rojo/25">
                <table className="w-full text-left text-xs lg:text-sm">
                  <tbody>
                    {camposProductoEliminado.filter((campo) => data.details?.[campo] !== undefined).map((campo) => {
                      const valor = data.details?.[campo];
                      if (campo === "imagenes") {
                        const imagenes = Array.isArray(valor) ? valor.filter((url) => typeof url === "string" && url) : [];
                        return <tr key={campo} className="border-t border-rojo/15"><td className="w-[35%] px-3 py-2.5 align-top font-semibold text-[var(--noir-soft)] dark:text-[var(--ash)]">Imagen</td><td className="px-3 py-2.5">{imagenes.length ? <div className="flex gap-2 overflow-x-auto pb-2">{imagenes.map((url, indice) => <img key={`${url}-${indice}`} src={url} alt={`Imagen conservada del producto eliminado ${indice + 1}`} className="h-28 w-20 shrink-0 rounded-[2px] object-cover" />)}</div> : <span className="text-[var(--noir-soft)] dark:text-[var(--ash)]">Sin imágenes</span>}</td></tr>;
                      }
                      return <tr key={campo} className="border-t border-rojo/15"><td className="w-[35%] px-3 py-2.5 align-top font-semibold text-[var(--noir-soft)] dark:text-[var(--ash)]">{etiquetaCampo(campo)}</td><td className="px-3 py-2.5 align-top break-words text-[var(--noir)] dark:text-[var(--snow)]">{formatearValor(campo, valor)}</td></tr>;
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {data.resource === "products" && !esProductoCreado && !esProductoEliminado && contextoProducto && (
            <section className="flex flex-col gap-2 rounded-[2px] border border-[var(--border-gold-25)] bg-[var(--gold-08)] p-3 dark:border-[var(--border-gold-20)]">
              <p className="text-[10px] font-tag font-bold uppercase tracking-widest text-[var(--gold-dark)] dark:text-[var(--gold-light)]">Producto modificado</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-16 w-12 shrink-0 overflow-hidden rounded-[2px] bg-[var(--noir-soft)]">
                    {contextoProducto.imagenes?.[0] ? (
                      <img src={contextoProducto.imagenes[0]} alt={contextoProducto.nombre || "Producto"} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[var(--gold-light)]"><i className="bi bi-image" /></div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--noir)] dark:text-[var(--snow)]">{contextoProducto.nombre || "Producto"}</p>
                    <p className="mt-0.5 text-xs font-mono text-[var(--gold-dark)] dark:text-[var(--gold-light)]">SKU: {contextoProducto.sku || "Sin SKU"}</p>
                  </div>
                </div>
                <div className="grid content-center grid-cols-[110px_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
                  <span className="text-[var(--noir-soft)] dark:text-[var(--ash)]">Estado:</span><span className="font-bold text-[var(--noir)] dark:text-[var(--snow)]">{contextoProducto.activo === false ? "Inactivo" : "Activo"}</span>
                  <span className="text-[var(--noir-soft)] dark:text-[var(--ash)]">Departamento:</span><span className="font-bold text-[var(--noir)] dark:text-[var(--snow)]">{contextoProducto.departamento || "Sin departamento"}</span>
                  <span className="text-[var(--noir-soft)] dark:text-[var(--ash)]">Categoría:</span><span className="font-bold text-[var(--noir)] dark:text-[var(--snow)]">{contextoProducto.categoria || "Sin categoría"}</span>
                </div>
              </div>
            </section>
          )}

          
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "ACCIÓN",   value: cfg.label,        accion: true },
              { label: "RECURSO",  value: passwordPresentation?.resourceLabel || getResourceLabel(data.resource, data.action) },
              ...(passwordPresentation?.fields || []),
            ].map(({ label, value, accion, highlight }) => (
              <div
                key={label}
                className="flex flex-col gap-1 px-3 py-2.5 rounded-[2px] border bg-[var(--gold-08)] border-[var(--border-gold-25)] dark:bg-[var(--gold-08)] dark:border-[var(--border-gold-20)]"
              >
                <span className="text-[9px] lg:text-[10px] font-tag font-bold uppercase tracking-widest text-[var(--gold-dark)] dark:text-[var(--ash)]">
                  {label}
                </span>
                {accion ? (
                  <>
                    <span className="text-sm lg:text-base font-bold dark:hidden" style={{ color: cfg.colorLight }}>{value}</span>
                    <span className="text-sm lg:text-base font-bold hidden dark:inline" style={{ color: cfg.colorDark }}>{value}</span>
                  </>
                ) : (
                  <span className={`text-sm lg:text-base font-bold ${highlight ? "text-green-700 dark:text-verde" : "text-[var(--noir)] dark:text-[var(--snow)]"}`}>
                    {value}
                  </span>
                )}
              </div>
            ))}
          </div>

          
          {detalles.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] lg:text-[11px] font-tag font-bold uppercase tracking-widest m-0 text-[var(--gold-dark)] dark:text-[var(--ash)]">
                Detalles del evento
              </p>
              <div className="flex flex-col gap-1.5">
                {detalles.map(([key, val]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-4 px-4 py-2.5 rounded-[2px] border bg-[var(--gold-08)] border-[var(--border-gold-25)] dark:bg-[var(--gold-08)] dark:border-[var(--border-gold-20)]"
                  >
                    <span className="text-[10px] lg:text-[11px] font-tag font-bold uppercase tracking-wider shrink-0 text-[var(--gold-dark)] dark:text-[var(--ash)]">
                      {etiquetaCampo(key)}
                    </span>
                    <span className="text-xs lg:text-sm font-mono text-right break-all text-[var(--noir)] dark:text-[var(--snow)]">
                      {formatearValor(key, val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ajustes.length > 0 && (
            <section className="flex flex-col gap-2">
              <p className="text-[10px] lg:text-[11px] font-tag font-bold uppercase tracking-widest m-0 text-[var(--gold-dark)] dark:text-[var(--ash)]">Ajustes de inventario</p>
              <div className="overflow-hidden rounded-[2px] border border-[var(--border-gold-25)] dark:border-[var(--border-gold-20)]">
                <table className="w-full text-left text-xs lg:text-sm">
                  <thead className="bg-[var(--gold-08)] text-[10px] uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--ash)]">
                    <tr><th className="px-3 py-2">Talla</th><th className="px-3 py-2 text-right">Anterior</th><th className="px-3 py-2 text-right">Nuevo</th><th className="px-3 py-2 text-right">Variación</th></tr>
                  </thead>
                  <tbody>{ajustes.map((ajuste, indice) => {
                    const variacion = Number(ajuste.cantidadNueva || 0) - Number(ajuste.cantidadAnterior || 0);
                    return <tr key={`${ajuste.talla}-${indice}`} className="border-t border-[var(--border-gold-20)] text-[var(--noir)] dark:text-[var(--snow)]">
                      <td className="px-3 py-2.5 font-semibold">{ajuste.talla}</td><td className="px-3 py-2.5 text-right tabular-nums">{ajuste.cantidadAnterior}</td><td className="px-3 py-2.5 text-right tabular-nums">{ajuste.cantidadNueva}</td><td className={`px-3 py-2.5 text-right font-semibold tabular-nums ${variacion > 0 ? "text-green-700 dark:text-verde" : "text-rojo-dark dark:text-rojo"}`}>{variacion > 0 ? "+" : ""}{variacion}</td>
                    </tr>;
                  })}</tbody>
                </table>
              </div>
            </section>
          )}

          {cambios.length > 0 && (
            <section className="flex flex-col gap-2">
              <p className="text-[10px] lg:text-[11px] font-tag font-bold uppercase tracking-widest m-0 text-[var(--gold-dark)] dark:text-[var(--ash)]">Cambios realizados ({cambios.length})</p>
              {typeof cambios[0] === "string" ? (
                <div className="flex flex-wrap gap-2">{cambios.map((campo) => <span key={campo} className="rounded-full border border-[var(--border-gold-40)] bg-[var(--gold-08)] px-2.5 py-1 text-xs text-[var(--noir)] dark:text-[var(--snow)]">{etiquetaCampo(campo)}</span>)}</div>
              ) : (
                <div className="overflow-hidden rounded-[2px] border border-[var(--border-gold-25)] dark:border-[var(--border-gold-20)]">
                  <table className="w-full text-left text-xs lg:text-sm">
                    <thead className="bg-[var(--gold-08)] text-[10px] uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--ash)]"><tr><th className="px-3 py-2">Campo</th><th className="px-3 py-2">Valor anterior</th><th className="px-3 py-2">Valor nuevo</th></tr></thead>
                    <tbody>{cambios.map((cambio, indice) => <tr key={`${cambio.campo}-${indice}`} className="border-t border-[var(--border-gold-20)] text-[var(--noir)] dark:text-[var(--snow)]"><td className="px-3 py-2.5 align-top font-semibold">{etiquetaCampo(cambio.campo)}</td><td className="px-3 py-2.5 align-top break-words text-[var(--noir-soft)] dark:text-[var(--ash)]">{formatearValor(cambio.campo, cambio.antes)}</td><td className="px-3 py-2.5 align-top break-words font-semibold">{formatearValor(cambio.campo, cambio.despues)}</td></tr>)}</tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {evidenciaActual && (
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] lg:text-[11px] font-tag font-bold uppercase tracking-widest m-0 text-[var(--gold-dark)] dark:text-[var(--ash)]">
                  Evidencia {indiceEvidencia + 1} de {evidencias.length}{esPdf ? ` · Página ${paginaPdf}` : ""}
                </p>
                <a
                  href={evidenciaActual}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-[2px] border border-[var(--gold)] bg-[var(--gold-08)] px-2.5 py-1.5 text-xs font-semibold text-[var(--gold-dark)] transition-colors hover:bg-[var(--gold-15)] dark:text-[var(--gold-light)]"
                >
                  <i className="bi bi-download" /> Descargar evidencia
                </a>
              </div>

              <div className="relative overflow-hidden rounded-[2px] border border-[var(--border-gold-40)] bg-[var(--noir)]">
                {esPdf ? (
                  <iframe
                    key={`${evidenciaActual}-${paginaPdf}`}
                    src={`${evidenciaActual}#page=${paginaPdf}&view=FitH`}
                    title={`Evidencia PDF, página ${paginaPdf}`}
                    className="h-[420px] w-full bg-white"
                  />
                ) : (
                  <img src={evidenciaActual} alt={`Evidencia ${indiceEvidencia + 1}`} className="max-h-[420px] w-full object-contain" />
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={mostrarAnterior}
                  disabled={esPdf ? paginaPdf === 1 : indiceEvidencia === 0}
                  className="inline-flex h-9 min-w-9 items-center justify-center rounded-[2px] border border-[var(--border-gold-40)] px-3 text-sm font-bold text-[var(--gold-dark)] disabled:cursor-not-allowed disabled:opacity-35 dark:text-[var(--gold-light)]"
                  aria-label="Evidencia o página anterior"
                >
                  &lt;
                </button>
                <span className="text-xs text-[var(--noir-soft)] dark:text-[var(--ash)]">
                  {esPdf ? `Página ${paginaPdf}` : `${indiceEvidencia + 1} / ${evidencias.length}`}
                </span>
                <button
                  type="button"
                  onClick={mostrarSiguiente}
                  disabled={!esPdf && indiceEvidencia === evidencias.length - 1}
                  className="inline-flex h-9 min-w-9 items-center justify-center rounded-[2px] border border-[var(--border-gold-40)] px-3 text-sm font-bold text-[var(--gold-dark)] disabled:cursor-not-allowed disabled:opacity-35 dark:text-[var(--gold-light)]"
                  aria-label="Siguiente evidencia o página"
                >
                  &gt;
                </button>
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
}
