import { useContext, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { esClienteTienda } from "../../context/LoginRequeridoContext";

// La tienda y el panel usan una sola sesión. Si se entra con staff, se cierra
// antes de renderizar la tienda para que el acceso sea siempre como invitado.
export default function TiendaComoInvitado() {
  const { token, usuario, loading, logout } = useContext(AuthContext);
  const esSesionDeStaff = Boolean(token && usuario && !esClienteTienda(usuario));

  useEffect(() => {
    if (esSesionDeStaff) logout();
  }, [esSesionDeStaff, logout]);

  if (loading || esSesionDeStaff) return null;

  return <Outlet />;
}
