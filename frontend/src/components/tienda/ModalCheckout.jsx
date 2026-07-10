import { useState } from "react";
import { api } from "../../services/api";

const pasos = ["Envío", "Pago", "Confirmación"];

const generarNumeroPedido = () => `AUR-${(Date.now() % 89999) + 10000}`;

const datosIniciales = {
  nombre: "", email: "", calle: "", cp: "", ciudad: "",
  metodoPago: "tarjeta",
  numTarjeta: "", nombreTarjeta: "", expiracion: "", cvv: "",
};

export default function ModalCheckout({ onCerrar, carrito, onPedidoConfirmado, usuario }) {
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
    } catch (err) {
      setErrorPago(err.message || "No se pudo procesar el pago. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  const subtotal       = carrito.reduce((acc, i) => acc + i.producto.precioVenta * i.cantidad, 0);
  const envio          = subtotal >= 999 || subtotal === 0 ? 0 : 99;
  const total          = subtotal + envio;
  const totalArticulos = carrito.reduce((acc, i) => acc + i.cantidad, 0);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onCerrar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-[var(--snow)] dark:bg-[var(--noir-soft)] border border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] rounded-[2px] shadow-2xl"
      >
        {/* Encabezado */}
        <div className="px-4 sm:px-7 pt-6 pb-3 border-b border-[var(--border-gold-25)] flex items-center justify-between">
          <div>
            <p className="font-tag text-[11px] tracking-[3px] text-[var(--gold-dark)] dark:text-[var(--gold-light)] uppercase font-bold">Checkout</p>
            <h2 className="mt-0.5 font-display text-xl sm:text-2xl font-semibold text-[var(--noir)] dark:text-[var(--snow)]">Confirma tu pedido</h2>
          </div>
          <button
            onClick={onCerrar}
            className="w-10 h-10 rounded-full bg-[var(--gold-08)] text-[var(--gold-dark)] dark:text-[var(--gold-light)] hover:bg-[var(--gold)]/20 flex items-center justify-center transition"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-4 sm:px-7 py-5 flex items-center gap-3">
          {pasos.map((label, i) => {
            const n      = i + 1;
            const activo = n === paso;
            const listo  = n < paso;
            return (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-tag font-bold shrink-0 ${
                    listo
                      ? "bg-[var(--gold-dark)] text-[var(--snow)]"
                      : activo
                        ? "bg-[var(--gold)] text-[var(--noir)]"
                        : "bg-[var(--gold-08)] text-[var(--noir-soft)] dark:text-[var(--ash)]"
                  }`}>
                    {listo ? <i className="bi bi-check" /> : n}
                  </span>
                  <span className={`font-tag text-sm font-semibold whitespace-nowrap ${
                    activo || listo
                      ? "text-[var(--noir)] dark:text-[var(--snow)]"
                      : "text-[var(--noir-soft)] dark:text-[var(--ash)]"
                  }`}>
                    {label}
                  </span>
                </div>
                {i < pasos.length - 1 && (
                  <div className={`flex-1 h-px mx-2 ${listo ? "bg-[var(--gold)]" : "bg-[var(--border-gold-25)]"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Contenido */}
        <div className="grid md:grid-cols-[1fr_300px] gap-6 px-4 sm:px-7 pb-7">

          {/* Formulario */}
          <div>

            {/* Paso 1 — Envío */}
            {paso === 1 && (
              <div className="flex flex-col gap-3">
                <label className="block">
                  <span className="font-tag text-[11px] tracking-[2px] text-[var(--noir-soft)] dark:text-[var(--ash)] uppercase font-bold">Nombre completo</span>
                  <input
                    value={datos.nombre}
                    readOnly
                    className="mt-1.5 w-full bg-[var(--gold-08)] text-[var(--noir-soft)] dark:text-[var(--ash)] border border-[var(--border-gold-25)] rounded-[2px] px-4 py-3 text-sm font-body cursor-not-allowed"
                  />
                </label>
                <label className="block">
                  <span className="font-tag text-[11px] tracking-[2px] text-[var(--noir-soft)] dark:text-[var(--ash)] uppercase font-bold">Email</span>
                  <input
                    value={datos.email}
                    readOnly
                    className="mt-1.5 w-full bg-[var(--gold-08)] text-[var(--noir-soft)] dark:text-[var(--ash)] border border-[var(--border-gold-25)] rounded-[2px] px-4 py-3 text-sm font-body cursor-not-allowed"
                  />
                </label>
                <label className="block">
                  <span className="font-tag text-[11px] tracking-[2px] text-[var(--noir-soft)] dark:text-[var(--ash)] uppercase font-bold">Dirección de envío</span>
                  <input
                    value={datos.calle}
                    onChange={(e) => { setDato("calle", e.target.value); setErroresEnvio((p) => ({ ...p, calle: "" })); }}
                    placeholder="Calle, número y colonia"
                    className={`mt-1.5 w-full bg-[var(--snow)] dark:bg-[var(--noir)] text-[var(--noir)] dark:text-[var(--snow)] border rounded-[2px] px-4 py-3 text-sm font-body outline-none focus:border-[var(--gold)] hover:border-[var(--gold-dark)]/50 transition placeholder:text-[var(--noir-soft)]/40 ${erroresEnvio.calle ? "border-[#e57373]" : "border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)]"}`}
                  />
                  {erroresEnvio.calle && <p className="mt-1 font-tag text-xs text-[#e57373]">{erroresEnvio.calle}</p>}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="font-tag text-[11px] tracking-[2px] text-[var(--noir-soft)] dark:text-[var(--ash)] uppercase font-bold">Código postal</span>
                    <input
                      value={datos.cp}
                      onChange={(e) => { setDato("cp", e.target.value); setErroresEnvio((p) => ({ ...p, cp: "" })); }}
                      placeholder="06010"
                      className={`mt-1.5 w-full bg-[var(--snow)] dark:bg-[var(--noir)] text-[var(--noir)] dark:text-[var(--snow)] border rounded-[2px] px-4 py-3 text-sm font-body outline-none focus:border-[var(--gold)] hover:border-[var(--gold-dark)]/50 transition placeholder:text-[var(--noir-soft)]/40 ${erroresEnvio.cp ? "border-[#e57373]" : "border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)]"}`}
                    />
                    {erroresEnvio.cp && <p className="mt-1 font-tag text-xs text-[#e57373]">{erroresEnvio.cp}</p>}
                  </label>
                  <label className="block">
                    <span className="font-tag text-[11px] tracking-[2px] text-[var(--noir-soft)] dark:text-[var(--ash)] uppercase font-bold">Ciudad</span>
                    <input
                      value={datos.ciudad}
                      onChange={(e) => { setDato("ciudad", e.target.value); setErroresEnvio((p) => ({ ...p, ciudad: "" })); }}
                      placeholder="CDMX"
                      className={`mt-1.5 w-full bg-[var(--snow)] dark:bg-[var(--noir)] text-[var(--noir)] dark:text-[var(--snow)] border rounded-[2px] px-4 py-3 text-sm font-body outline-none focus:border-[var(--gold)] hover:border-[var(--gold-dark)]/50 transition placeholder:text-[var(--noir-soft)]/40 ${erroresEnvio.ciudad ? "border-[#e57373]" : "border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)]"}`}
                    />
                    {erroresEnvio.ciudad && <p className="mt-1 font-tag text-xs text-[#e57373]">{erroresEnvio.ciudad}</p>}
                  </label>
                </div>
              </div>
            )}

            {/* Paso 2 — Pago */}
            {paso === 2 && (
              <div className="flex flex-col gap-3">
                <div>
                  <span className="font-tag text-[11px] tracking-[2px] text-[var(--noir-soft)] dark:text-[var(--ash)] uppercase font-bold">Método de pago</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1.5">
                    {[
                      { v: "tarjeta", l: "Tarjeta",      i: "bi-credit-card" },
                      { v: "oxxo",    l: "OXXO Pay",     i: "bi-shop"        },
                      { v: "spei",    l: "Transferencia", i: "bi-bank"        },
                    ].map((op) => (
                      <button
                        key={op.v}
                        onClick={() => setDato("metodoPago", op.v)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-[2px] border transition ${
                          datos.metodoPago === op.v
                            ? "border-[var(--gold)] bg-[var(--gold-08)] text-[var(--noir)] dark:text-[var(--snow)]"
                            : "border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] text-[var(--noir-soft)] dark:text-[var(--ash)] hover:border-[var(--gold-dark)]/50"
                        }`}
                      >
                        <i className={`bi ${op.i} text-xl`} />
                        <span className="font-tag text-xs font-bold">{op.l}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {datos.metodoPago === "tarjeta" && (
                  <>
                    <label className="block">
                      <span className="font-tag text-[11px] tracking-[2px] text-[var(--noir-soft)] dark:text-[var(--ash)] uppercase font-bold">Número de tarjeta</span>
                      <input
                        value={datos.numTarjeta}
                        onChange={(e) => { setDato("numTarjeta", e.target.value); setErroresPago((p) => ({ ...p, numTarjeta: "" })); }}
                        placeholder="4242 4242 4242 4242"
                        maxLength={19}
                        className={`mt-1.5 w-full bg-[var(--snow)] dark:bg-[var(--noir)] text-[var(--noir)] dark:text-[var(--snow)] border rounded-[2px] px-4 py-3 text-sm font-body outline-none focus:border-[var(--gold)] hover:border-[var(--gold-dark)]/50 transition placeholder:text-[var(--noir-soft)]/40 ${erroresPago.numTarjeta ? "border-[#e57373]" : "border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)]"}`}
                      />
                      {erroresPago.numTarjeta && <p className="mt-1 font-tag text-xs text-[#e57373]">{erroresPago.numTarjeta}</p>}
                    </label>
                    <label className="block">
                      <span className="font-tag text-[11px] tracking-[2px] text-[var(--noir-soft)] dark:text-[var(--ash)] uppercase font-bold">Nombre en la tarjeta</span>
                      <input
                        value={datos.nombreTarjeta}
                        onChange={(e) => { setDato("nombreTarjeta", e.target.value); setErroresPago((p) => ({ ...p, nombreTarjeta: "" })); }}
                        placeholder="MARIA GONZALEZ"
                        className={`mt-1.5 w-full bg-[var(--snow)] dark:bg-[var(--noir)] text-[var(--noir)] dark:text-[var(--snow)] border rounded-[2px] px-4 py-3 text-sm font-body outline-none focus:border-[var(--gold)] hover:border-[var(--gold-dark)]/50 transition placeholder:text-[var(--noir-soft)]/40 ${erroresPago.nombreTarjeta ? "border-[#e57373]" : "border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)]"}`}
                      />
                      {erroresPago.nombreTarjeta && <p className="mt-1 font-tag text-xs text-[#e57373]">{erroresPago.nombreTarjeta}</p>}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="block">
                        <span className="font-tag text-[11px] tracking-[2px] text-[var(--noir-soft)] dark:text-[var(--ash)] uppercase font-bold">Vencimiento</span>
                        <input
                          value={datos.expiracion}
                          onChange={(e) => { setDato("expiracion", e.target.value); setErroresPago((p) => ({ ...p, expiracion: "" })); }}
                          placeholder="MM/AA"
                          maxLength={5}
                          className={`mt-1.5 w-full bg-[var(--snow)] dark:bg-[var(--noir)] text-[var(--noir)] dark:text-[var(--snow)] border rounded-[2px] px-4 py-3 text-sm font-body outline-none focus:border-[var(--gold)] hover:border-[var(--gold-dark)]/50 transition placeholder:text-[var(--noir-soft)]/40 ${erroresPago.expiracion ? "border-[#e57373]" : "border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)]"}`}
                        />
                        {erroresPago.expiracion && <p className="mt-1 font-tag text-xs text-[#e57373]">{erroresPago.expiracion}</p>}
                      </label>
                      <label className="block">
                        <span className="font-tag text-[11px] tracking-[2px] text-[var(--noir-soft)] dark:text-[var(--ash)] uppercase font-bold">CVV</span>
                        <input
                          value={datos.cvv}
                          onChange={(e) => { setDato("cvv", e.target.value); setErroresPago((p) => ({ ...p, cvv: "" })); }}
                          placeholder="123"
                          maxLength={4}
                          className={`mt-1.5 w-full bg-[var(--snow)] dark:bg-[var(--noir)] text-[var(--noir)] dark:text-[var(--snow)] border rounded-[2px] px-4 py-3 text-sm font-body outline-none focus:border-[var(--gold)] hover:border-[var(--gold-dark)]/50 transition placeholder:text-[var(--noir-soft)]/40 ${erroresPago.cvv ? "border-[#e57373]" : "border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)]"}`}
                        />
                        {erroresPago.cvv && <p className="mt-1 font-tag text-xs text-[#e57373]">{erroresPago.cvv}</p>}
                      </label>
                    </div>
                  </>
                )}

                {datos.metodoPago === "oxxo" && (
                  <div className="bg-[var(--gold-08)] border border-[var(--border-gold-25)] rounded-[2px] p-5 text-center">
                    <i className="bi bi-shop text-4xl text-[var(--gold-dark)] dark:text-[var(--gold-light)] mb-2 block" />
                    <p className="font-body text-sm font-bold text-[var(--noir)] dark:text-[var(--snow)]">Pago en OXXO</p>
                    <p className="mt-1 font-body text-xs text-[var(--noir-soft)] dark:text-[var(--ash)]">
                      Recibirás una ficha con código de barras al confirmar. Tienes 24 hrs para pagar.
                    </p>
                  </div>
                )}

                {datos.metodoPago === "spei" && (
                  <div className="bg-[var(--gold-08)] border border-[var(--border-gold-25)] rounded-[2px] p-5">
                    <p className="font-body text-sm font-bold text-[var(--noir)] dark:text-[var(--snow)]">Transferencia SPEI</p>
                    <p className="mt-2 font-body text-xs text-[var(--noir-soft)] dark:text-[var(--ash)]">CLABE: <b className="text-[var(--gold-dark)] dark:text-[var(--gold-light)]">012 180 01234567890 1</b></p>
                    <p className="font-body text-xs text-[var(--noir-soft)] dark:text-[var(--ash)]">Beneficiario: <b className="text-[var(--gold-dark)] dark:text-[var(--gold-light)]">D'ORO Boutique SA de CV</b></p>
                  </div>
                )}
              </div>
            )}

            {/* Paso 3 — Confirmación */}
            {paso === 3 && (
              <div className="text-center py-6">
                <div
                  className="w-20 h-20 mx-auto rounded-full bg-[var(--gold)] text-[var(--noir)] flex items-center justify-center text-4xl mb-3"
                  style={{ boxShadow: "0 0 0 8px var(--gold-08), 0 0 30px rgba(201,168,76,0.35)" }}
                >
                  <i className="bi bi-check-lg" />
                </div>
                <p className="font-tag text-[11px] tracking-[3px] text-[var(--gold-dark)] dark:text-[var(--gold-light)] uppercase font-bold">¡Pedido confirmado!</p>
                <p className="mt-2 font-display text-2xl font-semibold text-[var(--noir)] dark:text-[var(--snow)]">
                  Gracias, {datos.nombre.split(" ")[0] || "amig@"}
                </p>
                <p className="mt-1 font-body text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">
                  Te enviamos los detalles a <b className="text-[var(--gold-dark)] dark:text-[var(--gold-light)]">{datos.email || "tu correo"}</b>
                </p>
                <div className="mt-5 inline-flex gap-4 bg-[var(--gold-08)] border border-[var(--border-gold-25)] rounded-[2px] px-6 py-3">
                  <div>
                    <p className="font-tag text-[10px] text-[var(--noir-soft)] dark:text-[var(--ash)] uppercase tracking-widest">Pedido</p>
                    <p className="font-body text-sm font-bold text-[var(--noir)] dark:text-[var(--snow)]">{numeroPedido}</p>
                  </div>
                  <div className="w-px bg-[var(--border-gold-25)]" />
                  <div>
                    <p className="font-tag text-[10px] text-[var(--noir-soft)] dark:text-[var(--ash)] uppercase tracking-widest">Total</p>
                    <p className="font-body text-sm font-bold text-[var(--gold-dark)] dark:text-[var(--gold-light)]">${Number(total).toLocaleString("es-MX")}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Resumen del pedido */}
          <aside className="bg-[var(--gold-08)] dark:bg-[var(--noir)] border border-[var(--border-gold-25)] dark:border-[var(--border-gold-20)] rounded-[2px] p-5 self-start">
            <p className="font-tag text-[11px] tracking-[2px] text-[var(--noir-soft)] dark:text-[var(--ash)] uppercase font-bold mb-3">
              Resumen ({totalArticulos} {totalArticulos === 1 ? "artículo" : "artículos"})
            </p>
            <div className="flex flex-col gap-2 max-h-44 overflow-y-auto mb-3">
              {carrito.map((item) => (
                <div key={`${item.producto.id}-${item.talla}`} className="flex justify-between items-center gap-2">
                  <div className="min-w-0">
                    <p className="font-body text-[11px] font-semibold text-[var(--noir)] dark:text-[var(--snow)] truncate">{item.producto.nombre}</p>
                    <p className="font-body text-[10px] text-[var(--noir-soft)] dark:text-[var(--ash)]">Talla {item.talla} · x{item.cantidad}</p>
                  </div>
                  <span className="font-body text-xs font-bold text-[var(--gold-dark)] dark:text-[var(--gold-light)] tabular-nums shrink-0">
                    ${Number(item.producto.precioVenta * item.cantidad).toLocaleString("es-MX")}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-[var(--border-gold-25)] pt-3 flex flex-col gap-1.5">
              <div className="flex justify-between font-body text-xs text-[var(--noir-soft)] dark:text-[var(--ash)]">
                <span>Subtotal</span>
                <b className="text-[var(--noir)] dark:text-[var(--snow)] tabular-nums">${Number(subtotal).toLocaleString("es-MX")}</b>
              </div>
              <div className="flex justify-between font-body text-xs text-[var(--noir-soft)] dark:text-[var(--ash)]">
                <span>Envío</span>
                <b className={`tabular-nums ${envio === 0 ? "text-[var(--gold-dark)] dark:text-[var(--gold-light)]" : "text-[var(--noir)] dark:text-[var(--snow)]"}`}>
                  {envio === 0 ? "GRATIS" : `$${Number(envio).toLocaleString("es-MX")}`}
                </b>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-[var(--border-gold-25)]">
                <span className="font-body text-sm font-semibold text-[var(--noir)] dark:text-[var(--snow)]">Total</span>
                <b className="font-display text-xl font-bold text-[var(--gold-dark)] dark:text-[var(--gold-light)] tabular-nums">
                  ${Number(total).toLocaleString("es-MX")}
                </b>
              </div>
            </div>
          </aside>
        </div>

        {/* Navegación entre pasos */}
        {paso < 3 && (
          <div className="px-4 sm:px-7 py-4 border-t border-[var(--border-gold-25)] flex flex-col gap-2">
            {errorPago && (
              <p className="text-center font-tag text-xs text-[#e57373] font-semibold">
                <i className="bi bi-exclamation-circle me-1" />{errorPago}
              </p>
            )}
            <div className="flex justify-between items-center">
              <button
                onClick={() => paso > 1 ? setPaso(paso - 1) : onCerrar()}
                disabled={enviando}
                className="font-tag uppercase tracking-wide text-[var(--noir-soft)] dark:text-[var(--ash)] hover:text-[var(--noir)] dark:hover:text-[var(--snow)] font-bold flex items-center gap-2 transition disabled:opacity-40"
              >
                <i className="bi bi-arrow-left" />
                {paso === 1 ? "Seguir comprando" : "Atrás"}
              </button>
              <button
                onClick={paso === 2 ? confirmarPago : () => { if (paso === 1 && !validarPaso1()) return; setPaso(paso + 1); }}
                disabled={enviando}
                className="bg-[var(--gold)] text-[var(--noir)] font-tag uppercase tracking-[0.15em] font-bold px-7 py-3 rounded-[2px] hover:bg-[var(--gold-dark)] transition flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {enviando
                  ? <><i className="bi bi-arrow-repeat animate-spin" /> Procesando...</>
                  : <>{paso === 1 ? "Continuar al pago" : `Pagar · $${Number(total).toLocaleString("es-MX")}`}<i className="bi bi-arrow-right" /></>
                }
              </button>
            </div>
          </div>
        )}

        {paso === 3 && (
          <div className="px-4 sm:px-7 py-4 border-t border-[var(--border-gold-25)] text-center">
            <button
              onClick={() => { onPedidoConfirmado(); onCerrar(); }}
              className="bg-[var(--gold)] text-[var(--noir)] font-tag uppercase tracking-[0.15em] font-bold px-7 py-3 rounded-[2px] hover:bg-[var(--gold-dark)] transition"
            >
              Seguir explorando
            </button>
          </div>
        )}
      </div>
    </div>
  );
}