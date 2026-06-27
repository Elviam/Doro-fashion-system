import { useState, useEffect } from "react";
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
  
  const [filtro, setFiltro] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [busqueda, setBusqueda] = useState("");
  
  // Estados para la Base de Datos
  const [productosDB, setProductosDB] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Estados para Modales
  const [isModalVerAbierto, setIsModalVerAbierto] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [isModalFormAbierto, setIsModalFormAbierto] = useState(false);
  const [productoAEditar, setProductoAEditar] = useState(null);

  // Estados para la paginación
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
  { value: "Calzado", label: "Calzado" },
  { value: "Accesorios", label: "Accesorios" },
];

  const encabezadosProductos = [
    "Sku", "Nombre", "Departamento", "Categoría", "Precio", "Stock", "Estado", "Acciones"
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
  }, [filtro, filtroCategoria, busqueda]);

  const datosFiltrados = productosDB
    .filter((row) => {
      const estadoString = row.activo !== false ? "Activo" : "Inactivo";
      return filtro === "" || estadoString === filtro;
    })
    .filter((row) => {
      return filtroCategoria === "" || row.categoria === filtroCategoria;
    })
    .filter((row) => (
      busqueda === "" || 
      row.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
      (row.sku && row.sku.toLowerCase().includes(busqueda.toLowerCase()))
    ));

  const totalProd = productosDB.length;
  const activosProd = productosDB.filter(p => p.activo !== false).length;
  const inactivosProd = productosDB.filter(p => p.activo === false).length;

  // Cálculo de los porcentajes para las tarjetas superiores
  const activosPorc = totalProd > 0 ? Math.round((activosProd / totalProd) * 100) : 0;
  const inactivosPorc = totalProd > 0 ? Math.round((inactivosProd / totalProd) * 100) : 0;

   // Cálculos matemáticos para la paginación
  const start = (paginaActiva - 1) * LIMIT;
  const datosPaginados = datosFiltrados.slice(start, start + LIMIT);

  const textoRango = datosFiltrados.length === 0 
    ? "0" 
    : `${start + 1} – ${Math.min(paginaActiva * LIMIT, datosFiltrados.length)}`;

  const calcularStockTotal = (inventario) => {
    if (!Array.isArray(inventario)) return 0;
    return inventario.reduce((acc, item) => acc + item.stock, 0);
  };

  const getColorStock = (stock) => {
    if (stock <= 10) return "text-rojo";       
    if (stock <= 30) return "text-amarillo";  
    return "text-verde";                      
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
      estado: producto.activo !== false ? "Activo" : "Inactivo"
    };
    setProductoAEditar(productoMapeado);
    setIsModalVerAbierto(false); 
    setIsModalFormAbierto(true);
  };

  const handleGuardarProducto = async (datosFormulario) => {
    if (guardando) return;
    try {
      setGuardando(true);
      let imageUrl = datosFormulario.imagen;

      if (datosFormulario.imagen instanceof File) {
        imageUrl = await uploadImageToCloudinary(datosFormulario.imagen);
      }

      const stockCalculado = calcularStockTotal(datosFormulario.inventario);

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
        stock: stockCalculado, 
        activo: datosFormulario.estado === "Activo",
        inventario: datosFormulario.inventario,
        imagen: imageUrl,
        stockMinimo: Number(datosFormulario.stockMinimo),
        unidad: datosFormulario.unidad,
        supplierId: datosFormulario.supplierId,
        supplierNombre: datosFormulario.supplierNombre
      };

      if (productoAEditar && productoAEditar.id) {
        await api.patch(`/products/${productoAEditar.id}`, payload);
      } else {
        await api.post('/products', payload);
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
        try {
          await api.delete(`/products/${id}`);
          await fetchProductos(true); 
          setModalConf({ isOpen: false }); 
        } catch (error) {
          console.error("Error al eliminar:", error);
          setModalConf({
            isOpen: true,
            tipo: "confirmar",
            titulo: "Error",
            mensaje: "No se pudo eliminar el producto.",
            textoConfirmar: "Entendido",
            onConfirmar: () => setModalConf({ isOpen: false })
          });
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

      <div className="flex flex-col xl:flex-row gap-6 mb-8 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full xl:w-7/12">
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

        <BarraCategorias productosDB={productosDB} />
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

        busqueda={busqueda} 
        setBusqueda={setBusqueda}
        placeholderBuscar="Buscar por SKU, nombre..." 
        textoBoton="+ Producto"
        accionBoton={handleNuevoProducto}
      />

      {cargando ? (
        <div className="p-20 text-center  italic">Cargando catálogo...</div>
      ) : (
        <Tabla encabezados={encabezadosProductos}>
          {datosPaginados.map((row, i) => {
            const stockTotal = calcularStockTotal(row.inventario);
            const estadoTexto = row.activo !== false ? "Activo" : "Inactivo";
            
            return (
              <tr key={i} className="border-b hover:bg-lila/30 dark:hover:bg-oscuro/40 transition-colors ">
                <td className="p-4 text-center text-sm font-mono">{row.sku}</td>
                <td className="p-4 text-center text-sm font-medium ">{row.nombre}</td>
                <td className="p-4 text-center text-xs font-bold  uppercase tracking-wider">
                  {row.departamento}
                </td>
                <td className="p-4 text-center">
                  <Etiquetas contenido={row.categoria} />
                </td>
                <td className="p-4 text-center">${row.precioVenta || row.pVenta}</td>
                <td className={`p-4 text-center text-sm font-bold ${getColorStock(stockTotal)}`}>
                  {stockTotal}
                </td>
                <td className="p-4 text-center">
                  <Etiquetas contenido={estadoTexto} />
                </td>
                <td className="p-4 align-middle text-center">
                  <AccionesTabla 
                    onVer={() => handleVerDetalles(row)}
                    onEditar={() => handleEditarProducto(row)}
                    onEliminar={() => handleEliminarProducto(row.id)}
                  />
                </td>
              </tr>
            );
          })}
        </Tabla>
      )}
 
      <Paginacion
        paginaActual={paginaActiva}
        totalRegistros={datosFiltrados.length}
        rangoSiguiente={textoRango}
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
        ]}
        exportFilas={datosFiltrados.map((p) => ({
          sku:          p.sku,
          nombre:       p.nombre,
          departamento: p.departamento,
          categoria:    p.categoria,
          precio:       `$${Number(p.precioVenta || p.pVenta || 0).toLocaleString("es-MX")}`,
          stock:        calcularStockTotal(p.inventario),
          estado:       p.activo !== false ? "Activo" : "Inactivo",
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
            <div className="fixed inset-0 bg-oscuro/50 backdrop-blur-sm z-110 flex flex-col items-center justify-center">
              <i className="bi bi-arrow-repeat animate-spin text-4xl text-lila mb-2"></i>
              <p className="text-blanco font-bold">Guardando producto...</p>
            </div>
          )}
          
          <FormProducto 
            isOpen={true} // Siempre en true porque lo controla el condicional de arriba
            data={productoAEditar} 
            onGuardar={handleGuardarProducto}
            onCancelar={() => setIsModalFormAbierto(false)}
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
      />

    </div>
  );
}