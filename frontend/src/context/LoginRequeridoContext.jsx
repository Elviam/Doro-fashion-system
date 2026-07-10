import { createContext, useContext, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import ModalLoginRequerido from "../components/tienda/ModalLoginRequerido";

const LoginRequeridoContext = createContext(null);

// Solo cuentas con role "CLIENTE" cuentan como sesión válida dentro de la tienda.
// Esto es lo que hace que el staff (admin, gerente, bodeguero, vendedor) que
// entra desde el botón "Ir a la Tienda" se trate como invitado ahí, sin que
// se le cierre su sesión real de staff.
export function esClienteTienda(usuario) {
  return !!usuario && usuario.role === "CLIENTE";
}

export function LoginRequeridoProvider({ children }) {
  const { token, usuario } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [modal, setModal] = useState(null); // { mensaje } | null

  const requireAuth = useCallback(
    (callback, mensaje = "Inicia sesión para continuar") => {
      if (!token || !esClienteTienda(usuario)) {
        // Mensaje distinto si sí hay sesión pero es de staff, para que
        // quede claro por qué le estamos pidiendo login de nuevo.
        const mensajeFinal =
          token && usuario && !esClienteTienda(usuario)
            ? "Esta cuenta es de administración. Inicia sesión con una cuenta de cliente para continuar."
            : mensaje;
        setModal({ mensaje: mensajeFinal });
        return false;
      }
      callback?.();
      return true;
    },
    [token, usuario]
  );

  const irALogin = () => {
    setModal(null);
    navigate("/login", { state: { from: location.pathname } });
  };

  return (
    <LoginRequeridoContext.Provider value={{ requireAuth }}>
      {children}
      <ModalLoginRequerido
        abierto={!!modal}
        mensaje={modal?.mensaje}
        onCerrar={() => setModal(null)}
        onIniciarSesion={irALogin}
      />
    </LoginRequeridoContext.Provider>
  );
}

export function useRequireAuth() {
  const ctx = useContext(LoginRequeridoContext);
  if (!ctx) {
    throw new Error("useRequireAuth debe usarse dentro de LoginRequeridoProvider");
  }
  return ctx.requireAuth;
}