import { useContext } from "react";
import { Outlet } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { esClienteTienda } from "../../context/LoginRequeridoContext";

// Las sesiones STAFF y CLIENT se conservan por separado. Esta superficie solo
// consume la sesión CLIENT activa y nunca invalida la sesión administrativa.
export default function TiendaComoInvitado() {
  const { token, usuario, loading } = useContext(AuthContext);
  const esSesionDeStaff = Boolean(token && usuario && !esClienteTienda(usuario));

  if (loading || esSesionDeStaff) return null;

  return <Outlet />;
}
