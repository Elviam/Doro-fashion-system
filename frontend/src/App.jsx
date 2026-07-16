import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import Roles from "./pages/Roles";
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
import TiendaComoInvitado from "./components/tienda/TiendaComoInvitado";
import MisPedidos from "./pages/MisPedidos";
import GenerarPedido from "./pages/GenerarPedido";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
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
              <Route path="/tienda" element={<Tienda />} />
              <Route path="/tienda/producto/:id" element={<DetalleProductoTienda />} />
              <Route path="/tienda/checkout" element={<Checkout />} />
            </Route>
      
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

        {/* Roles */}
        <Route
          path="/roles"
          element={
            <ProtectedRoute requiredPage="roles">
              <Layout>
                <Roles />
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
            <ProtectedRoute requiredPage="reabastecimiento">
              <Layout>
                <MisPedidos />
              </Layout>
            </ProtectedRoute>
          }
        />

    <Route
      path="/reabastecimiento/generar-pedido"
      element={
        <ProtectedRoute requiredPage="reabastecimiento">
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
                <Perfil />
              </TiendaProviders>
            </ProtectedRoute>
          }
        />

        {/* Ruta no encontrada */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
