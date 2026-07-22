import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { uploadImageToCloudinary } from "../services/cloudinaryClient"; 

import useTitulo from "../hooks/useTitulo";

import Encabezado from "../components/Encabezado";
import Tarjetas from "../components/Tarjetas";
import Etiquetas from "../components/Etiquetas";
import ToolBar from "../components/ToolBar";
import AccionesTabla from "../components/AccionesTabla";
import Paginacion from "../components/Paginacion";
import Tabla from "../components/Tabla";
import ModalProductos from "../components/ModalProductos";
import FormProducto from "../components/FormProductos";
import ModalConfirmacion from "../components/ModalConfirmacion";
import BarraCategorias from "../components/BarraCategorias";

export default function Productos() {
  useTitulo("Productos");
  const navigate = useNavigate();
  
  const [filtro, setFiltro] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [busqueda, setBusqueda] = useState("");
  
  const [productosDB, setProductosDB] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const [isModalVerAbierto, setIsModalVerAbierto] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [isModalFormAbierto, setIsModalFormAbierto] = useState(false);
  const [productoAEditar, setProductoAEditar] = useState(null);

  const [paginaActiva, setPaginaActiva] = useState(1);
  const LIMIT = 10;

  const [modalConf, setModalConf] = useState({
    isOpen: false,
    tipo: "confirmar",
    titulo: "",
    mensaje: "",
    textoConfirmar: "",
    onConfirmar: () => {}
  });

  const opcionesFiltroProductos = [
    { value: "", label: "Todos" },
    { value: "Activo", label: "Activos" },
    { value: "Inactivo", label: "Inactivos" }
  ];

  const opcionesFiltroCategoria = [
  { value: "", label: "Todas" },
  { value: "Playeras", label: "Playeras" },
  { value: "Blusas", label: "Blusas" },
  { value: "Camisas", label: "Camisas" },
  { value: "Suéteres", label: "Suéteres" },
  { value: "Sudaderas", label: "Sudaderas" },
  { value: "Chamarras", label: "Chamarras" },
  { value: "Abrigos", label: "Abrigos" },
  { value: "Vestidos", label: "Vestidos" },
  { value: "Faldas", label: "Faldas" },
  { value: "Shorts", label: "Shorts" },
  { value: "Pantalones", label: "Pantalones" },
  { value: "Accesorios", label: "Accesorios" },
];

  const opcionesFiltroFecha = [
    { value: "", label: "Todas" },
    { value: "hoy", label: "Agregados hoy" },
    { value: "semana", label: "Última semana" },
    { value: "mes", label: "Último mes" },
    { value: "anio", label: "Último año" },
  ];

  const encabezadosProductos = [
    "Imagen","Sku", "Nombre", "Departamento", "Categoría", "Precio MNX", "Estado", "Acciones"
  ];

  const fetchProductos = async (silencioso = false) => {
    try {
      if (!silencioso) setCargando(true); 
      
      const result = await api.get('/products');
      const datosReales = result.items || result.data?.items || (Array.isArray(result) ? result : []);
      setProductosDB(datosReales);
    } catch (error) {
      console.error("Error al cargar los productos:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  useEffect(() => {
    setPaginaActiva(1);
  }, [filtro, filtroCategoria, filtroFecha, busqueda]);

  const cumpleFiltroFecha = (fechaStr, valorFiltro) => {
    if (!valorFiltro) return true;
    if (!fechaStr) return false;

    const fecha = new Date(fechaStr);
    if (isNaN(fecha)) return false;

    const ahora = new Date();

    if (valorFiltro === "hoy") {
      return fecha.toDateString() === ahora.toDateString();
    }

    const limite = new Date(ahora);
    if (valorFiltro === "semana") limite.setDate(limite.getDate() - 7);
    else if (valorFiltro === "mes") limite.setMonth(limite.getMonth() - 1);
    else if (valorFiltro === "anio") limite.setFullYear(limite.getFullYear() - 1);
    else return true;

    return fecha >= limite;
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return "—";
    const fecha = new Date(fechaStr);
    if (isNaN(fecha)) return "—";
    return fecha.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const datosFiltrados = productosDB
    .filter((row) => {
      const estadoString = row.activo !== false ? "Activo" : "Inactivo";
      return filtro === "" || estadoString === filtro;
    })
    .filter((row) => {
      return filtroCategoria === "" || row.categoria === filtroCategoria;
    })
    .filter((row) => cumpleFiltroFecha(row.createdAt, filtroFecha))
    .filter((row) => {
      if (busqueda === "") return true;
      const term = busqueda.toLowerCase();
      const fechaFormateada = formatearFecha(row.createdAt).toLowerCase();
      return (
        row.nombre.toLowerCase().includes(term) ||
        (row.sku && row.sku.toLowerCase().includes(term)) ||
        fechaFormateada.includes(term)
      );
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalProd = productosDB.length;
  const activosProd = productosDB.filter(p => p.activo !== false).length;
  const inactivosProd = productosDB.filter(p => p.activo === false).length;

  const activosPorc = totalProd > 0 ? Math.round((activosProd / totalProd) * 100) : 0;
  const inactivosPorc = totalProd > 0 ? Math.round((inactivosProd / totalProd) * 100) : 0;

  const start = (paginaActiva - 1) * LIMIT;
  const datosPaginados = datosFiltrados.slice(start, start + LIMIT);

  const calcularStockTotal = (inventario) => {
    if (!Array.isArray(inventario)) return 0;
    return inventario.reduce((acc, item) => acc + item.stock, 0);
  };

  const handleVerDetalles = (producto) => {
    setProductoSeleccionado(producto);
    setIsModalVerAbierto(true);
  };

  const handleNuevoProducto = () => {
    setProductoAEditar(null);
    setIsModalFormAbierto(true);
  };

  const handleEditarProducto = (producto) => {
    const productoMapeado = {
      ...producto,
      pCompra: producto.precioCompra, 
      pVenta: producto.precioVenta,
      estado: producto.activo !== false ? "Activo" : "Inactivo",
      stockMinimo: producto.stockMinimo ?? 0,
      stockIdeal: producto.stockIdeal ?? 0,
      stockMaximo: producto.stockMaximo ?? 0,
    };
    setProductoAEditar(productoMapeado);
    setIsModalVerAbierto(false); 
    setIsModalFormAbierto(true);
  };

  const handleGuardarProducto = async (datosFormulario, { irARegistrarInventario = false } = {}) => {
    if (guardando) return;
    try {
      setGuardando(true);

      const archivosNuevos = datosFormulario.imagenes.filter((img) => img instanceof File);
      const urlsExistentes = datosFormulario.imagenes.filter((img) => typeof img === "string");

      const urlsSubidas = await Promise.all(
        archivosNuevos.map((file) => uploadImageToCloudinary(file))
      );

      const imagenesFinal = [...urlsExistentes, ...urlsSubidas];

      const payload = {
        sku: datosFormulario.sku || `SKU-${Date.now().toString().slice(-6)}`, 
        nombre: datosFormulario.nombre,
        departamento: datosFormulario.departamento,
        categoria: datosFormulario.categoria,
        marca: datosFormulario.marca,
        modelo: datosFormulario.modelo,
        descripcion: datosFormulario.descripcion,
        precioCompra: Number(datosFormulario.pCompra),
        precioVenta: Number(datosFormulario.pVenta),
        activo: datosFormulario.estado === "Activo",
        imagenes: imagenesFinal,
        stockMinimo: Number(datosFormulario.stockMinimo),
        stockIdeal: Number(datosFormulario.stockIdeal),
        stockMaximo: Number(datosFormulario.stockMaximo),
        supplierId: datosFormulario.supplierId,
        supplierNombre: datosFormulario.supplierNombre
      };

      // Las tallas y cantidades se administran desde Inventario. Al editar no
      // se deben reenviar ni reemplazar las variantes existentes.
      if (!productoAEditar) {
        payload.inventario = datosFormulario.inventario || [];
      }

      let respuesta;
      if (productoAEditar && productoAEditar.id) {
        respuesta = await api.patch(`/products/${productoAEditar.id}`, payload);
      } else {
        respuesta = await api.post('/products', payload);
      }

      if (irARegistrarInventario) {
        const idProducto = productoAEditar?.id || respuesta?.id || respuesta?.data?.id;
        setIsModalFormAbierto(false);
        navigate(`/inventario?editar=${idProducto}`);
        return;
      }

      setIsModalFormAbierto(false);
      await fetchProductos(true);
      
      setModalConf({
        isOpen: true,
        tipo: "exito",
        titulo: "Operación Exitosa",
        mensaje: "El producto se ha guardado correctamente.",
      });

    } catch (error) {
      console.error("Error:", error);
      
      setModalConf({
        isOpen: true,
        tipo: "confirmar",
        titulo: "Error al guardar",
        mensaje: `No se pudo guardar: ${error.message}`,
        textoConfirmar: "Entendido",
        onConfirmar: () => setModalConf({ isOpen: false })
      });

    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarProducto = (id) => {
    setIsModalVerAbierto(false);

    setModalConf({
      isOpen: true,
      tipo: "eliminar",
      titulo: "Eliminar Producto",
      mensaje: "¿Estás seguro de que deseas eliminar este producto de forma permanente? Esta acción no se puede deshacer.",
      textoConfirmar: "Eliminar",
      onConfirmar: async () => {
        if (eliminando) return;
        try {
          setEliminando(true);
          await api.delete(`/products/${id}`);
          await fetchProductos(true); 
          setModalConf({ isOpen: false }); 
        } catch (error) {
          console.error("Error al eliminar:", error);
          setModalConf({
            isOpen: true,
            tipo: "confirmar",
            titulo: "Error",
            mensaje: error.message || "No se pudo eliminar el producto.",
            textoConfirmar: "Entendido",
            onConfirmar: () => setModalConf({ isOpen: false })
          });
        } finally {
          setEliminando(false);
        }
      }
    });
  };

  const handleCambiarPagina = (page) => {
    const totalPaginas = Math.ceil(datosFiltrados.length / LIMIT);
    if (page === "‹") setPaginaActiva((prev) => Math.max(1, prev - 1));
    else if (page === "›") setPaginaActiva((prev) => Math.min(totalPaginas, prev + 1));
    else setPaginaActiva(Number(page));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Encabezado 
        titulo="Productos" 
        onActualizar={fetchProductos} 
      />

      <div className="flex flex-col lg:flex-row gap-5 mb-7 w-full">
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5 w-full lg:w-[calc(58.333%-10px)]">
    <Tarjetas 
      label="Total productos" 
      value={totalProd} 
      sub="Registrados" 
      icon="bi bi-box-seam" 
      onClick={() => { setFiltro(""); setPaginaActiva(1); }}
      isActive={filtro === ""}
    />
    
    <Tarjetas 
      label="Productos Activos" 
      value={activosProd} 
      sub={`${activosPorc}% del catálogo`} 
      accent="#28B463" 
      icon="bi bi-check-circle" 
      onClick={() => { setFiltro(filtro === "Activo" ? "" : "Activo"); setPaginaActiva(1); }}
      isActive={filtro === "Activo"}
    />
    
    <Tarjetas 
      label="Productos Inactivos" 
      value={inactivosProd} 
      sub={`${inactivosPorc}% del catálogo`} 
      accent="#C0392B" 
      icon="bi bi-x-circle" 
      onClick={() => { setFiltro(filtro === "Inactivo" ? "" : "Inactivo"); setPaginaActiva(1); }}
      isActive={filtro === "Inactivo"}
    />
  </div>

  <div className="w-full lg:w-[calc(41.666%-10px)]">
    <BarraCategorias productosDB={productosDB} />
  </div>
</div>
      <ToolBar 
        filtro={filtro} 
        setFiltro={setFiltro} 
        opcionesFiltro={opcionesFiltroProductos}
        placeholderFiltro="Estado"

        filtro2={filtroCategoria}
        setFiltro2={setFiltroCategoria}
        opcionesFiltro2={opcionesFiltroCategoria}
        placeholderFiltro2="Categoría"

        filtro3={filtroFecha}
        setFiltro3={setFiltroFecha}
        opcionesFiltro3={opcionesFiltroFecha}
        placeholderFiltro3="Fecha"

        busqueda={busqueda} 
        setBusqueda={setBusqueda}
        placeholderBuscar="Buscar por SKU, nombre, fecha..." 
        textoBoton="+ Nuevo Producto"
        accionBoton={handleNuevoProducto}
        layoutCompacto
      />

      <Tabla encabezados={encabezadosProductos} cargando={cargando} entidad="productos">
        {datosPaginados.map((row, i) => {
          const estadoTexto = row.activo !== false ? "Activo" : "Inactivo";
          const sinInventario = calcularStockTotal(row.inventario) === 0;

          return (
            <tr
              key={i}
              onClick={() => handleVerDetalles(row)}
              className="border-b border-gold/10 hover:bg-gold/8 transition-colors cursor-pointer"
            >
              <td className="py-1.5 px-2 text-center">
                <div className="w-12 h-12 mx-auto rounded-[2px] overflow-hidden bg-noir-soft border border-gold/20">
                  {row.imagenes?.[0] ? (
                    <img
                      src={row.imagenes[0]}
                      alt={row.nombre}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <i className="bi bi-image text-ash text-sm" />
                    </div>
                  )}
                </div>
              </td>
              <td className="py-2 px-4 text-center text-sm font-mono text-gold-dark dark:text-gold-light">{row.sku}</td>
              <td className="py-2 px-4 text-center text-sm font-medium">{row.nombre}</td>
              <td className="py-2 px-4 text-center text-xs font-bold uppercase tracking-wider">
                {row.departamento}
              </td>
              <td className="py-2 px-4 text-center">
                <Etiquetas contenido={row.categoria} />
              </td>
              <td className="py-2 px-4 text-center">${row.precioVenta || row.pVenta}</td>
              <td className="py-2 px-4 text-center">
                <Etiquetas contenido={estadoTexto} />
              </td>
              <td
                className="py-2 px-4 align-middle text-center"
                onClick={(e) => e.stopPropagation()}
              >
                <AccionesTabla 
                  onVer={() => handleVerDetalles(row)}
                  onEditar={() => handleEditarProducto(row)}
                  onEliminar={() => handleEliminarProducto(row.id)}
                  onRegistrarStock={sinInventario ? () => navigate(`/inventario?editar=${row.id}`) : undefined}
                />
              </td>
            </tr>
          );
        })}
      </Tabla>
 
      <Paginacion
        paginaActual={paginaActiva}
        totalRegistros={datosFiltrados.length}
        limit={LIMIT}
        onCambiarPagina={handleCambiarPagina}
        exportTitulo="Catálogo de Productos"
        exportColumnas={[
          { header: "SKU",          key: "sku",          width: 15 },
          { header: "Nombre",       key: "nombre",       width: 28 },
          { header: "Departamento", key: "departamento", width: 16 },
          { header: "Categoría",    key: "categoria",    width: 16 },
          { header: "Precio Venta", key: "precio",       width: 14 },
          { header: "Stock Total",  key: "stock",        width: 10 },
          { header: "Estado",       key: "estado",       width: 12 },
          { header: "Fecha Registro", key: "fecha",      width: 16 },
        ]}
        exportFilas={datosFiltrados.map((p) => ({
          sku:          p.sku,
          nombre:       p.nombre,
          departamento: p.departamento,
          categoria:    p.categoria,
          precio:       `$${Number(p.precioVenta || p.pVenta || 0).toLocaleString("es-MX")}`,
          stock:        calcularStockTotal(p.inventario),
          estado:       p.activo !== false ? "Activo" : "Inactivo",
          fecha:        formatearFecha(p.createdAt),
        }))}
      />

    {/* Modales */}
      <ModalProductos 
        isOpen={isModalVerAbierto} 
        onClose={() => setIsModalVerAbierto(false)}
        data={productoSeleccionado} 
        onEdit={() => handleEditarProducto(productoSeleccionado)}
        onDelete={() => handleEliminarProducto(productoSeleccionado.id)}
      />

      {isModalFormAbierto && (
        <>
          {guardando && (
            <div className="fixed inset-0 bg-noir/50 backdrop-blur-sm z-110 flex flex-col items-center justify-center">
              <i className="bi bi-arrow-repeat animate-spin mb-2 text-4xl text-[var(--noir)] dark:text-[var(--gold-light)]"></i>
              <p className="font-bold text-[var(--noir)] dark:text-[var(--gold-light)]">Guardando producto...</p>
            </div>
          )}
          
          <FormProducto 
            isOpen={true}
            data={productoAEditar} 
            onGuardar={handleGuardarProducto}
            onCancelar={() => setIsModalFormAbierto(false)}
            guardando={guardando}
          />
        </>
      )}

      <ModalConfirmacion
        isOpen={modalConf.isOpen}
        tipo={modalConf.tipo}
        titulo={modalConf.titulo}
        mensaje={modalConf.mensaje}
        textoConfirmar={modalConf.textoConfirmar || "Aceptar"}
        onConfirmar={() => {
          if (modalConf.onConfirmar) modalConf.onConfirmar();
          else setModalConf({ ...modalConf, isOpen: false }); 
        }}
        onCancelar={() => setModalConf({ ...modalConf, isOpen: false })}
        cargando={eliminando}
      />

    </div>
  );
}
