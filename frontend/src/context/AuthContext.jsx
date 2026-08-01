import { createContext, useState, useContext, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { normalizeAuthenticatedUser } from "../utils/accessControl";
import { releaseExpiredSessionLock } from "../services/api";
import { setFlashMessage } from "../utils/flash";

const API_BASE = import.meta.env.VITE_API_URL ?? "";
const AuthContext = createContext(null);

const STAFF_PATHS = [
  "/dashboard", "/productos", "/recepciones", "/clientes", "/proveedores", "/usuarios",
  "/auditoria", "/ventas", "/inventario", "/preparar-pedidos", "/reabastecimiento",
];

function accountTypeForLocation(location) {
  if (location.state?.accountType || new URLSearchParams(location.search).get("scope") === "staff") return "STAFF";
  const path = location.pathname;
  if (path === "/perfil" && localStorage.getItem("staffToken")) return "STAFF";
  if (path.startsWith("/staff") || STAFF_PATHS.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) return "STAFF";
  return "CLIENT";
}

function storageKeys(accountType) {
  return accountType === "STAFF"
    ? { token: "staffToken", user: "staffUsuario" }
    : { token: "clientToken", user: "clientUsuario" };
}

function readLegacySession(accountType) {
  try {
    const user = JSON.parse(localStorage.getItem("usuario") || "null");
    return user?.accountType === accountType ? { token: localStorage.getItem("token"), user } : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const location = useLocation();
  const accountType = accountTypeForLocation(location);
  const [token, setToken] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionUnavailable, setSessionUnavailable] = useState(false);
  const sessionOperationRef = useRef(0);
  const sessionRequestRef = useRef(null);

  const loadSession = useCallback(async (type) => {
    const operation = ++sessionOperationRef.current;
    sessionRequestRef.current?.abort();
    const keys = storageKeys(type);
    let tokenGuardado = localStorage.getItem(keys.token);

    if (!tokenGuardado) {
      const legacy = readLegacySession(type);
      if (legacy?.token) {
        tokenGuardado = legacy.token;
        localStorage.setItem(keys.token, legacy.token);
        localStorage.setItem(keys.user, JSON.stringify(legacy.user));
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
      }
    }

    if (!tokenGuardado) {
      if (operation !== sessionOperationRef.current) return;
      setToken(null);
      setUsuario(null);
      setSessionUnavailable(false);
      setLoading(false);
      return;
    }

    try {
      const controller = new AbortController();
      sessionRequestRef.current = controller;
      const timeout = window.setTimeout(() => controller.abort(), 15000);
      let res;
      try {
        res = await fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${tokenGuardado}` }, signal: controller.signal });
      } finally {
        window.clearTimeout(timeout);
        if (sessionRequestRef.current === controller) sessionRequestRef.current = null;
      }
      if (res.status === 401) throw new Error("Token inválido");
      if (!res.ok) throw new Error(`No se pudo verificar la sesión (${res.status})`);

      const data = await res.json();
      const currentUser = normalizeAuthenticatedUser(data.user);
      if (currentUser.accountType !== type) throw new Error("Token inválido");
      if (operation !== sessionOperationRef.current) return;
      setToken(tokenGuardado);
      setUsuario(currentUser);
      setSessionUnavailable(false);
      localStorage.setItem(keys.user, JSON.stringify(currentUser));
    } catch (error) {
      if (operation !== sessionOperationRef.current) return;
      if (error.message === "Token inválido") {
        localStorage.removeItem(keys.token);
        localStorage.removeItem(keys.user);
        setToken(null);
        setUsuario(null);
        setSessionUnavailable(false);
      } else {
        // Preserve a valid local session through a transient connectivity failure.
        const cached = JSON.parse(localStorage.getItem(keys.user) || "null");
        setToken(tokenGuardado);
        setUsuario(cached);
        setSessionUnavailable(!cached);
      }
    } finally {
      if (operation === sessionOperationRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadSession(accountType);
    return () => sessionRequestRef.current?.abort();
  }, [accountType, loadSession]);

  const login = useCallback((tokenRecibido, datosUsuario) => {
    sessionOperationRef.current += 1;
    sessionRequestRef.current?.abort();
    const currentUser = normalizeAuthenticatedUser(datosUsuario);
    const keys = storageKeys(currentUser.accountType);
    localStorage.setItem(keys.token, tokenRecibido);
    localStorage.setItem(keys.user, JSON.stringify(currentUser));
    releaseExpiredSessionLock(currentUser.accountType);
    setToken(tokenRecibido);
    setUsuario(currentUser);
    setSessionUnavailable(false);
  }, []);

  const register = async ({ nombre, email, password }) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      const error = new Error(data.message || "No se pudo crear la cuenta.");
      if (data.field) error.field = data.field;
      throw error;
    }
    if (data.token && data.user) login(data.token, data.user);
    return data;
  };

  const logout = useCallback((type = usuario?.accountType || accountType) => {
    sessionOperationRef.current += 1;
    sessionRequestRef.current?.abort();
    const keys = storageKeys(type);
    localStorage.removeItem(keys.token);
    localStorage.removeItem(keys.user);
    const legacy = readLegacySession(type);
    if (legacy) {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
    }
    if (type === accountType) {
      setToken(null);
      setUsuario(null);
      setSessionUnavailable(false);
    }
  }, [accountType, usuario?.accountType]);

  useEffect(() => {
    const handleExpiredSession = (event) => {
      const type = event.detail?.accountType || accountType;
      logout(type);
      setFlashMessage("Tu sesión expiró. Inicia sesión nuevamente.", "error");
      window.location.assign(type === "STAFF" ? "/staff/login" : "/login");
    };
    window.addEventListener("doro:session-expired", handleExpiredSession);
    return () => window.removeEventListener("doro:session-expired", handleExpiredSession);
  }, [accountType, logout]);

  const retrySession = useCallback(() => {
    setLoading(true);
    loadSession(accountType);
  }, [accountType, loadSession]);

  return (
    <AuthContext.Provider value={{ token, usuario, login, logout, register, loading, sessionUnavailable, retrySession, accountType, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
export { AuthContext };
