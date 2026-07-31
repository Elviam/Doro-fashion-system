import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Toast from "./components/Toast";
import { consumeFlashMessage } from "./utils/flash";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Recepciones from "./pages/Recepciones";
import Usuarios from "./pages/Usuarios";
import Clientes from "./pages/Clientes";
import Productos from './pages/Productos'
import Ventas from './pages/Ventas'
import Auditoria from "./pages/Auditoria";
import Proveedores from "./pages/Proveedores";
import Dashboard from "./pages/Dashboard";
import Reabastecimiento from "./pages/Reabastecimiento";
import Tienda from "./pages/Tienda";
import ProtectedRoute from "./components/ProtectedRoute";
import Register from "./pages/Register";
import Envios          from "./pages/tienda/Envios";
import Devoluciones    from "./pages/tienda/Devoluciones";
import GuiaTallas      from "./pages/tienda/GuiaTallas";
import Contacto        from "./pages/tienda/Contacto";
import FAQ             from "./pages/tienda/FAQ";
import SobreDoro       from "./pages/tienda/SobreDoro";
import Sustentabilidad from "./pages/tienda/Sustentabilidad";
import Terminos        from "./pages/tienda/Terminos";
import Inventario from "./pages/Inventario";
import Perfil from "./pages/Perfil";
import StaffLogin from "./pages/StaffLogin";
import Checkout from "./pages/tienda/Checkout";
import DetalleProductoTienda from "./pages/tienda/DetalleProductoTienda";
import TiendaProviders from "./components/tienda/TiendaProviders";
import TiendaLayout from "./components/tienda/TiendaLayout";
import TiendaComoInvitado from "./components/tienda/TiendaComoInvitado";
import MisPedidos from "./pages/MisPedidos";
import GenerarPedido from "./pages/GenerarPedido";
import PrepararPedidos from "./pages/PrepararPedidos";
import Roles from "./pages/Roles";

import "./App.css";

function App() {
  const location = useLocation();
  const [flash, setFlash] = useState({ message: "", type: "exito" });
  useEffect(() => {
    const nextFlash = consumeFlashMessage();
    if (nextFlash) setFlash(nextFlash);
  }, [location.key]);

  return (
    <>
      <Toast message={flash.message} type={flash.type} onClose={() => setFlash({ message: "", type: "exito" })} />
      <Routes>
        {/* Redirección principal */}
        <Route path="/" element={<Home />} />

        {/* Home */}
        <Route path="/home" element={<Home />} />

        {/* Login */}
        <Route path="/login" element={<Login />} />
        <Route path="/staff/login" element={<StaffLogin />} />

        <Route path="/register" element={<Register />} />
       
          {/* Tienda (para clientes) — carrito y login-requerido compartidos */}
          <Route element={<TiendaComoInvitado />}>
            <Route element={<TiendaProviders />}>
              <Route element={<TiendaLayout />}>
                <Route path="/tienda" element={<Tienda />} />
                <Route path="/tienda/producto/:id" element={<DetalleProductoTienda />} />
                <Route path="/tienda/checkout" element={<Checkout />} />
      
        {/*Footer de Tienda*/}
                <Route path="/tienda/envios"          element={<Envios />} />
                <Route path="/tienda/devoluciones"    element={<Devoluciones />} />
                <Route path="/tienda/guia-tallas"     element={<GuiaTallas />} />
                <Route path="/tienda/contacto"        element={<Contacto />} />
                <Route path="/tienda/faq"             element={<FAQ />} />
                <Route path="/tienda/sobre-doro"      element={<SobreDoro />} />
                <Route path="/tienda/sustentabilidad" element={<Sustentabilidad />} />
                <Route path="/tienda/terminos"        element={<Terminos />} />
              </Route>
            </Route>
          </Route>
    
        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredPage="dashboard">
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Productos */}
        <Route
          path="/productos"
          element={
            <ProtectedRoute requiredPage="productos">
              <Layout>
                <Productos />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Recepciones */}
        <Route
          path="/recepciones"
          element={
            <ProtectedRoute requiredPage="recepciones">
              <Layout>
                <Recepciones />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Clientes */}
        <Route
          path="/clientes"
          element={
            <ProtectedRoute requiredPage="clientes">
              <Layout>
                <Clientes />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Proveedores */}
        <Route
          path="/proveedores"
          element={
            <ProtectedRoute requiredPage="proveedores">
              <Layout>
                <Proveedores />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Usuarios */}
        <Route
          path="/usuarios"
          element={
            <ProtectedRoute requiredPage="usuarios">
              <Layout>
                <Usuarios />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Auditoría */}
        <Route
          path="/auditoria"
          element={
            <ProtectedRoute requiredPage="auditoria">
              <Layout>
                <Auditoria />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Ventas */}
        <Route
          path="/ventas"
          element={
            <ProtectedRoute requiredPage="ventas">
              <Layout>
                <Ventas />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventario"
          element={
            <ProtectedRoute requiredPage="inventario">
              <Layout>
                <Inventario/>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/configuracion"
          element={
            <ProtectedRoute requiredPage="configuracion">
              <Layout>
                <Roles />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/preparar-pedidos"
          element={
            <ProtectedRoute requiredPage="preparacion">
              <Layout>
                <PrepararPedidos />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reabastecimiento"
          element={
            <ProtectedRoute requiredPage="reabastecimiento">
              <Layout>
                <Reabastecimiento />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reabastecimiento/pedidos"
          element={
            <ProtectedRoute requiredPage="pedidosProveedor">
              <Layout>
                <MisPedidos />
              </Layout>
            </ProtectedRoute>
          }
        />

    <Route
      path="/reabastecimiento/generar-pedido"
      element={
        <ProtectedRoute requiredPage="generarPedidoProveedor">
          <Layout>
            <GenerarPedido />
          </Layout>
        </ProtectedRoute>
      }
    />

        <Route
          path="/perfil"
          element={
            <ProtectedRoute requiredPage="perfil">
              <TiendaProviders>
                <TiendaLayout>
                  <Perfil />
                </TiendaLayout>
              </TiendaProviders>
            </ProtectedRoute>
          }
        />

        {/* Ruta no encontrada */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </>
  );
}

export default App;
