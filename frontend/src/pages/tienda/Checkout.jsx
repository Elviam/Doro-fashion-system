import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import HeaderTienda from "../../components/tienda/HeaderTienda";
import FooterTienda from "../../components/tienda/FooterTienda";
import { useAuth } from "../../hooks/useAuth";
import useTitulo from "../../hooks/useTitulo";

const pasos = ["Envío", "Pago", "Confirmación"];

const generarNumeroPedido = () => `AUR-${(Date.now() % 89999) + 10000}`;

const datosIniciales = {
  nombre: "", email: "", calle: "", cp: "", ciudad: "",
  metodoPago: "tarjeta",
  numTarjeta: "", nombreTarjeta: "", expiracion: "", cvv: "",
};

const inputBase =
  "mt-1.5 w-full bg-[var(--snow)] text-[var(--noir)] border rounded-[2px] px-4 py-3 text-sm font-body outline-none focus:border-[var(--gold)] transition placeholder:text-[var(--noir-soft)] placeholder:opacity-70";

export default function Checkout() {
  useTitulo("Checkout — D'oro");
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const claveCarrito = `carrito_${usuario?.id ?? "guest"}`;
  const [carrito] = useState(
    () => JSON.parse(localStorage.getItem(claveCarrito) ?? "[]")
  );

  const nombreCompleto = usuario ? `${usuario.nombre ?? ""} ${usuario.apellido ?? ""}`.trim() : "";

  const [paso, setPaso]       = useState(1);
  const [datos, setDatos]     = useState({
    ...datosIniciales,
    nombre: nombreCompleto,
    email:  usuario?.email ?? "",
  });
  const [numeroPedido]        = useState(generarNumeroPedido);
  const [enviando, setEnviando]   = useState(false);
  const [errorPago, setErrorPago] = useState("");
  const [erroresEnvio, setErroresEnvio] = useState({});
  const [erroresPago, setErroresPago]   = useState({});

  const setDato = (key, value) => setDatos((d) => ({ ...d, [key]: value }));

  const validarPaso1 = () => {
    const errs = {};
    if (!datos.nombre.trim())              errs.nombre = "El nombre es obligatorio";
    if (!datos.email.trim())               errs.email  = "El email es obligatorio";
    if (!datos.calle.trim())               errs.calle  = "La dirección es obligatoria";
    if (!/^\d{5}$/.test(datos.cp.trim()))  errs.cp     = "El código postal debe ser de 5 dígitos";
    if (!datos.ciudad.trim())              errs.ciudad = "La ciudad es obligatoria";
    setErroresEnvio(errs);
    return Object.keys(errs).length === 0;
  };

  const validarPaso2 = () => {
    if (datos.metodoPago !== "tarjeta") return true;
    const errs = {};
    const num = datos.numTarjeta.replace(/\s/g, "");
    if (!num || !/^\d{16}$/.test(num))          errs.numTarjeta    = "Número de tarjeta inválido (16 dígitos)";
    if (!datos.nombreTarjeta.trim())             errs.nombreTarjeta = "El nombre es obligatorio";
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(datos.expiracion)) {
      errs.expiracion = "Formato inválido (MM/AA)";
    } else {
      const [mes, anio] = datos.expiracion.split("/");
      const exp = new Date(2000 + Number(anio), Number(mes) - 1, 1);
      if (exp < new Date()) errs.expiracion = "La tarjeta está vencida";
    }
    if (!/^\d{3,4}$/.test(datos.cvv))           errs.cvv           = "CVV inválido";
    setErroresPago(errs);
    return Object.keys(errs).length === 0;
  };

  const confirmarPago = async () => {
    if (!validarPaso2()) return;
    setErrorPago("");
    setEnviando(true);
    try {
      await api.post("/ventas", {
        numeroPedido,
        clienteId:  usuario?.id ?? "",
        cliente:    { nombre: datos.nombre, email: datos.email, calle: datos.calle, cp: datos.cp, ciudad: datos.ciudad },
        metodoPago: datos.metodoPago,
        items:      carrito.map((i) => ({
          productoId:     i.producto.id,
          nombre:         i.producto.nombre,
          imagen:         i.producto.imagen || "",
          talla:          i.talla,
          cantidad:       i.cantidad,
          precioUnitario: i.producto.precioVenta,
        })),
        subtotal,
        envio,
        total,
      });
      setPaso(3);
      localStorage.removeItem(claveCarrito);
    } catch (err) {
      setErrorPago(err.message || "No se pudo procesar el pago. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  const irAlSiguientePaso = () => {
    if (paso === 1) {
      if (!validarPaso1()) return;
      setPaso(2);
    } else if (paso === 2) {
      confirmarPago();
    }
  };

  // Solo permite regresar a pasos ya completados, nunca adelantar
  const irAPasoAnterior = (n) => {
    if (n < paso) setPaso(n);
  };

  const subtotal       = carrito.reduce((acc, i) => acc + i.producto.precioVenta * i.cantidad, 0);
  const envio          = subtotal >= 999 || subtotal === 0 ? 0 : 99;
  const total          = subtotal + envio;
  const totalArticulos = carrito.reduce((acc, i) => acc + i.cantidad, 0);

  return (
    <>
      <HeaderTienda />

      <main className="bg-[var(--ivory)] pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-10">

          {/* Stepper — solo permite regresar a pasos completados */}
          <div className="flex items-center gap-2 mb-10">
            {pasos.map((label, i) => {
              const n      = i + 1;
              const activo = n === paso;
              const listo  = n < paso;
              const clicable = listo;
              return (
                <div key={label} className="flex items-center gap-2">
                  <button
                    onClick={() => irAPasoAnterior(n)}
                    disabled={!clicable}
                    className={`font-tag text-[11px] tracking-[0.15em] uppercase font-bold transition-colors bg-transparent border-none p-0 ${
                      clicable ? "cursor-pointer" : "cursor-default"
                    } ${
                      activo
                        ? "text-[var(--gold-dark)]"
                        : listo
                          ? "text-[var(--noir)] hover:text-[var(--gold-dark)]"
                          : "text-[var(--noir-soft)]/50"
                    }`}
                  >
                    {listo && <i className="bi bi-check-circle-fill mr-1" />}
                    {n}. {label}
                  </button>
                  {i < pasos.length - 1 && (
                    <span className="w-8 h-px bg-[var(--border-gold-25)]" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-[1fr_380px] gap-12">

            {/* Columna del formulario */}
            <div>

              {/* Paso 1 — Envío */}
              {paso === 1 && (
                <div>
                  <h1 className="font-display text-2xl sm:text-3xl font-light italic text-[var(--noir)] mb-6">
                    Datos de envío
                  </h1>
                  <div className="flex flex-col gap-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <label className="block">
                        <span className="font-tag text-[10px] tracking-[0.15em] text-[var(--noir-soft)] uppercase font-bold">Nombre completo</span>
                        <input
                          value={datos.nombre}
                          readOnly
                          className={`${inputBase} opacity-70 cursor-not-allowed`}
                        />
                      </label>
                      <label className="block">
                        <span className="font-tag text-[10px] tracking-[0.15em] text-[var(--noir-soft)] uppercase font-bold">Email</span>
                        <input
                          value={datos.email}
                          readOnly
                          className={`${inputBase} opacity-70 cursor-not-allowed`}
                        />
                      </label>
                    </div>

                    <label className="block">
                      <span className="font-tag text-[10px] tracking-[0.15em] text-[var(--noir-soft)] uppercase font-bold">Dirección de envío</span>
                      <input
                        value={datos.calle}
                        onChange={(e) => { setDato("calle", e.target.value); setErroresEnvio((p) => ({ ...p, calle: "" })); }}
                        placeholder="Calle, número y colonia"
                        className={`${inputBase} ${erroresEnvio.calle ? "border-[#b3261e]" : "border-[var(--border-gold-40)]"}`}
                      />
                      {erroresEnvio.calle && <p className="mt-1 font-tag text-[10px] text-[#b3261e]">{erroresEnvio.calle}</p>}
                    </label>

                    <div className="grid grid-cols-2 gap-4">
                      <label className="block">
                        <span className="font-tag text-[10px] tracking-[0.15em] text-[var(--noir-soft)] uppercase font-bold">Código postal</span>
                        <input
                          value={datos.cp}
                          onChange={(e) => { setDato("cp", e.target.value); setErroresEnvio((p) => ({ ...p, cp: "" })); }}
                          placeholder="06010"
                          className={`${inputBase} ${erroresEnvio.cp ? "border-[#b3261e]" : "border-[var(--border-gold-40)]"}`}
                        />
                        {erroresEnvio.cp && <p className="mt-1 font-tag text-[10px] text-[#b3261e]">{erroresEnvio.cp}</p>}
                      </label>
                      <label className="block">
                        <span className="font-tag text-[10px] tracking-[0.15em] text-[var(--noir-soft)] uppercase font-bold">Ciudad</span>
                        <input
                          value={datos.ciudad}
                          onChange={(e) => { setDato("ciudad", e.target.value); setErroresEnvio((p) => ({ ...p, ciudad: "" })); }}
                          placeholder="CDMX"
                          className={`${inputBase} ${erroresEnvio.ciudad ? "border-[#b3261e]" : "border-[var(--border-gold-40)]"}`}
                        />
                        {erroresEnvio.ciudad && <p className="mt-1 font-tag text-[10px] text-[#b3261e]">{erroresEnvio.ciudad}</p>}
                      </label>
                    </div>

                    <div className="mt-4">
                      <button
                        onClick={irAlSiguientePaso}
                        className="bg-[var(--gold)] text-[var(--noir)] font-tag uppercase tracking-[0.12em] font-bold text-[12px] px-8 py-3.5 rounded-[2px] hover:bg-[var(--gold-dark)] transition flex items-center gap-2"
                      >
                        Continuar al pago
                        <i className="bi bi-arrow-right" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Paso 2 — Pago */}
              {paso === 2 && (
                <div>
                  <h1 className="font-display text-2xl sm:text-3xl font-light italic text-[var(--noir)] mb-6">
                    Método de pago
                  </h1>
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { v: "tarjeta", l: "Tarjeta",       i: "bi-credit-card" },
                        { v: "oxxo",    l: "OXXO Pay",      i: "bi-shop"        },
                        { v: "spei",    l: "Transferencia", i: "bi-bank"        },
                      ].map((op) => (
                        <button
                          key={op.v}
                          onClick={() => setDato("metodoPago", op.v)}
                          className={`flex flex-col items-center gap-1.5 py-3 rounded-[2px] border transition ${
                            datos.metodoPago === op.v
                              ? "border-[var(--gold)] bg-[var(--gold-08)] text-[var(--noir)]"
                              : "border-[var(--border-gold-40)] text-[var(--noir-soft)] hover:border-[var(--gold-dark)]/50"
                          }`}
                        >
                          <i className={`bi ${op.i} text-lg`} />
                          <span className="font-tag text-[10px] font-bold">{op.l}</span>
                        </button>
                      ))}
                    </div>

                    {datos.metodoPago === "tarjeta" && (
                      <>
                        <label className="block">
                          <span className="font-tag text-[10px] tracking-[0.15em] text-[var(--noir-soft)] uppercase font-bold">Número de tarjeta</span>
                          <input
                            value={datos.numTarjeta}
                            onChange={(e) => { setDato("numTarjeta", e.target.value); setErroresPago((p) => ({ ...p, numTarjeta: "" })); }}
                            placeholder="4242 4242 4242 4242"
                            maxLength={19}
                            className={`${inputBase} ${erroresPago.numTarjeta ? "border-[#b3261e]" : "border-[var(--border-gold-40)]"}`}
                          />
                          {erroresPago.numTarjeta && <p className="mt-1 font-tag text-[10px] text-[#b3261e]">{erroresPago.numTarjeta}</p>}
                        </label>
                        <label className="block">
                          <span className="font-tag text-[10px] tracking-[0.15em] text-[var(--noir-soft)] uppercase font-bold">Nombre en la tarjeta</span>
                          <input
                            value={datos.nombreTarjeta}
                            onChange={(e) => { setDato("nombreTarjeta", e.target.value); setErroresPago((p) => ({ ...p, nombreTarjeta: "" })); }}
                            placeholder="MARIA GONZALEZ"
                            className={`${inputBase} ${erroresPago.nombreTarjeta ? "border-[#b3261e]" : "border-[var(--border-gold-40)]"}`}
                          />
                          {erroresPago.nombreTarjeta && <p className="mt-1 font-tag text-[10px] text-[#b3261e]">{erroresPago.nombreTarjeta}</p>}
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          <label className="block">
                            <span className="font-tag text-[10px] tracking-[0.15em] text-[var(--noir-soft)] uppercase font-bold">Vencimiento</span>
                            <input
                              value={datos.expiracion}
                              onChange={(e) => { setDato("expiracion", e.target.value); setErroresPago((p) => ({ ...p, expiracion: "" })); }}
                              placeholder="MM/AA"
                              maxLength={5}
                              className={`${inputBase} ${erroresPago.expiracion ? "border-[#b3261e]" : "border-[var(--border-gold-40)]"}`}
                            />
                            {erroresPago.expiracion && <p className="mt-1 font-tag text-[10px] text-[#b3261e]">{erroresPago.expiracion}</p>}
                          </label>
                          <label className="block">
                            <span className="font-tag text-[10px] tracking-[0.15em] text-[var(--noir-soft)] uppercase font-bold">CVV</span>
                            <input
                              value={datos.cvv}
                              onChange={(e) => { setDato("cvv", e.target.value); setErroresPago((p) => ({ ...p, cvv: "" })); }}
                              placeholder="123"
                              maxLength={4}
                              className={`${inputBase} ${erroresPago.cvv ? "border-[#b3261e]" : "border-[var(--border-gold-40)]"}`}
                            />
                            {erroresPago.cvv && <p className="mt-1 font-tag text-[10px] text-[#b3261e]">{erroresPago.cvv}</p>}
                          </label>
                        </div>
                        <p className="flex items-center gap-1.5 font-tag text-[10px] text-[var(--noir-soft)] mt-1">
                          <i className="bi bi-lock-fill text-[var(--gold-dark)]" />
                          Pago cifrado y seguro
                        </p>
                      </>
                    )}

                    {datos.metodoPago === "oxxo" && (
                      <div className="bg-[var(--snow)] border border-[var(--border-gold-25)] rounded-[2px] p-5 text-center">
                        <i className="bi bi-shop text-3xl text-[var(--gold-dark)] mb-2 block" />
                        <p className="font-body text-sm font-bold text-[var(--noir-soft)]">Pago en OXXO</p>
                        <p className="mt-1 font-body text-xs text-[var(--noir-soft)]">
                          Recibirás una ficha con código de barras al confirmar. Tienes 24 hrs para pagar.
                        </p>
                      </div>
                    )}

                    {datos.metodoPago === "spei" && (
                      <div className="bg-[var(--snow)] border border-[var(--border-gold-25)] rounded-[2px] p-5">
                        <p className="font-body text-sm font-bold text-[var(--noir-soft)]">Transferencia SPEI</p>
                        <p className="mt-2 font-body text-xs text-[var(--noir-soft)]">CLABE: <b className="text-[var(--gold-dark)]">012 180 01234567890 1</b></p>
                        <p className="font-body text-xs text-[var(--noir-soft)]">Beneficiario: <b className="text-[var(--gold-dark)]">D'ORO Boutique SA de CV</b></p>
                      </div>
                    )}

                    {errorPago && (
                      <p className="font-tag text-[11px] text-[#b3261e] font-semibold">
                        <i className="bi bi-exclamation-circle me-1" />{errorPago}
                      </p>
                    )}

                    <div className="mt-2">
                      <button
                        onClick={irAlSiguientePaso}
                        disabled={enviando}
                        className="bg-[var(--gold)] text-[var(--noir)] font-tag uppercase tracking-[0.12em] font-bold text-[12px] px-8 py-3.5 rounded-[2px] hover:bg-[var(--gold-dark)] transition flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {enviando
                          ? <><i className="bi bi-arrow-repeat animate-spin" /> Procesando...</>
                          : <>Pagar · ${Number(total).toLocaleString("es-MX")}<i className="bi bi-arrow-right" /></>
                        }
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Paso 3 — Confirmación */}
              {paso === 3 && (
                <div className="py-6">
                  <div
                    className="w-16 h-16 rounded-full bg-[var(--gold)] text-[var(--noir)] flex items-center justify-center text-3xl mb-4"
                    style={{ boxShadow: "0 0 0 8px var(--gold-08)" }}
                  >
                    <i className="bi bi-check-lg" />
                  </div>
                  <p className="font-tag text-[11px] tracking-[0.2em] text-[var(--gold-dark)] uppercase font-bold">¡Pedido confirmado!</p>
                  <h1 className="mt-2 font-display text-3xl font-light italic text-[var(--noir)]">
                    Gracias, {datos.nombre.split(" ")[0] || "amig@"}
                  </h1>
                  <p className="mt-2 font-body text-sm text-[var(--noir-soft)]">
                    Te enviamos los detalles a <b className="text-[var(--gold-dark)]">{datos.email || "tu correo"}</b>
                  </p>
                  <div className="mt-6 inline-flex gap-6 border-t border-b border-[var(--border-gold-25)] py-4">
                    <div>
                      <p className="font-tag text-[9px] text-[var(--noir-soft)] uppercase tracking-widest">Pedido</p>
                      <p className="font-body text-sm font-bold text-[var(--noir)]">{numeroPedido}</p>
                    </div>
                    <div>
                      <p className="font-tag text-[9px] text-[var(--noir-soft)] uppercase tracking-widest">Total</p>
                      <p className="font-body text-sm font-bold text-[var(--gold-dark)]">${Number(total).toLocaleString("es-MX")}</p>
                    </div>
                  </div>
                  <div className="mt-8">
                    <button
                      onClick={() => navigate('/tienda')}
                      className="font-tag uppercase tracking-[0.15em] font-bold text-[11px] px-6 py-3 rounded-[2px] bg-[var(--gold)] text-[var(--noir)] hover:bg-[var(--gold-dark)] transition"
                    >
                      Seguir explorando
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Resumen del pedido — tarjeta oscura, más grande */}
            <aside className="lg:sticky lg:top-24 h-fit">
              <div className="bg-[var(--noir)] rounded-[2px] p-7">
                <p className="font-tag text-[12px] tracking-[0.15em] text-[var(--gold-light)] uppercase font-bold mb-4">
                  Resumen ({totalArticulos} {totalArticulos === 1 ? "artículo" : "artículos"})
                </p>
                <div className="flex flex-col gap-3 max-h-64 overflow-y-auto mb-4">
                  {carrito.map((item) => (
                    <div key={`${item.producto.id}-${item.talla}`} className="flex justify-between items-center gap-2">
                      <div className="min-w-0">
                        <p className="font-body text-sm font-semibold text-[var(--snow)] truncate">{item.producto.nombre}</p>
                        <p className="font-body text-xs text-[var(--ash)]">Talla {item.talla} · x{item.cantidad}</p>
                      </div>
                      <span className="font-body text-sm font-bold text-[var(--gold-light)] tabular-nums shrink-0">
                        ${Number(item.producto.precioVenta * item.cantidad).toLocaleString("es-MX")}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[var(--border-gold-20)] pt-4 flex flex-col gap-2">
                  <div className="flex justify-between font-body text-sm text-[var(--ash)]">
                    <span>Subtotal</span>
                    <b className="text-[var(--snow)] tabular-nums">${Number(subtotal).toLocaleString("es-MX")}</b>
                  </div>
                  <div className="flex justify-between font-body text-sm text-[var(--ash)]">
                    <span>Envío</span>
                    <b className={`tabular-nums ${envio === 0 ? "text-[#16a34a]" : "text-[var(--snow)]"}`}>
                      {envio === 0 ? "GRATIS" : `$${Number(envio).toLocaleString("es-MX")}`}
                    </b>
                  </div>
                  <div className="flex justify-between items-baseline pt-3 border-t border-[var(--border-gold-20)]">
                    <span className="font-body text-base font-semibold text-[var(--snow)]">Total</span>
                    <b className="font-display text-3xl font-bold text-[var(--gold-light)] tabular-nums">
                      ${Number(total).toLocaleString("es-MX")}
                    </b>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <FooterTienda />
    </>
  );
}