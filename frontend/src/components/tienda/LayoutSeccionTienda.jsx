// src/components/tienda/LayoutSeccionTienda.jsx
import { useEffect } from "react";
import HeaderSeccionesTienda from "./HeaderSeccionesTienda";
import FooterTienda from "./FooterTienda";

export default function LayoutSeccionTienda({ children }) {

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div className="min-h-screen bg-oscuro flex flex-col">
      <HeaderSeccionesTienda />

      <main className="flex-1 max-w-[1480px] mx-auto px-6 lg:px-10 py-12 w-full">
        {children}
      </main>

      <FooterTienda />
    </div>
  );
}