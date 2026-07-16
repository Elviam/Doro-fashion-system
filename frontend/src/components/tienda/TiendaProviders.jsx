import { Outlet } from "react-router-dom";
import { LoginRequeridoProvider } from "../../context/LoginRequeridoContext";
import { CarritoProvider } from "../../context/CarritoContext";
import { WishlistProvider } from "../../context/WishlistContext";

export default function TiendaProviders({ children }) {
  return (
    <LoginRequeridoProvider>
      <CarritoProvider>
        <WishlistProvider>
          {children ?? <Outlet />}
        </WishlistProvider>
      </CarritoProvider>
    </LoginRequeridoProvider>
  );
}
