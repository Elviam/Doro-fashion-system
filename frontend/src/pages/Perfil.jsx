import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import PerfilUsuario from "../components/PerfilUsuario";
import PerfilCliente from "../components/PerfilCliente";
import Encabezado from "../components/Encabezado";
import FooterTienda from "../components/tienda/FooterTienda";
import Layout from "../components/Layout";
import useTitulo from "../hooks/useTitulo";

export default function Perfil() {
  useTitulo("Perfil");
  const { usuario } = useContext(AuthContext);
  const esStaff = usuario?.accountType === "STAFF";

  if (esStaff) {
    return (
      <Layout>
        <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
          <Encabezado titulo="Mi Perfil" />
          <PerfilUsuario usuario={usuario} />
        </div>
      </Layout>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--ivory)] w-full overflow-x-hidden">
      <main className="flex-1 max-w-[1480px] mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 w-full box-border">

        <PerfilCliente usuario={usuario} />
      </main>

      <FooterTienda />
    </div>
  );
}
