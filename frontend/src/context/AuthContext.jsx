import { createContext, useState, useContext, useEffect } from "react";

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
        const usuario = {
          ...data.user,
          roleId: data.user?.roleId || data.user?.role || null
        };

        setToken(tokenGuardado);
        setUsuario(usuario);

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
    const usuario = {
      ...datosUsuario,
      roleId: datosUsuario?.roleId || datosUsuario?.role || null
    };

    localStorage.setItem("token", tokenRecibido);
    localStorage.setItem("usuario", JSON.stringify(usuario));

    setToken(tokenRecibido);
    setUsuario(usuario);
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