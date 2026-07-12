import { useState, useEffect } from "react";
import Tabla from "./Tabla";
import Paginacion from "./Paginacion";
import Etiquetas from "./Etiquetas";
import AccionesTabla from "./AccionesTabla";
import { TALLAS_POR_CATEGORIA } from "../constants/categorias";

function calcularStockTotal(inventario) {
  if (!Array.isArray(inventario)) return 0;
  return inventario.reduce((acc, item) => acc + (item.stock || 0), 0);
}

function getEstadoStock(stock, minimo) {
  if (stock <= minimo) return "critico";
  if (stock <= minimo * 2) return "bajo";
  return "normal";
}

function getColorStock(stock) {
  if (stock <= 10) return "text-rojo";
  if (stock <= 30) return "text-amarillo";
  return "text-verde";
}

export default function TablaInventario({ productosDB, busqueda, filtroEstado, cargando, onVer, onEditar }) {
  const [paginaActual, setPaginaActual] = useState(1);
  const [hoveredId, setHoveredId] = useState(null);
  const LIMIT = 10;

  const productosFiltrados = (productosDB || [])
    .filter((p) =>
      busqueda === "" ||
      (p.nombre || "").toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.sku || "").toLowerCase().includes(busqueda.toLowerCase())
    )
    .filter((p) => {
      if (!filtroEstado) return true;
      const stock = calcularStockTotal(p.inventario);
      const minimo = Number(p.stockMinimo) || 5;
      return getEstadoStock(stock, minimo) === filtroEstado;
    });

  useEffect(() => { setPaginaActual(1); }, [busqueda, filtroEstado]);

  const start = (paginaActual - 1) * LIMIT;
  const productosPaginados = productosFiltrados.slice(start, start + LIMIT);

  const handleCambiarPagina = (page) => {
    const total = Math.max(1, Math.ceil(productosFiltrados.length / LIMIT));
    if (page === "‹") setPaginaActual((c) => Math.max(1, c - 1));
    else if (page === "›") setPaginaActual((c) => Math.min(total, c + 1));
    else setPaginaActual(Number(page));
  };

  const encabezados = ["Imagen", "SKU", "Producto", "Categoría", "Stock Total", "Stock Mínimo", "Acciones"];
  const COLSPAN = encabezados.length;

  return (
    <>
      <Tabla encabezados={encabezados} cargando={cargando} entidad="productos">
        {productosPaginados.length === 0 ? (
          <tr>
            <td colSpan={COLSPAN} className="text-center py-14 text-sm lg:text-base text-noir-soft dark:text-ash">
              <i className="bi bi-inbox mr-2" />Sin resultados
            </td>
          </tr>
        ) : (
          productosPaginados.map((p) => {
            const stockTotal  = calcularStockTotal(p.inventario);
            const stockMinimo = Number(p.stockMinimo) || 5;
            const tallasCategoria = TALLAS_POR_CATEGORIA[p.categoria] || ["Unitalla"];
            const iluminada = hoveredId === p.id;

            return (
              <>
                <tr
                  key={p.id}
                  className={`border-gold/10 transition-colors cursor-pointer ${iluminada ? "bg-gold/8" : ""}`}
                  onMouseEnter={() => setHoveredId(p.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => onVer(p)}
                >
                  <td className="py-1.5 px-2 text-center">
                    <div className="w-12 h-12 mx-auto rounded-[2px] overflow-hidden bg-noir-soft border border-gold/20">
                      {p.imagenes?.[0] ? (
                        <img src={p.imagenes[0]} alt={p.nombre} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <i className="bi bi-image text-ash text-sm" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-4 text-center text-xs lg:text-sm font-mono text-gold-dark dark:text-gold-light">{p.sku}</td>
                  <td className="py-2 px-4 text-center text-sm lg:text-base font-medium text-noir dark:text-snow">{p.nombre}</td>
                  <td className="py-2 px-4 text-center"><Etiquetas contenido={p.categoria} /></td>
                  <td className={`py-2 px-4 text-center text-sm lg:text-base font-bold ${getColorStock(stockTotal)}`}>{stockTotal}</td>
                  <td className="py-2 px-4 text-center text-xs lg:text-sm text-noir-soft dark:text-ash">{stockMinimo}</td>
                  <td className="py-2 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <AccionesTabla onVer={() => onVer(p)} onEditar={() => onEditar(p)} />
                  </td>
                </tr>

                <tr
                  key={`${p.id}-tallas`}
                  className={`border-b border-gold/10 transition-colors cursor-pointer ${iluminada ? "bg-gold/8" : ""}`}
                  onMouseEnter={() => setHoveredId(p.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => onVer(p)}
                >
                  <td className="pt-0 pb-2 px-2 text-center align-top">
                    <span className="text-[10px] font-extrabold tracking-wider text-gold-dark dark:text-gold-light uppercase">
                      Tallas
                    </span>
                  </td>
                  <td colSpan={COLSPAN - 1} className="pt-0 pb-2 px-4 text-left">
                    <div className="flex flex-wrap items-center justify-start gap-1.5">
                      {tallasCategoria.map((t) => {
                        const item = p.inventario?.find((i) => i.talla === t);
                        const registrada = !!item;
                        const cantidad = item?.stock || 0;
                        const label = t === "Unitalla" ? "UNI" : t;
                        return (
                          <span
                            key={t}
                            className={`px-2 py-0.5 rounded-[2px] bg-ivory border border-black/5 dark:border-white/10 text-[11px] font-bold ${
                              registrada
                                ? "text-noir dark:text-snow"
                                : "text-noir-soft/40 dark:text-ash/40"
                            }`}
                          >
                            {label}: {cantidad}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              </>
            );
          })
        )}
      </Tabla>

      <Paginacion
        paginaActual={paginaActual}
        totalRegistros={productosFiltrados.length}
        limit={LIMIT}
        onCambiarPagina={handleCambiarPagina}
        exportTitulo="Inventario por Producto"
        exportColumnas={[
          { header: "SKU",         key: "sku",      width: 14 },
          { header: "Producto",    key: "nombre",   width: 28 },
          { header: "Categoría",   key: "categoria",width: 16 },
          { header: "Stock Total", key: "stock",    width: 10 },
          { header: "Mínimo",      key: "minimo",   width: 8  },
          { header: "Estado",      key: "estado",   width: 10 },
          { header: "Tallas",      key: "tallas",   width: 45 },
        ]}
        exportFilas={productosFiltrados.map((p) => {
          const stockTotal  = calcularStockTotal(p.inventario);
          const stockMinimo = Number(p.stockMinimo) || 5;
          const tallasCategoria = TALLAS_POR_CATEGORIA[p.categoria] || ["Unitalla"];
          const tallasTexto = tallasCategoria
            .map((t) => `${t}:${p.inventario?.find((i) => i.talla === t)?.stock || 0}`)
            .join("  ");
          return {
            sku: p.sku, nombre: p.nombre, categoria: p.categoria,
            stock: stockTotal, minimo: stockMinimo,
            estado: getEstadoStock(stockTotal, stockMinimo),
            tallas: tallasTexto,
          };
        })}
      />
    </>
  );
}