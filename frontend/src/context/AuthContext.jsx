import { createContext, useState, useContext, useEffect } from "react";
import { normalizeAuthenticatedUser } from "../utils/accessControl";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {

  const [token, setToken] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const verificarSesion = async () => {

      const tokenGuardado = localStorage.getItem("token");

      if (!tokenGuardado) {
        setLoading(false);
        return;
      }

      try {

        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${tokenGuardado}`,
          },
        });

        if (res.status === 401 || res.status === 403) {
          // Token inválido, limpiar
          throw new Error("Token inválido");
        }

        if (!res.ok) {
          // Error del servidor u otro error - NO borrar el token
          console.warn(`Error verificando sesión: ${res.status}. Token mantenido en caché.`);
          setLoading(false);
          return;
        }

        const data = await res.json();

        // Normalizar estructura del usuario para asegurar que tenga roleId
        const usuario = normalizeAuthenticatedUser(data.user);

        setToken(tokenGuardado);
        setUsuario(usuario);
        localStorage.setItem("usuario", JSON.stringify(usuario));

      } catch (error) {
        // Solo borrar token si es explícitamente inválido
        if (error.message === "Token inválido") {
          localStorage.removeItem("token");
          localStorage.removeItem("usuario");
          setToken(null);
          setUsuario(null);
        } else {
          console.warn("Error verificando sesión:", error.message);
        }

      } finally {

        setLoading(false);

      }
    };

    verificarSesion();

  }, []);

  const login = (tokenRecibido, datosUsuario) => {

    // Normalizar estructura del usuario para asegurar que tenga roleId
    const usuario = normalizeAuthenticatedUser(datosUsuario);

    localStorage.setItem("token", tokenRecibido);
    localStorage.setItem("usuario", JSON.stringify(usuario));

    setToken(tokenRecibido);
    setUsuario(usuario);
  };

  // ── Registro de nueva cuenta ────────────────────────────────────────────
const register = async ({ nombre, email, password }) => {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    const error = new Error(data.message || "No se pudo crear la cuenta.");
    if (data.field) error.field = data.field;
    throw error;
  }

  // Si el backend regresa token + user, dejamos al usuario logueado de una vez
  if (data.token && data.user) {
    login(data.token, data.user);
  }

  return data;
};


  const logout = () => {

    localStorage.removeItem("token");
    localStorage.removeItem("usuario");

    setToken(null);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        usuario,
        login,
        logout,
        register,
        loading,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export { AuthContext };
