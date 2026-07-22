import { useEffect, useState } from "react";
import Modal from "./Modal";
import { api } from "../services/api";

const formatearFecha = (fecha) => fecha
  ? new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(new Date(fecha))
  : "—";

const formatearMonto = (monto) => new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
}).format(Number(monto || 0));

export default function ModalClientes({ cliente, onClose, isOpen = true }) {
  const [compras, setCompras] = useState([]);
  const [cargandoCompras, setCargandoCompras] = useState(false);

  useEffect(() => {
    if (!cliente?.id) {
      setCompras([]);
      return undefined;
    }

    let vigente = true;

    const cargarCompras = async () => {
      setCargandoCompras(true);
      try {
        const data = await api.get(`/ventas?clienteId=${encodeURIComponent(cliente.id)}&limit=50`);
        if (vigente) setCompras(data.items || []);
      } catch (error) {
        console.error("Error cargando historial del cliente:", error);
        if (vigente) setCompras([]);
      } finally {
        if (vigente) setCargandoCompras(false);
      }
    };

    cargarCompras();
    return () => { vigente = false; };
  }, [cliente?.id]);

  if (!cliente) return null;

  // Extraemos las iniciales para el avatar
  const getIniciales = (nombre) => {
    if (!nombre) return "Cl";
    const partes = nombre.trim().split(" ");
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
  };

  // Header
  const tituloPersonalizado = (
    <div>
      <h2 className="text-xl sm:text-2xl font-display font-bold mb-1 uppercase tracking-widest transition-colors text-[var(--noir)] dark:text-[var(--snow)] m-0">
        Detalle de cliente
      </h2>
      <p className="text-xs sm:text-sm lg:text-base text-[var(--noir-soft)] dark:text-[var(--ash)] transition-colors font-body font-normal tracking-normal normal-case">
        Datos de contacto e historial de pedidos.
      </p>
    </div>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      ancho="max-w-4xl"
      titulo={tituloPersonalizado}
    >
      <div className="font-body pt-2 pb-2">
        
        {/* Contenido */}
        <div className="flex flex-col md:flex-row gap-6">
          
          {/* Columna Izquierda: Tarjeta de Perfil y Avatar */}
          <div className="w-full md:w-1/3 rounded-[2px] p-6 flex flex-col items-center justify-center text-center border transition-colors shadow-sm bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)] dark:shadow-none">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4 border-2 transition-colors font-bold text-3xl bg-[var(--gold-08)] border-[var(--border-gold-40)] text-[var(--gold-dark)] dark:bg-[var(--gold-08)] dark:border-[var(--border-gold-20)] dark:text-[var(--gold-light)]">
              {getIniciales(cliente.nombre)}
            </div>
            <h3 className="text-lg lg:text-xl font-display font-bold mb-1 text-[var(--noir)] dark:text-[var(--snow)]">{cliente.nombre || "—"}</h3>
            <p className="text-xs lg:text-sm font-tag uppercase tracking-widest text-[var(--noir-soft)] dark:text-[var(--ash)] mb-4">
              Cliente
            </p>
            <p className="text-xs font-body text-[var(--noir-soft)] dark:text-[var(--ash)]">
              Registrado el {formatearFecha(cliente.createdAt)}
            </p>
          </div>

          {/* Columna Derecha: Datos */}
          <div className="w-full md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="rounded-[2px] p-4 border transition-colors shadow-sm bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)] dark:shadow-none">
              <p className="text-[10px] lg:text-[11px] font-tag uppercase tracking-[0.2em] text-[var(--gold-dark)] dark:text-[var(--ash)] mb-2">RFC</p>
              <p className="text-sm lg:text-base font-semibold truncate text-[var(--noir)] dark:text-[var(--snow)]">{cliente.rfc || "—"}</p>
            </div>

            <div className="rounded-[2px] p-4 border transition-colors shadow-sm bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)] dark:shadow-none">
              <p className="text-[10px] lg:text-[11px] font-tag uppercase tracking-[0.2em] text-[var(--gold-dark)] dark:text-[var(--ash)] mb-2">Teléfono</p>
              <p className="text-sm lg:text-base font-semibold truncate text-[var(--noir)] dark:text-[var(--snow)]">{cliente.telefono || "—"}</p>
            </div>

            <div className="sm:col-span-2 rounded-[2px] p-4 border transition-colors shadow-sm bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)] dark:shadow-none">
              <p className="text-[10px] lg:text-[11px] font-tag uppercase tracking-[0.2em] text-[var(--gold-dark)] dark:text-[var(--ash)] mb-2">Correo Electrónico</p>
              <p className="text-sm lg:text-base font-semibold truncate text-[var(--noir)] dark:text-[var(--snow)]">{cliente.email || "—"}</p>
            </div>

            <div className="sm:col-span-2 rounded-[2px] p-4 border transition-colors shadow-sm bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)] dark:shadow-none">
              <p className="text-[10px] lg:text-[11px] font-tag uppercase tracking-[0.2em] text-[var(--gold-dark)] dark:text-[var(--ash)] mb-2">Dirección</p>
              <p className="text-sm lg:text-base font-semibold text-[var(--noir)] dark:text-[var(--snow)]">{cliente.direccion || "—"}</p>
            </div>

            {cliente.notas && (
              <div className="sm:col-span-2 rounded-[2px] p-4 border transition-colors shadow-sm bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)] dark:shadow-none">
                <p className="text-[10px] lg:text-[11px] font-tag uppercase tracking-[0.2em] text-[var(--gold-dark)] dark:text-[var(--ash)] mb-2">Notas</p>
                <p className="text-sm lg:text-base font-semibold leading-relaxed text-[var(--noir)] dark:text-[var(--snow)]">{cliente.notas}</p>
              </div>
            )}

          </div>
        </div>

        <section className="mt-6 rounded-[2px] p-4 sm:p-5 border transition-colors bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)]">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-[10px] lg:text-[11px] font-tag uppercase tracking-[0.2em] text-[var(--gold-dark)] dark:text-[var(--gold-light)]">Historial de pedidos</p>
              <p className="text-sm text-[var(--noir-soft)] dark:text-[var(--ash)] mt-1">{cliente.totalCompras ?? 0} compra(s) registrada(s)</p>
            </div>
            <span className="text-xs sm:text-sm font-semibold text-[var(--noir-soft)] dark:text-[var(--ash)]">Última: {formatearFecha(cliente.ultimaCompra)}</span>
          </div>

          {cargandoCompras ? (
            <p className="py-5 text-center text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">Cargando historial...</p>
          ) : compras.length === 0 ? (
            <p className="py-5 text-center text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">Este cliente aún no registra compras.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {compras.map((compra) => (
                <div key={compra.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[2px] px-3 py-3 bg-[var(--gold-08)]">
                  <div>
                    <p className="font-semibold text-sm text-[var(--noir)] dark:text-[var(--snow)]">{compra.numeroPedido}</p>
                    <p className="text-xs text-[var(--noir-soft)] dark:text-[var(--ash)]">{formatearFecha(compra.createdAt)} · {compra.items?.length || 0} producto(s)</p>
                  </div>
                  <p className="font-semibold text-sm text-[var(--noir)] dark:text-[var(--snow)]">{formatearMonto(compra.total)}</p>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </Modal>
  );
}
