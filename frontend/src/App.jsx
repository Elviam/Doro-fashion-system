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
import Tienda from "./pages/Tienda";
import Roles from "./pages/Roles";
import ProtectedRoute from "./components/ProtectedRoute";
import Register from "./pages/Register";
import Envios          from "./pages/tienda/Envios";
import Devoluciones    from "./pages/tienda/Devoluciones";
import GuiaTallas      from "./pages/tienda/GuiaTallas";
import Contacto        from "./pages/tienda/Contacto";
import FAQ             from "./pages/tienda/FAQ";
import SobreAura       from "./pages/tienda/SobreAura";
import Sustentabilidad from "./pages/tienda/Sustentabilidad";
import Terminos        from "./pages/tienda/Terminos";
import Inventario from "./pages/Inventario";
import Perfil from "./pages/Perfil";


import "./App.css";

const Placeholder = ({ titulo }) => (
  <div
    className="p-10 text-lila"
    style={{ fontFamily: "'Poppins', sans-serif" }}
  >
    <h1 className="text-3xl font-bold text-white">{titulo}</h1>
    <p className="opacity-60">Esta sección está en construcción...</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirección principal */}
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* Home */}
        <Route path="/home" element={<Home />} />

        {/* Login */}
        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        {/*Footer de Tienda*/}
        <Route path="/tienda/envios"          element={<Envios />} />
        <Route path="/tienda/devoluciones"    element={<Devoluciones />} />
        <Route path="/tienda/guia-tallas"     element={<GuiaTallas />} />
        <Route path="/tienda/contacto"        element={<Contacto />} />
        <Route path="/tienda/faq"             element={<FAQ />} />
        <Route path="/tienda/sobre-aura"      element={<SobreAura />} />
        <Route path="/tienda/sustentabilidad" element={<Sustentabilidad />} />
        <Route path="/tienda/terminos"        element={<Terminos />} />


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
          path="/perfil"
          element={
            <ProtectedRoute requiredPage="perfil">
              <Perfil />
            </ProtectedRoute>
          }
        />

        {/* Tienda (para clientes) */}
        <Route
          path="/tienda"
          element={
            <ProtectedRoute requiredPage="tienda">
              <Tienda />
            </ProtectedRoute>
          }
        />

        {/* Ruta no encontrada */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;