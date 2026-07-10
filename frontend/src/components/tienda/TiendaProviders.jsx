import { Outlet } from "react-router-dom";
import { LoginRequeridoProvider } from "../../context/LoginRequeridoContext";
import { CarritoProvider } from "../../context/CarritoContext";

export default function TiendaProviders() {
  return (
    <LoginRequeridoProvider>
      <CarritoProvider>
        <Outlet />
      </CarritoProvider>
    </LoginRequeridoProvider>
  );
}