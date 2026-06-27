import { useState, useMemo } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

export default function Tabla({ 
  encabezados, 
  datos, 
  renderRow,
  sortableFields = [],
  children
}) {
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [sortColumnIndex, setSortColumnIndex] = useState(null);

  // Detectar si está usando el nuevo sistema (datos + renderRow) o antiguo (children)
  const usandoNuevoSistema = datos !== undefined && datos !== null;

  // Convertir encabezados de string a objetos si es necesario
  const encabezadosProcesados = encabezados?.map((header) => {
    if (typeof header === "string") {
      return { label: header, key: header.toLowerCase().replace(/\s+/g, "_") };
    }
    return header;
  }) || [];

  const handleSort = (index, header) => {
    // Para nuevo sistema: usar key de header
    if (usandoNuevoSistema) {
      if (!sortableFields.includes(header?.key)) return;
      
      let newDirection = "asc";
      if (sortField === header?.key && sortDirection === "asc") {
        newDirection = "desc";
      }
      setSortField(header?.key);
      setSortDirection(newDirection);
    } else {
      // Para antiguo sistema: usar índice de columna
      let newDirection = "asc";
      if (sortColumnIndex === index && sortDirection === "asc") {
        newDirection = "desc";
      }
      setSortColumnIndex(index);
      setSortDirection(newDirection);
    }
  };

  // Función auxiliar para extraer valor comparable
  const getComparableValue = (value) => {
    if (value === null || value === undefined) return { type: "string", value: "" };

    // Si es número, retornar como número
    if (typeof value === "number") {
      return { type: "number", value };
    }

    // Si es string, limpiar símbolos y comas, luego intentar convertir a número
    if (typeof value === "string") {
      // Reemplaza el signo $, las comas y los espacios para quedarse solo con el número
      const cleanString = value.replace(/[$,\s]/g, '').trim(); 
      const asNumber = parseFloat(cleanString);
      
      if (!isNaN(asNumber) && cleanString !== "") {
        return { type: "number", value: asNumber };
      }
      return { type: "string", value: value.trim().toLowerCase() };
    }

    return { type: "string", value: String(value).toLowerCase() };
  };

  // Función para comparar valores
  const compareValues = (valA, valB, direction) => {
    const a = getComparableValue(valA);
    const b = getComparableValue(valB);

    // Si ambos son números
    if (a.type === "number" && b.type === "number") {
      return direction === "asc" ? a.value - b.value : b.value - a.value;
    }

    // Si ambos son strings
    if (a.type === "string" && b.type === "string") {
      if (a.value < b.value) return direction === "asc" ? -1 : 1;
      if (a.value > b.value) return direction === "asc" ? 1 : -1;
      return 0;
    }

    // Mixto: números primero
    if (a.type === "number") return -1;
    if (b.type === "number") return 1;
    return 0;
  };

  // Ordenar datos del nuevo sistema
  const getSortedRows = () => {
    if (!datos || !Array.isArray(datos)) return [];
    if (!sortField) return datos;

    const sorted = [...datos].sort((a, b) => {
      const valueA = a[sortField];
      const valueB = b[sortField];
      return compareValues(valueA, valueB, sortDirection);
    });

    return sorted;
  };

  // Ordenar filas del antiguo sistema (children)
  const sortedChildren = useMemo(() => {
    if (usandoNuevoSistema || !children || sortColumnIndex === null) {
      return children;
    }

    const childrenArray = Array.isArray(children) ? children : [children];
    
    // Filtrar solo elementos TR
    const rows = childrenArray.filter(child => child?.type === 'tr');
    
    if (rows.length === 0) return children;

    const sortedRows = [...rows].sort((rowA, rowB) => {
      // Extraer el texto del TD en la columna especificada
      const getTdContent = (row) => {
        const tds = row?.props?.children;
        if (!Array.isArray(tds)) return "";
        const td = tds[sortColumnIndex];
        if (!td) return "";
        
        // Intentar extraer el texto del TD
        let text = "";

        if (typeof td.props.children === "string" || typeof td.props.children === "number") {
          text = String(td.props.children);
        } else if (Array.isArray(td.props.children)) {
          text = td.props.children
            .map(child => (typeof child === "string" || typeof child === "number") ? String(child) : child?.props?.contenido || "")
            .join("");
        } else if (td.props.children?.props?.contenido) {
          text = String(td.props.children.props.contenido);
        }

        return text;
      };

      const textA = getTdContent(rowA);
      const textB = getTdContent(rowB);

      return compareValues(textA, textB, sortDirection);
    });

    return sortedRows;
  }, [children, sortColumnIndex, sortDirection, usandoNuevoSistema]);

  const sortedRows = usandoNuevoSistema ? getSortedRows() : [];

  if (!encabezadosProcesados || encabezadosProcesados.length === 0) {
    return <div className="p-4 text-oscuro dark:text-lila-soft text-center transition-colors duration-300">Tabla sin encabezados</div>;
  }

  return (
    <div className="bg-blanco border-gris/20 text-oscuro dark:text-lila-soft dark:bg-bg-card dark:border-lila/10 rounded-xl shadow-lg overflow-x-auto transition-colors duration-300">
      <table className="w-full">
        <thead>
          <tr className="text-oscuro dark:text-lila-soft border-b border-gris/20 dark:border-lila/10 bg-gris/5 dark:bg-oscuro/50 transition-colors duration-300">
            {encabezadosProcesados.map((header, idx) => {
              const isSortable = usandoNuevoSistema 
                ? sortableFields.includes(header.key)
                : true;

              const isSorted = usandoNuevoSistema
                ? sortField === header.key
                : sortColumnIndex === idx;

              return (
                <th 
                  key={idx}
                  onClick={() => handleSort(idx, header)}
                  className={`p-4 text-center text-xs uppercase font-bold tracking-wider text-oscuro dark:text-lila-soft ${
                    isSortable ? "cursor-pointer hover:text-gray-800 dark:hover:text-lila-mid transition-colors" : ""
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {header.label}
                    {isSortable && isSorted && (
                      sortDirection === "asc" ? <ArrowDown size={14} /> : <ArrowUp size={14} />
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="text-oscuro dark:text-lila-soft transition-colors duration-300">
          {usandoNuevoSistema ? (
            // Nuevo sistema: datos + renderRow
            sortedRows.length === 0 ? (
              <tr>
                <td 
                  colSpan={encabezadosProcesados.length} 
                  className="text-center py-10 text-sm text-oscuro dark:text-lila-soft"
                >
                  No hay resultados
                </td>
              </tr>
            ) : (
              sortedRows.map((row, i) => renderRow ? renderRow(row, i) : null)
            )
          ) : (
            // Antiguo sistema: children ordenados
            sortedChildren
          )}
        </tbody>
      </table>
    </div>
  );
}