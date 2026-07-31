import { useEffect, useRef, useState } from "react";
import Etiquetas from "./Etiquetas";
import Boton from "./Boton";
import Modal from "./Modal";
import AccionesTabla from "./AccionesTabla";
import MenuExportar from "./MenuExportar";
import { uploadFileToCloudinary } from "../services/cloudinaryClient";
import ModalFactura from "./ModalFactura";

const ESTADO_LABELS = { BORRADOR: "En borrador", ENVIADA: "Enviada", CONFIRMADA: "Recibido", CANCELADA: "Cancelada" };

function formatMoney(n) {
  const amount = Number(n);
  return Number.isFinite(amount) ? `$${amount.toLocaleString("es-MX")}` : "—";
}

function getValidCost(...candidates) {
  for (const candidate of candidates) {
    const value = Number(candidate);
    if (Number.isFinite(value) && value > 0) return value;
  }
  return null;
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

export default function ModalRecepciones({ row, onClose, onConfirmar, onCancelar, onEnviar, onEditar, onEditarPedido, onEliminar, onAdjuntarFactura, isOpen, soloLectura = false, modoChecklist = false, vistaMisPedidos = false, puedeEditar = false, puedeEliminar = false, puedeConfirmar = false, puedeCancelar = false, puedeEnviar = false, enviando = false }) {
  const [busquedaItems, setBusquedaItems] = useState("");
  const [itemsChecklist, setItemsChecklist] = useState([]);
  const [itemsMarcados, setItemsMarcados] = useState({});
  const [valoresEnEdicion, setValoresEnEdicion] = useState({});
  const [cantidadesPrevias, setCantidadesPrevias] = useState({});
  const [facturaProveedor, setFacturaProveedor] = useState("");
  const [archivoFactura, setArchivoFactura] = useState(null);
  const [facturaUrl, setFacturaUrl] = useState("");
  const [subiendoFactura, setSubiendoFactura] = useState(false);
  const [confirmandoRecepcion, setConfirmandoRecepcion] = useState(false);
  const confirmacionEnCursoRef = useRef(false);
  const [guardandoFacturaPendiente, setGuardandoFacturaPendiente] = useState(false);
  const [mostrarFactura, setMostrarFactura] = useState(false);

  useEffect(() => {
    if (!row) return;

    const itemsIniciales = (row.items || []).map((item) => {
      const cantidadInicial = Math.max(
        0,
        Number(item.cantidadRecibida ?? item.cantidad ?? 0)
      );

      return {
        id: item.id,
        cantidadRecibida: String(cantidadInicial),
        costoUnitarioReal: getValidCost(item.costoUnitarioReal, item.costoUnitario, item.precioCompra),
      };
    });

    setBusquedaItems("");
    setFacturaProveedor(row.facturaProveedor || "");
    setArchivoFactura(null);
    setFacturaUrl(row.facturaUrl || "");
    setSubiendoFactura(false);
    setConfirmandoRecepcion(false);
    confirmacionEnCursoRef.current = false;
    setGuardandoFacturaPendiente(false);
    setMostrarFactura(false);
    setValoresEnEdicion({});
    setItemsMarcados(
      Object.fromEntries((row.items || []).map((item) => [item.id, false]))
    );
    setItemsChecklist(itemsIniciales);
    setCantidadesPrevias(
      Object.fromEntries(
        itemsIniciales.map((item) => [
          item.id,
          item.cantidadRecibida || "0",
        ])
      )
    );
  }, [row?.id, modoChecklist]);

  if (!row) return null;

  const esBorrador = row.status === "BORRADOR";
  const esEnviada = row.status === "ENVIADA";
  const esConfirmada = row.status === "CONFIRMADA";
  const esCancelada = row.status === "CANCELADA";
  const ocultarDatosRecepcion = vistaMisPedidos && (esBorrador || esEnviada);
  const costoUnitarioRecibido = (item) => getValidCost(item.costoUnitarioReal, item.costoUnitario, item.precioCompra);
  const cantidadRecibida = (item) => {
    const value = Number(item.cantidadRecibida ?? item.cantidad);
    return Number.isFinite(value) && value >= 0 ? value : null;
  };
  const costoTotalRecibido = (item) => {
    const costo = costoUnitarioRecibido(item);
    const cantidad = cantidadRecibida(item);
    return costo === null || cantidad === null ? null : costo * cantidad;
  };
  const columnasExportacion = [
    { header: "SKU", key: "sku", width: 18 },
    { header: "Producto", key: "producto", width: 32 },
    { header: "Talla", key: "talla", width: 14 },
    { header: "Cantidad (pz)", key: "cantidad", width: 16 },
    ...(esConfirmada ? [
      { header: "Precio por unidad", key: "precioUnitario", width: 20 },
      { header: "Costo", key: "costo", width: 18 },
    ] : []),
  ];
  const filasExportacion = row.items.map((item) => ({
    sku: item.sku || "—",
    producto: item.productNombre || "—",
    talla: item.talla || "—",
    cantidad: esConfirmada ? cantidadRecibida(item) : Number(item.cantidad || 0),
    ...(esConfirmada ? {
      precioUnitario: formatMoney(costoUnitarioRecibido(item)),
      costo: formatMoney(costoTotalRecibido(item)),
    } : {}),
  }));
  const totalCostoRecibido = row.items.reduce((total, item) => {
    const subtotal = costoTotalRecibido(item);
    return subtotal === null ? null : (total === null ? null : total + subtotal);
  }, 0);
  const tituloExportacion = `Pedido ${row.folio || row.id}`;
  const terminoBusquedaItems = busquedaItems.trim().toLowerCase();
  const itemsVisibles = (row.items || []).filter((item) => !terminoBusquedaItems || item.productNombre?.toLowerCase().includes(terminoBusquedaItems) || item.sku?.toLowerCase().includes(terminoBusquedaItems));
  const productosAgrupados = Object.values(itemsVisibles.reduce((grupos, item) => {
    const clave = item.productId || item.id;
    if (!grupos[clave]) grupos[clave] = [];
    grupos[clave].push(item);
    return grupos;
  }, {}));
  const todosMarcados =
    row.items.length > 0 &&
    row.items.every((item) => itemsMarcados[item.id]);

  const cantidadesCompletas = (row.items || []).every((item) => {
    const cantidad = itemsChecklist.find(
      (linea) => linea.id === item.id
    )?.cantidadRecibida;

    return cantidad !== undefined && cantidad !== "";
  });

  const costosCompletos = productosAgrupados.every((items) => {
    const producto = items[0];
    const clave = `costo-${producto.productId}`;
    const valorEnEdicion = valoresEnEdicion[clave];

    if (valorEnEdicion !== undefined) {
      return valorEnEdicion !== "";
    }

    const costo = itemsChecklist.find(
      (linea) => linea.id === producto.id
    )?.costoUnitarioReal;

    return getValidCost(costo) !== null;
  });

  const checklistCompleto =
    todosMarcados && cantidadesCompletas && costosCompletos;


  const actualizarCostoReal = (id, valor) => {
    const costo = getValidCost(valor);
    setItemsChecklist((prev) => prev.map((item) => item.id === id ? { ...item, costoUnitarioReal: costo } : item));
  };

  const actualizarCostoRealProducto = (items, valor) => {
    const costo = getValidCost(valor);
    const ids = new Set(items.map((item) => item.id));
    setItemsChecklist((prev) => prev.map((item) => ids.has(item.id)
      ? { ...item, costoUnitarioReal: costo }
      : item));
  };

  const evitarCambioConRueda = (event) => event.currentTarget.blur();

  const editarNumero = (clave, valor, actualizar) => {
    setValoresEnEdicion((prev) => ({ ...prev, [clave]: valor }));
    if (valor !== "" && Number.isFinite(Number(valor))) actualizar(valor);
  };

  const moverCostoRealProducto = (items, productId, cambio) => {
    const clave = `costo-${productId}`;
    const costoGuardado =
      itemsChecklist.find((linea) => linea.id === items[0]?.id)
        ?.costoUnitarioReal;

    const valorEnEdicion = valoresEnEdicion[clave];
    const costoActual =
      valorEnEdicion === undefined || valorEnEdicion === ""
        ? getValidCost(costoGuardado) ?? 0
        : getValidCost(valorEnEdicion) ?? 0;

    const nuevoCosto = Math.max(
      0,
      Math.round((costoActual + cambio) * 100) / 100
    );

    const nuevoValor = String(nuevoCosto);

    setValoresEnEdicion((prev) => ({
      ...prev,
      [clave]: nuevoValor,
    }));

    actualizarCostoRealProducto(items, nuevoCosto);
  };

  const obtenerCantidadSolicitada = (id) =>
    Math.max(
      0,
      Number(row.items.find((item) => item.id === id)?.cantidad || 0)
    );

  const normalizarCantidadEscrita = (valor) => {
    const soloDigitos = String(valor).replace(/\D/g, "");

    if (soloDigitos === "") return "";

    return String(Number(soloDigitos));
  };

  const actualizarCantidadRecibida = (id, valor) => {
    const cantidadNormalizada = normalizarCantidadEscrita(valor);

    setItemsChecklist((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, cantidadRecibida: cantidadNormalizada }
          : item
      )
    );

    if (cantidadNormalizada !== "") {
      setCantidadesPrevias((prev) => ({
        ...prev,
        [id]: cantidadNormalizada,
      }));
    }
  };

  const moverCantidadRecibida = (id, cambio) => {
    const itemActual = itemsChecklist.find((item) => item.id === id);
    const valorActual =
      itemActual?.cantidadRecibida === ""
        ? Number(cantidadesPrevias[id] || 0)
        : Number(itemActual?.cantidadRecibida || 0);

    const nuevaCantidad = Math.max(0, valorActual + cambio);

    const nuevoValor = String(nuevaCantidad);

    setItemsChecklist((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, cantidadRecibida: nuevoValor }
          : item
      )
    );

    if (nuevoValor !== "") {
      setCantidadesPrevias((prev) => ({
        ...prev,
        [id]: nuevoValor,
      }));
    }
  };

  const marcarItemRecibido = (id, recibido) => {
    setItemsMarcados((prev) => ({
      ...prev,
      [id]: recibido,
    }));
  };

  const finalizarEdicionNumero = (clave, valor, actualizar) => {
    if (valor === "") actualizar(0);
    setValoresEnEdicion((prev) => {
      const { [clave]: _, ...resto } = prev;
      return resto;
    });
  };

 const confirmarChecklist = async () => {
  if (confirmacionEnCursoRef.current || subiendoFactura || confirmandoRecepcion) return;
  if (!todosMarcados) {
    window.alert(
      "Debes marcar todos los productos como recibidos antes de confirmar."
    );
    return;
  }

  if (!cantidadesCompletas) {
    window.alert(
      "Debes completar la cantidad de piezas recibidas en todos los productos. El valor 0 sí es válido."
    );
    return;
  }

  if (!costosCompletos) {
    window.alert(
      "Debes completar el costo real por pieza de todos los productos."
    );
    return;
  }

  confirmacionEnCursoRef.current = true;
  try {
    let facturaUrlParaConfirmar = facturaUrl || row.facturaUrl || undefined;

    if (archivoFactura && !facturaUrlParaConfirmar) {
      setSubiendoFactura(true);
      try {
        facturaUrlParaConfirmar = await uploadFileToCloudinary(archivoFactura);
        if (!facturaUrlParaConfirmar) throw new Error("No se pudo subir el archivo de la factura.");

        await onAdjuntarFactura?.(row, { facturaProveedor, facturaUrl: facturaUrlParaConfirmar });
        setFacturaUrl(facturaUrlParaConfirmar);
        setArchivoFactura(null);
      } catch (error) {
        window.alert(error.message || "No se pudo cargar la factura. Inténtalo nuevamente.");
        return;
      } finally {
        setSubiendoFactura(false);
      }
    }

    setConfirmandoRecepcion(true);
    const itemsNormalizados = itemsChecklist.map((item) => ({
      ...item,
      cantidadRecibida: Number(item.cantidadRecibida),
      costoUnitarioReal: getValidCost(item.costoUnitarioReal),
    }));

    try {
      await onConfirmar(row, {
        items: itemsNormalizados,
        facturaProveedor,
        facturaUrl: facturaUrlParaConfirmar,
      });
    } catch (error) {
      window.alert(
        facturaUrlParaConfirmar
          ? "La factura se cargó, pero no fue posible confirmar la recepción."
          : (error.message || "No se pudo confirmar la recepción.")
      );
    }
  } finally {
    setConfirmandoRecepcion(false);
    confirmacionEnCursoRef.current = false;
  }
};

  const guardarFacturaPendiente = async () => {
    if (!archivoFactura || guardandoFacturaPendiente) return;

    setGuardandoFacturaPendiente(true);
    try {
      const facturaUrl = await uploadFileToCloudinary(archivoFactura);
      if (!facturaUrl) throw new Error("No se pudo subir el archivo de la factura.");
      await onAdjuntarFactura?.(row, { facturaProveedor, facturaUrl });
      setArchivoFactura(null);
    } catch (error) {
      window.alert(error.message || "No se pudo adjuntar la factura.");
    } finally {
      setGuardandoFacturaPendiente(false);
    }
  };

  const tituloPersonalizado = (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="px-4 py-1.5 rounded-[2px] text-xs lg:text-sm font-tag uppercase transition-colors bg-[var(--gold-dark)] text-[var(--snow)] dark:bg-[var(--gold-08)] dark:text-[var(--gold-light)]">
        {row.folio}
      </span>
      <Etiquetas contenido={ESTADO_LABELS[row.status] || row.status} />
    </div>
  );

  const footerContenido = (
    <div className="flex w-full flex-row flex-nowrap items-center gap-3">
      {soloLectura && (
        <div className="flex w-full flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {esBorrador && puedeEliminar && (
              <Boton variante="secundario" onClick={() => onEliminar?.(row)} className="border-red-700/30 bg-red-700/10 text-red-700 hover:bg-red-700 hover:text-[var(--snow)] dark:border-rojo/30 dark:bg-rojo/10 dark:text-rojo dark:hover:bg-rojo">
                <i className="bi bi-trash3" /> Eliminar
              </Boton>
            )}
            {esEnviada && puedeCancelar && (
              <button type="button" onClick={() => onCancelar?.(row)} className="rounded-[2px] border border-rojo-dark/60 px-4 py-2 text-xs font-bold text-rojo-dark transition-colors hover:bg-rojo-dark hover:text-[var(--snow)] dark:border-rojo/60 dark:text-rojo dark:hover:bg-rojo">
                <i className="bi bi-slash-circle mr-2" />Cancelar pedido
              </button>
            )}
          </div>
          <div className="flex justify-end gap-3">
            {esBorrador && puedeEnviar && (
              <Boton variante="claro" onClick={() => onEnviar?.(row)} disabled={enviando} className="shrink-0">
                {enviando ? <><span>Enviando</span><i className="bi bi-arrow-repeat animate-spin" /></> : <><i className="bi bi-send" /> Enviado</>}
              </Boton>
            )}
          </div>
        </div>
      )}

      {!soloLectura && esBorrador && (puedeEditar || puedeEliminar) && (
        <div className="flex items-center justify-end gap-6 w-full sm:w-auto">
          <AccionesTabla
            onEliminar={puedeEliminar ? () => onEliminar(row.id) : undefined}
            onEditar={puedeEditar ? () => onEditar(row) : undefined}
          />
        </div>
      )}

      {!soloLectura && esEnviada && puedeConfirmar && (
        <Boton variante="claro" onClick={() => modoChecklist ? confirmarChecklist() : onConfirmar(row)} disabled={subiendoFactura || confirmandoRecepcion || (modoChecklist && !checklistCompleto)} className="order-2 ml-auto shrink-0 px-3 justify-center">
          <i className={`bi ${confirmandoRecepcion || subiendoFactura ? "bi-arrow-repeat animate-spin" : "bi-check-circle"}`} /> {subiendoFactura ? "Subiendo factura..." : confirmandoRecepcion ? "Confirmando recepción..." : "Confirmar recepción"}
        </Boton>
      )}

    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} titulo={tituloPersonalizado} ancho="max-w-3xl" footer={footerContenido}>
      <div className="font-body pt-2">

        {/* Datos generales — encabezado tipo documento */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {[
            { label: "Proveedor", value: row.supplierNombre || "Sin proveedor asignado" },
            ...(row.status !== "BORRADOR" ? [{ label: "Factura proveedor", value: row.facturaProveedor || "—" }] : []),
            { label: "Creado", value: formatDateTime(row.createdAt) },
            { label: "Enviado", value: formatDateTime(row.sentAt) },
            ...(esCancelada ? [{ label: "Cancelada", value: formatDateTime(row.canceledAt) }] : []),
            { label: esConfirmada ? "Confirmado por" : esCancelada ? "Cancelado por" : "Creado por", value: esConfirmada ? `${row.confirmedByNombre || "Admin sistema"} a las ${formatHora(row.confirmedAt)}` : esCancelada ? (row.canceledByNombre || "Admin sistema") : (row.createdBy || "—") },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-[2px] border p-3 bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] shadow-sm">
              <p className={`font-tag text-[10px] uppercase tracking-widest mb-1 ${label === "Enviado" ? "text-green-700 dark:text-verde" : label === "Cancelada" ? "text-red-700 dark:text-rojo" : label === "Confirmado por" ? "text-blue-700 dark:text-blue-400" : "text-[var(--noir-soft)] dark:text-[var(--ash)]"}`}>{label}</p>
              <p className="font-body text-sm font-semibold truncate text-[var(--noir)] dark:text-[var(--snow)]">{value}</p>
            </div>
          ))}
        </div>

        {row.status !== "BORRADOR" && row.facturaUrl && (
          <button type="button" onClick={() => setMostrarFactura(true)} className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-[var(--gold-dark)] hover:underline dark:text-[var(--gold-light)]">
            <i className="bi bi-file-earmark-text" />Ver factura
          </button>
        )}

        {esConfirmada && row.items.some((item) => Number(item.cantidadRecibida ?? item.cantidad) < Number(item.cantidad)) && (
          <div className="mb-6 rounded-[2px] border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-[var(--noir)] dark:text-[var(--snow)]">
            <p className="font-tag font-bold uppercase tracking-wider text-xs mb-2">Productos no recibidos:</p>
            <ul className="space-y-1">
              {row.items
                .filter((item) => Number(item.cantidadRecibida ?? item.cantidad) < Number(item.cantidad))
                .map((item) => {
                  const faltante = Number(item.cantidad) - Number(item.cantidadRecibida ?? item.cantidad);
                  return <li key={item.id || `${item.productId}-${item.talla}`}>{item.productNombre} · {item.talla || "Sin talla"} · Faltan {faltante}</li>;
                })}
            </ul>
          </div>
        )}

        {row.comentarios && (
          <p className="mb-6 text-sm text-[var(--noir-soft)] dark:text-[var(--ash)] italic border-l-4 border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] pl-3">
            "{row.comentarios}"
          </p>
        )}

        {/* Tabla de productos */}
        <div className="mb-6">
          <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            {modoChecklist && esEnviada && (
              <div className="grid w-full grid-cols-2 gap-3 lg:w-[52rem] lg:grid-cols-3">
                <label className="text-xs font-tag font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--gold-light)]">
                  Factura del proveedor
                  <input
                    type="text"
                    value={facturaProveedor}
                    onChange={(event) => setFacturaProveedor(event.target.value)}
                    placeholder="Opcional"
                    className="mt-1 h-10 w-full rounded-[2px] border px-3 text-sm normal-case font-body outline-none bg-[var(--snow)] border-[var(--border-gold-40)] text-[var(--noir)] focus:ring-1 focus:ring-[var(--gold)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:text-[var(--snow)]"
                  />
                </label>
                <label className="text-xs font-tag font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--gold-light)]">
                  Evidencia de factura
                  <input id="evidencia-factura" type="file" accept="image/*,application/pdf" disabled={subiendoFactura || confirmandoRecepcion || Boolean(row.facturaUrl)} onChange={(event) => { setFacturaUrl(""); setArchivoFactura(event.target.files?.[0] || null); }} className="sr-only" />
                  <span className="mt-1 flex h-10 w-full cursor-pointer items-center gap-2 truncate rounded-[2px] border px-3 text-sm normal-case font-body bg-[var(--snow)] border-[var(--border-gold-40)] text-[var(--noir)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:text-[var(--snow)]">
                    <i className="bi bi-paperclip shrink-0 text-[var(--gold-dark)] dark:text-[var(--gold-light)]" />
                    <span className="truncate">{subiendoFactura ? "Subiendo factura..." : facturaUrl ? "Factura cargada correctamente." : archivoFactura?.name || "Elige un archivo"}</span>
                  </span>
                  <span className="mt-1 block text-[10px] normal-case tracking-normal text-[var(--ash)]">Imagen o PDF</span>
                </label>
                <div className="relative col-span-2 lg:col-span-1">
                  <i className="bi bi-search pointer-events-none absolute left-3 top-[2.1rem] -translate-y-1/2 text-sm text-[var(--gold-dark)] dark:text-[var(--gold-light)]" />
                  <input
                    type="search"
                    value={busquedaItems}
                    onChange={(event) => setBusquedaItems(event.target.value)}
                    placeholder="Buscar por producto o SKU..."
                    className="mt-5 h-10 w-full rounded-[2px] border py-2 pl-9 pr-3 text-sm outline-none bg-[var(--snow)] border-[var(--border-gold-40)] text-[var(--noir)] focus:ring-1 focus:ring-[var(--gold)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:text-[var(--snow)]"
                  />
                </div>
              </div>
            )}

            {esConfirmada && !row.facturaUrl && puedeConfirmar && (
              <div className="grid w-full grid-cols-1 gap-3 rounded-[2px] border border-[var(--border-gold-40)] bg-[var(--gold-08)] p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] dark:border-[var(--border-gold-20)]">
                <label className="text-xs font-tag font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--gold-light)]">
                  Factura del proveedor
                  <input type="text" value={facturaProveedor} onChange={(event) => setFacturaProveedor(event.target.value)} placeholder="Opcional" disabled={guardandoFacturaPendiente} className="mt-1 h-10 w-full rounded-[2px] border px-3 text-sm normal-case font-body outline-none disabled:cursor-not-allowed disabled:opacity-60 bg-[var(--snow)] border-[var(--border-gold-40)] text-[var(--noir)] focus:ring-1 focus:ring-[var(--gold)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:text-[var(--snow)]" />
                </label>
                <label className="text-xs font-tag font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--gold-light)]">
                  Evidencia de factura
                  <input id="evidencia-factura-pendiente" type="file" accept="image/*,application/pdf" disabled={guardandoFacturaPendiente} onChange={(event) => setArchivoFactura(event.target.files?.[0] || null)} className="sr-only" />
                  <span className="mt-1 flex h-10 w-full cursor-pointer items-center gap-2 truncate rounded-[2px] border px-3 text-sm normal-case font-body bg-[var(--snow)] border-[var(--border-gold-40)] text-[var(--noir)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:text-[var(--snow)]"><i className="bi bi-paperclip shrink-0" /><span className="truncate">{archivoFactura?.name || "Elige un archivo"}</span></span>
                </label>
                <Boton variante="oscuro" onClick={guardarFacturaPendiente} disabled={!archivoFactura || guardandoFacturaPendiente} className="self-end justify-center whitespace-nowrap">{guardandoFacturaPendiente ? <><i className="bi bi-arrow-repeat animate-spin" /> Guardando...</> : <><i className="bi bi-upload" /> Adjuntar factura</>}</Boton>
              </div>
            )}
          </div>
          <p className="mb-2 text-[11px] font-tag font-bold uppercase tracking-widest text-[var(--gold-dark)] dark:text-[var(--ash)]">
            Productos ({row.items.length})
          </p>
          {soloLectura && (
            <div className="mb-4 overflow-x-auto rounded-[2px] border border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)]">
              <table className="w-full min-w-[680px] text-sm">
                <thead className="bg-[var(--ivory-deep)] dark:bg-[var(--gold-08)]">
                  <tr className="border-b border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)]">
                    <th className="p-3 text-left text-[10px] font-tag uppercase tracking-wider">SKU</th>
                    <th className="w-24 p-2 text-center text-[10px] font-tag uppercase tracking-wider">Cantidad solicitada</th>
                    {!ocultarDatosRecepcion && <th className="w-24 p-2 text-center text-[10px] font-tag uppercase tracking-wider">Piezas recibidas</th>}
                    <th className="p-3 text-center text-[10px] font-tag uppercase tracking-wider">Producto</th>
                    <th className="p-3 text-center text-[10px] font-tag uppercase tracking-wider">Talla</th>
                    {!ocultarDatosRecepcion && <th className="border-l border-[var(--border-gold-25)] p-3 text-center text-[10px] font-tag uppercase tracking-wider dark:border-[var(--border-gold-20)]">Costo por pieza</th>}
                    <th className="border-l border-[var(--border-gold-25)] p-3 text-center text-[10px] font-tag uppercase tracking-wider dark:border-[var(--border-gold-20)]">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {productosAgrupados.flatMap((items) => items.map((item) => (
                    <tr key={item.id} className="border-b border-[var(--border-gold-20)] last:border-b-0">
                      <td className="p-3 font-mono text-xs font-semibold">{item.sku || "—"}</td>
                      <td className="w-24 p-2 text-center font-semibold tabular-nums">{item.cantidad}</td>
                      {!ocultarDatosRecepcion && <td className="w-24 p-2 text-center font-semibold tabular-nums">{esConfirmada ? cantidadRecibida(item) : "N/A"}</td>}
                      <td className="p-3 text-center">{item.productNombre || "—"}</td>
                      <td className="p-3 text-center">{item.talla || "—"}</td>
                      {!ocultarDatosRecepcion && <td className="border-l border-[var(--border-gold-25)] p-3 text-center font-semibold tabular-nums dark:border-[var(--border-gold-20)]">{esConfirmada ? formatMoney(costoUnitarioRecibido(item)) : "N/A"}</td>}
                      <td className="border-l border-[var(--border-gold-25)] p-3 text-center font-semibold tabular-nums dark:border-[var(--border-gold-20)]">{formatMoney(esConfirmada ? costoTotalRecibido(item) : Number(item.costoUnitario || 0) * Number(item.cantidad || 0))}</td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          )}
          {soloLectura && (
            <div className="mb-4 flex justify-start">
              <MenuExportar
                titulo={tituloExportacion}
                columnas={columnasExportacion}
                filas={filasExportacion}
                resumen={esConfirmada ? { total: `Total ${formatMoney(totalCostoRecibido)}` } : undefined}
              />
            </div>
          )}
          {!soloLectura && (
            <div className="flex flex-col gap-4">
              {productosAgrupados.map((items) => {
                const producto = items[0];
                const costoPredeterminado = getValidCost(producto.costoUnitarioReal, producto.costoUnitario, producto.precioCompra);
                const costoReal =
                  itemsChecklist.find((linea) => linea.id === producto.id)
                    ?.costoUnitarioReal ?? costoPredeterminado;
                const piezasRecibidas = items.reduce((total, item) => total + (itemsMarcados[item.id] ? Number(itemsChecklist.find((linea) => linea.id === item.id)?.cantidadRecibida || 0) : 0), 0);
                const subtotal = getValidCost(costoReal) === null ? null : piezasRecibidas * costoReal;

                return <section key={producto.productId} className="rounded-[2px] border bg-[var(--snow)] p-4 shadow-sm border-[var(--border-gold-40)] dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)]">
                  <header className="mb-3 border-b pb-3 border-[var(--border-gold-20)]">
                    <p className="font-mono text-xs font-semibold text-[var(--gold-dark)] dark:text-[var(--gold-light)]">{producto.sku || "—"}</p>
                    <p className="mt-0.5 text-sm font-semibold text-[var(--noir)] dark:text-[var(--snow)]">{producto.productNombre || "—"}</p>
                  </header>
                  <div className="grid grid-cols-[minmax(2.25rem,.55fr)_minmax(4.5rem,1fr)_minmax(7.5rem,1.45fr)_auto] gap-2 border-b pb-2 text-[10px] font-tag font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--ash)] min-[490px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(7.5rem,1.2fr)_auto] min-[490px]:gap-3">
                    <span>Talla</span><span className="text-center">Cantidad solicitada</span><span className="text-center">Piezas recibidas</span><span className="text-center">Recibido</span>
                  </div>
                  <div className="divide-y divide-[var(--border-gold-20)]">
                    {items.map((item) => {
                      const cantidadRecibida =
                        itemsChecklist.find((linea) => linea.id === item.id)
                          ?.cantidadRecibida ?? "";
                      const cantidadNumerica = Number(cantidadRecibida || 0);

                      return (
                        <div
                          key={item.id}
                          className="grid grid-cols-[minmax(2.25rem,.55fr)_minmax(4.5rem,1fr)_minmax(7.5rem,1.45fr)_auto] items-center gap-2 py-2 min-[490px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(7.5rem,1.2fr)_auto] min-[490px]:gap-3"
                        >
                          <div>
                            <p className="text-sm font-bold text-[var(--noir)] dark:text-[var(--snow)]">
                              {item.talla || "—"}
                            </p>
                          </div>

                          <div className="text-center">
                            <p className="text-sm font-bold tabular-nums text-[var(--noir)] dark:text-[var(--snow)]">
                              {item.cantidad}
                            </p>
                          </div>

                          <div>
                            <div className="mx-auto flex h-9 min-w-[7.5rem] w-full max-w-[11rem] items-stretch overflow-hidden rounded-[2px] border border-[var(--border-gold-40)] bg-[var(--snow)] dark:border-[var(--border-gold-20)] dark:bg-[var(--noir-soft)]">
                              <button
                                type="button"
                                onClick={() => moverCantidadRecibida(item.id, -1)}
                                disabled={cantidadNumerica <= 0 && cantidadRecibida !== ""}
                                aria-label={`Restar una pieza recibida de la talla ${item.talla || "sin talla"}`}
                                className="flex w-9 shrink-0 items-center justify-center border-r border-[var(--border-gold-40)] text-lg font-bold text-[var(--gold-dark)] transition-colors hover:bg-[var(--gold-15)] disabled:cursor-not-allowed disabled:opacity-40 dark:border-[var(--border-gold-20)] dark:text-[var(--gold-light)]"
                              >
                                −
                              </button>

                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                autoComplete="off"
                                value={cantidadRecibida}
                                onFocus={(event) => event.currentTarget.select()}
                                onChange={(event) =>
                                  actualizarCantidadRecibida(
                                    item.id,
                                    event.currentTarget.value
                                  )
                                }
                                aria-label={`Piezas recibidas de la talla ${item.talla || "sin talla"}`}
                                className="min-w-0 flex-1 bg-transparent px-2 text-center text-sm font-bold tabular-nums text-[var(--noir)] outline-none dark:text-[var(--snow)]"
                              />

                              <button
                                type="button"
                                onClick={() => moverCantidadRecibida(item.id, 1)}
                                aria-label={`Sumar una pieza recibida de la talla ${item.talla || "sin talla"}`}
                                className="flex w-9 shrink-0 items-center justify-center border-l border-[var(--border-gold-40)] text-lg font-bold text-[var(--gold-dark)] transition-colors hover:bg-[var(--gold-15)] disabled:cursor-not-allowed disabled:opacity-40 dark:border-[var(--border-gold-20)] dark:text-[var(--gold-light)]"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <label className="flex items-center justify-center gap-2 text-[10px] font-tag font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--gold-light)]">
                            <input
                              type="checkbox"
                              checked={Boolean(itemsMarcados[item.id])}
                              onChange={(event) =>
                                marcarItemRecibido(
                                  item.id,
                                  event.currentTarget.checked
                                )
                              }
                              aria-label={`Marcar talla ${item.talla || "sin talla"} como recibida`}
                              className="h-7 w-7 cursor-pointer accent-[var(--gold)]"
                            />
                          </label>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] items-end gap-3 border-t pt-3 border-[var(--border-gold-20)]">
                    <div className="flex items-center gap-2 whitespace-nowrap"><span className="text-[10px] font-tag font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--gold-light)]">Subtotal:</span><span className="text-lg font-bold tabular-nums text-green-700 dark:text-verde">{formatMoney(subtotal)}</span></div>
                    <div className="text-right text-[10px] font-tag font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--gold-light)]">
                      <p className="mb-1 normal-case tracking-normal text-[var(--ash)]">Costo esperado: {formatMoney(costoPredeterminado)}</p>
                      {costoPredeterminado === null && <p className="mb-1 normal-case tracking-normal text-rojo">Este producto no tiene un costo válido. No puede confirmarse la recepción.</p>}
                      <p>Costo real por pieza</p>

                      <div className="mt-1 ml-auto flex h-9 w-full items-stretch overflow-hidden rounded-[2px] border border-[var(--border-gold-40)] bg-[var(--snow)] min-[440px]:w-[13.5rem] dark:border-[var(--border-gold-20)] dark:bg-[var(--noir-soft)]">
                        <button
                          type="button"
                          onClick={() =>
                            moverCostoRealProducto(
                              items,
                              producto.productId,
                              -0.01
                            )
                          }
                          disabled={
                            Number(
                              valoresEnEdicion[`costo-${producto.productId}`] ??
                                costoReal ??
                                0
                            ) <= 0
                          }
                          aria-label={`Disminuir el costo real de ${producto.productNombre || "producto"}`}
                          className="flex w-9 shrink-0 items-center justify-center border-r border-[var(--border-gold-40)] text-lg font-bold text-[var(--gold-dark)] transition-colors hover:bg-[var(--gold-15)] disabled:cursor-not-allowed disabled:opacity-40 dark:border-[var(--border-gold-20)] dark:text-[var(--gold-light)]"
                        >
                          −
                        </button>

                        <div className="relative min-w-0 flex-1">
                          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center font-body text-sm font-semibold text-[var(--noir-soft)] dark:text-[var(--ash)]">
                            $
                          </span>

                          <input
                            type="text"
                            inputMode="decimal"
                            autoComplete="off"
                            value={
                              valoresEnEdicion[`costo-${producto.productId}`] ??
                              costoReal
                            }
                            placeholder={costoPredeterminado === null ? "Costo no disponible" : String(costoPredeterminado)}
                            onFocus={(event) => event.currentTarget.select()}
                            onBlur={(event) => {
                              if (event.target.value !== "") {
                                finalizarEdicionNumero(
                                  `costo-${producto.productId}`,
                                  event.target.value,
                                  (valor) =>
                                    actualizarCostoRealProducto(items, valor)
                                );
                              }
                            }}
                            onChange={(event) => {
                              const valor = event.currentTarget.value;

                              if (
                                valor === "" ||
                                /^\d*(\.\d{0,2})?$/.test(valor)
                              ) {
                                editarNumero(
                                  `costo-${producto.productId}`,
                                  valor,
                                  (numero) =>
                                    actualizarCostoRealProducto(items, numero)
                                );
                              }
                            }}
                            aria-label={`Costo real por pieza de ${producto.productNombre || "producto"}`}
                            className="h-full w-full bg-transparent pl-8 pr-3 text-right text-sm font-body normal-case tabular-nums text-[var(--noir)] outline-none placeholder:text-[var(--ash)] placeholder:opacity-45 dark:text-[var(--snow)]"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            moverCostoRealProducto(
                              items,
                              producto.productId,
                              0.01
                            )
                          }
                          aria-label={`Aumentar el costo real de ${producto.productNombre || "producto"}`}
                          className="flex w-9 shrink-0 items-center justify-center border-l border-[var(--border-gold-40)] text-lg font-bold text-[var(--gold-dark)] transition-colors hover:bg-[var(--gold-15)] dark:border-[var(--border-gold-20)] dark:text-[var(--gold-light)]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </section>;
              })}
            </div>
          )}
          <div className="hidden">
            {itemsVisibles.map((item, i) => {
              const costoReal = item.costoUnitarioReal;
              const columnas = [
                { key: "producto", label: "", value: <><p className="font-mono text-xs font-semibold text-[var(--gold-dark)] dark:text-[var(--gold-light)]">{item.sku || "—"}</p><p className="mt-0.5 truncate text-sm font-semibold text-[var(--noir)] dark:text-[var(--snow)]">{item.productNombre || "—"}</p></>, className: "col-span-2 sm:col-span-3 lg:col-span-1" },
                { key: "talla", label: "Talla", value: item.talla || "—" },
                { key: "cantidad", label: "Cantidad", value: item.cantidad },
                { key: "costo-pedido", label: "Costo pedido", value: formatMoney(item.costoUnitario) },
                { key: "costo-real", label: "Costo real", value: costoReal === null || costoReal === undefined ? "—" : formatMoney(costoReal) },
                { key: "subtotal", label: "Subtotal", value: formatMoney(costoTotalRecibido(item)) },
              ].filter(({ key }) => !["costo-pedido", "costo-real"].includes(key));

              return <div key={i} className="relative rounded-[2px] border bg-[var(--snow)] p-4 shadow-sm border-[var(--border-gold-40)] dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)]">
                {modoChecklist && esEnviada && (
                  <label className="absolute right-4 top-4 flex h-5 w-5 cursor-pointer items-center justify-center" title="Marcar como recibido">
                    <input
                      type="checkbox"
                      checked={Boolean(itemsMarcados[item.id])}
                      onChange={(event) => marcarItemRecibido(item.id, event.target.checked)}
                      aria-label={`Marcar ${item.productNombre || item.sku} como recibido`}
                      className="h-4 w-4 accent-[var(--gold)]"
                    />
                  </label>
                )}
                <div className={`grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-[minmax(0,1.8fr)_0.65fr_0.75fr_0.9fr] ${modoChecklist && esEnviada ? "pr-8" : ""}`}>
                  {columnas.map((columna) => (
                    <div key={columna.key} className={`min-w-0 ${columna.className || ""}`}>
                      {columna.label && <p className="mb-1 text-[10px] font-tag font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--ash)]">{columna.label}</p>}
                      <div className="text-sm font-bold tabular-nums text-[var(--noir)] dark:text-[var(--snow)]">{columna.value}</div>
                    </div>
                  ))}
                </div>

                {modoChecklist && esEnviada && (
                  <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-3 sm:grid-cols-[auto_auto] sm:items-end sm:justify-end border-[var(--border-gold-20)]">
                    <label className="text-[10px] font-tag font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--gold-light)]">
                      Piezas recibidas
                      <input
                        type="number"
                        min="0"
                        max={item.cantidad}
                        value={itemsChecklist.find((linea) => linea.id === item.id)?.cantidadRecibida ?? item.cantidad}
                        onChange={(event) => actualizarCantidadRecibida(item.id, event.target.value)}
                        className="mt-1 h-8 w-full rounded-[2px] border text-center text-sm font-body outline-none sm:w-24 bg-[var(--snow)] border-[var(--border-gold-40)] text-[var(--noir)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:text-[var(--snow)]"
                      />
                    </label>
                    <label className="text-[10px] font-tag font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--gold-light)]">
                      Costo real
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={itemsChecklist.find((linea) => linea.id === item.id)?.costoUnitarioReal ?? item.costoUnitario}
                        onChange={(event) => actualizarCostoReal(item.id, event.target.value)}
                        className="mt-1 h-8 w-full rounded-[2px] border px-1 text-center text-sm font-body outline-none sm:w-28 bg-[var(--snow)] border-[var(--border-gold-40)] text-[var(--noir)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:text-[var(--snow)]"
                      />
                    </label>
                  </div>
                )}
              </div>;
            })}
          </div>
        </div>

        {/* Totales */}
        <div className="rounded-[2px] overflow-hidden border bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)] shadow-sm">
          <div className="grid grid-cols-3">
            {[
              { label: "Productos", value: row.items.length },
              { label: "Piezas", value: row.piezasTotales },
              { label: ocultarDatosRecepcion ? "Total aproximado" : "Total de la recepción", value: esCancelada ? "N/A" : soloLectura ? formatMoney(esConfirmada ? totalCostoRecibido : itemsVisibles.reduce((total, item) => { const subtotal = costoTotalRecibido(item); return subtotal === null || total === null ? null : total + subtotal; }, 0)) : formatMoney(row.total), color: "text-green-700 dark:text-verde font-extrabold" },
            ].map((stat, i) => (
              <div key={i} className={`px-4 py-3 text-center ${i < 2 ? "border-r border-[var(--border-gold-25)] dark:border-[var(--border-gold-20)]" : ""}`}>
                <p className="text-[10px] font-tag font-bold uppercase tracking-wider mb-1 text-[var(--gold-dark)] dark:text-[var(--ash)]">{stat.label}</p>
                <p className={`text-xl lg:text-2xl font-bold ${stat.color || "text-[var(--noir)] dark:text-[var(--snow)]"}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
        {soloLectura && esBorrador && onEditarPedido && (
          <div className="mt-6 flex justify-center">
            <Boton variante="claro" onClick={() => onEditarPedido(row)}>
              <i className="bi bi-pencil-square" /> Editar
            </Boton>
          </div>
        )}

      </div>
      <ModalFactura url={mostrarFactura ? row.facturaUrl : ""} onClose={() => setMostrarFactura(false)} />
    </Modal>
  );
}

function formatDateTime(iso) {
  if (!iso) return "—";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "—";
  return fecha.toLocaleString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatHora(iso) {
  if (!iso) return "—";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "—";
  return fecha.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" }).toLowerCase();
}
