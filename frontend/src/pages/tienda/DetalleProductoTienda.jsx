import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  cargarProductoTienda,
  obtenerProductoEnCache,
  productoEstaVigente,
} from "../../services/tiendaCache";
import FooterTienda from "../../components/tienda/FooterTienda";
import useTitulo from "../../hooks/useTitulo";
import { useCarrito } from "../../context/CarritoContext";
import { obtenerTallasValidasTienda } from "../../components/tienda/ordenarTallas";

const beneficios = [
  { icono: "bi-truck",        texto: "Envío 24h CDMX" },
  { icono: "bi-arrow-repeat", texto: "30 días de devolución" },
  { icono: "bi-shield-check", texto: "Pago seguro" },
  { icono: "bi-gift",         texto: "Empaque eco" },
];

const paletasPorCategoria = {
  "Playeras":   ["#D6AB34", "#F7F0E6", "#0A0A0A"],
  "Blusas":     ["#E8C468", "#F7F0E6", "#B8923D"],
  "Camisas":    ["#C9A227", "#F7F0E6", "#8A7028"],
  "Suéteres":   ["#B8923D", "#8A7028", "#F7F0E6"],
  "Sudaderas":  ["#8A7028", "#0A0A0A", "#F7F0E6"],
  "Chamarras":  ["#D6AB34", "#B8923D", "#0A0A0A"],
  "Abrigos":    ["#8A7028", "#0A0A0A", "#B8923D"],
  "Vestidos":   ["#E8C468", "#B8923D", "#F7F0E6"],
  "Faldas":     ["#D6AB34", "#E8C468", "#F7F0E6"],
  "Shorts":     ["#C9A227", "#8A7028", "#F7F0E6"],
  "Pantalones": ["#8A7028", "#0A0A0A", "#B8923D"],
  "Calzado":    ["#D6AB34", "#C9A227", "#F7F0E6"],
  "Accesorios": ["#B8923D", "#E8C468", "#F7F0E6"],
};

function GaleriaImagenes({ producto, imagenActiva, setImagenActiva }) {
  const [cargada, setCargada] = useState(false);
  const imagenes = producto.imagenes?.length ? producto.imagenes : [];

  useEffect(() => { setCargada(false); }, [imagenActiva, producto.id]);

  if (imagenes.length === 0) {
    const [c0, c1, c2] = paletasPorCategoria[producto.categoria] || ["#B8923D", "#F7F0E6", "#0A0A0A"];
    return (
      <div
        className="w-full aspect-[3/4] rounded-[2px] flex items-center justify-center overflow-hidden"
        style={{
          background: `radial-gradient(120% 100% at 20% 0%, ${c1}, transparent 55%),
                       radial-gradient(120% 100% at 90% 100%, ${c2}aa, transparent 60%),
                       linear-gradient(140deg, ${c0}, ${c0}cc 60%, ${c2})`,
        }}
      >
        <span className="font-tag text-sm tracking-widest uppercase text-center px-4 text-[rgba(247,240,230,0.6)]">
          {producto.nombre}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 md:items-stretch">
      <style>{`
        @keyframes shimmerGris {
          0%, 100% { background-color: #d4d4d4; }
          50% { background-color: #a8a8a8; }
        }
      `}</style>

      <div
        className="relative w-full md:mx-auto aspect-[3/4] max-h-[calc(100vh-190px)] rounded-[2px] overflow-hidden"
        style={{ maxWidth: "min(100%, calc((100vh - 190px) * 0.75))" }}
      >
        {!cargada && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ animation: "shimmerGris 1.4s ease-in-out infinite" }}
          />
        )}
        <img
          src={imagenes[imagenActiva]}
          alt={producto.nombre}
          onLoad={() => setCargada(true)}
          onError={() => {
            if (imagenActiva < imagenes.length - 1) setImagenActiva(imagenActiva + 1);
            else setCargada(true);
          }}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="relative z-[1] w-full h-full object-cover"
        />
      </div>

      {imagenes.length > 1 && (
        <div className="flex w-full justify-center gap-2 flex-wrap md:justify-start">
          {imagenes.map((url, idx) => (
            <MiniaturaImagen
              key={idx}
              src={url}
              alt={`${producto.nombre} ${idx + 1}`}
              activa={idx === imagenActiva}
              onClick={() => setImagenActiva(idx)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MiniaturaImagen({ src, alt, activa, onClick }) {
  const [cargada, setCargada] = useState(false);

  return (
    <button
      onClick={onClick}
      className="relative w-16 h-16 rounded-[2px] overflow-hidden border-2 transition-all shrink-0"
      style={{
        borderColor: activa ? "var(--gold-dark)" : "var(--border-gold-25)",
        opacity: activa ? 1 : 0.55,
      }}
    >
      {!cargada && (
        <span className="absolute inset-0 z-[2] flex items-center justify-center bg-black/10 pointer-events-none">
          <i className="bi bi-arrow-repeat animate-spin text-lg text-[var(--gold-dark)]" aria-label="Cargando imagen" />
        </span>
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setCargada(true)}
        onError={() => setCargada(true)}
        loading="eager"
        decoding="async"
        className="w-full h-full object-cover"
      />
    </button>
  );
}

export default function DetalleProductoTienda() {
  const { id } = useParams();
  const { agregarAlCarrito } = useCarrito();

  const [producto, setProducto] = useState(() => obtenerProductoEnCache(id));
  const [cargando, setCargando] = useState(() => !obtenerProductoEnCache(id));
  const [error, setError] = useState(false);
  const [imagenActiva, setImagenActiva] = useState(0);
  const [tallaSeleccionada, setTallaSeleccionada] = useState("");
  const [cantidad, setCantidad] = useState(1);

  useTitulo(producto ? producto.nombre : "Producto");

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [id]);

  useEffect(() => {
    let activo = true;
    setError(false);
    const productoEnCache = obtenerProductoEnCache(id);

    const aplicarProducto = (data) => {
      if (data.activo === false) {
        setProducto(null);
        setError(true);
        return;
      }
      setProducto(data);
      setImagenActiva(0);
      const disponibles = obtenerTallasValidasTienda(data).filter((i) => i.stock > 0);
      setTallaSeleccionada(disponibles[0]?.talla || "");
    };

    if (productoEnCache) {
      aplicarProducto(productoEnCache);
      setCargando(false);
      if (productoEstaVigente(id)) return undefined;
    } else {
      setProducto(null);
      setCargando(true);
    }

    cargarProductoTienda(id)
      .then((data) => {
        if (!activo) return;
        aplicarProducto(data);
      })
      .catch(() => { if (activo) setError(true); })
      .finally(() => { if (activo) setCargando(false); });

    return () => { activo = false; };
  }, [id]);

  if (cargando) {
    return (
      <>
        <main className="bg-[var(--ivory)] min-h-[70vh] flex items-center justify-center">
          <p className="flex items-center gap-2 font-body text-sm text-[var(--noir-soft)]">
            <i className="bi bi-arrow-repeat animate-spin text-xl text-[var(--gold-dark)]"></i>
            Cargando producto…
          </p>
        </main>
        <FooterTienda />
      </>
    );
  }

  if (error || !producto) {
    return (
      <>
        <main className="bg-[var(--ivory)] min-h-[70vh] flex flex-col items-center justify-center gap-4 text-center px-4">
          <i className="bi bi-exclamation-triangle text-4xl text-[var(--gold-dark)]"></i>
          <p className="font-body text-[var(--noir)]">No se pudo cargar este producto.</p>
        </main>
        <FooterTienda />
      </>
    );
  }

  const todasLasTallas = obtenerTallasValidasTienda(producto);
  const agotado = todasLasTallas.every((i) => i.stock <= 0);
  const stockTallaActual = todasLasTallas.find((i) => i.talla === tallaSeleccionada)?.stock ?? 0;

  const handleSeleccionarTalla = (talla) => {
    setTallaSeleccionada(talla);
    setCantidad(1);
  };

  const handleAgregar = () => {
    agregarAlCarrito(producto, { talla: tallaSeleccionada, cantidad });
  };

  return (
    <>
      <main className="bg-[var(--ivory)] pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 lg:pt-8">

          <div className="grid md:grid-cols-[minmax(0,0.88fr)_minmax(0,1fr)] gap-8 lg:gap-12 items-start">

            <GaleriaImagenes producto={producto} imagenActiva={imagenActiva} setImagenActiva={setImagenActiva} />

            <div className="flex flex-col">
              <p className="font-tag text-[11px] tracking-[3px] uppercase font-bold text-[var(--gold-dark)]">
                D'ORO · {producto.categoria} · {producto.departamento}
              </p>
              <h1 className="mt-1 font-display text-2xl sm:text-3xl font-light italic text-[var(--noir)] leading-tight">
                {producto.nombre}
              </h1>
              <p className="mt-1 font-body text-xs text-[var(--noir-soft)]">SKU: {producto.sku}</p>

              {producto.descripcion && (
                <p className="mt-4 font-body text-sm leading-relaxed text-[var(--noir-soft)]">
                  {producto.descripcion}
                </p>
              )}

              <p className="mt-4 font-body text-2xl md:text-3xl font-extrabold tabular-nums text-[var(--gold-dark)]">
                ${Number(producto.precioVenta).toLocaleString("es-MX")}
              </p>

              {/* Selector de talla */}
              {todasLasTallas.length > 0 && (
                <div className="mt-6">
                  <p className="font-tag text-[11px] tracking-[2px] uppercase font-bold text-[var(--noir-soft)] mb-2">
                    Talla
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {todasLasTallas.map((item) => {
                      const sinStock = item.stock === 0;
                      const seleccionada = tallaSeleccionada === item.talla;
                      return (
                        <button
                          key={item.talla}
                          onClick={() => !sinStock && handleSeleccionarTalla(item.talla)}
                          disabled={sinStock}
                          title={sinStock ? "Sin stock" : undefined}
                          className="relative min-w-[44px] h-10 px-3 rounded-[2px] text-sm font-bold border-2 transition-all"
                          style={{
                            borderColor: sinStock ? "var(--border-gold-25)" : seleccionada ? "var(--gold)" : "var(--border-gold-40)",
                            background: seleccionada && !sinStock ? "var(--gold)" : "transparent",
                            color: sinStock ? "var(--noir-soft)" : seleccionada ? "var(--noir)" : "var(--noir)",
                            opacity: sinStock ? 0.35 : 1,
                            cursor: sinStock ? "not-allowed" : "pointer",
                          }}
                        >
                          {item.talla}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Cantidad */}
              {!agotado && (
                <div className="mt-5 flex items-center gap-3">
                  <p className="font-tag text-[11px] tracking-[2px] uppercase font-bold text-[var(--noir-soft)]">
                    Cantidad
                  </p>
                  <div className="flex items-center rounded-[2px] border border-[var(--border-gold-40)]">
                    <button
                      onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                      className="w-10 h-10 text-[var(--gold-dark)] transition-colors"
                    >
                      <i className="bi bi-dash text-lg"></i>
                    </button>
                    <span className="w-10 text-center text-base font-bold tabular-nums text-[var(--noir)]">
                      {cantidad}
                    </span>
                    <button
                      onClick={() => setCantidad((c) => Math.min(c + 1, stockTallaActual))}
                      disabled={cantidad >= stockTallaActual}
                      className="w-10 h-10 text-[var(--gold-dark)] transition-colors disabled:opacity-30"
                    >
                      <i className="bi bi-plus text-lg"></i>
                    </button>
                  </div>
                </div>
              )}

              {/* Agregar al carrito */}
              <button
                onClick={handleAgregar}
                disabled={agotado}
                className="mt-6 w-full bg-[var(--gold)] text-[var(--noir)] font-tag uppercase tracking-[0.12em] font-bold text-[12px] py-3.5 rounded-[2px] hover:bg-[var(--gold-dark)] transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <i className="bi bi-bag-plus"></i>
                {agotado ? "Agotado" : "Agregar a la bolsa"}
              </button>

              {/* Beneficios */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {beneficios.map((b) => (
                  <div key={b.texto} className="flex items-center gap-2 font-body text-xs text-[var(--noir-soft)]">
                    <i className={`bi ${b.icono} text-[var(--gold-dark)]`}></i>
                    {b.texto}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <FooterTienda />
    </>
  );
}
