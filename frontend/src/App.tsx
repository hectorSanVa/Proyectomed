import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { UsuarioAuthProvider } from './context/UsuarioAuthContext';
import { ToastProvider } from './components/common/ToastContainer';
import ProtectedRoute from './components/ProtectedRoute';
import Inicio from './pages/Inicio';
import FormularioPublico from './pages/FormularioPublico';
import ConsultaFolio from './pages/ConsultaFolio';
import Login from './pages/Login';
import LoginUsuario from './pages/user/LoginUsuario';
import RegisterUsuario from './pages/user/RegisterUsuario';
import Buzon from './pages/user/Buzon';
import SeguimientoPage from './pages/user/Seguimiento';
import Reconocimientos from './pages/user/Reconocimientos';
import Contacto from './pages/user/Contacto';
import Dashboard from './pages/admin/Dashboard';
import GestionQuejas from './pages/admin/GestionQuejas';
import GestionSugerencias from './pages/admin/GestionSugerencias';
import GestionReconocimientos from './pages/admin/GestionReconocimientos';
// import GestionUsuarios from './pages/admin/GestionUsuarios'; // Deshabilitado - todas las comunicaciones son anónimas
import Reportes from './pages/admin/Reportes';
import ConcentradoSeguimiento from './pages/admin/ConcentradoSeguimiento';
import Configuracion from './pages/admin/Configuracion';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <UsuarioAuthProvider>
        <ToastProvider>
          <BrowserRouter>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<Inicio />} />
            <Route path="/formulario" element={<FormularioPublico />} />
            <Route path="/consulta-folio" element={<ConsultaFolio />} />
            
            {/* Rutas de autenticación */}
            <Route path="/login" element={<LoginUsuario />} />
            <Route path="/register" element={<RegisterUsuario />} />
            <Route path="/admin/login" element={<Login />} />
            
            {/* Rutas de usuario */}
            <Route path="/buzon" element={<Buzon />} />
            <Route path="/seguimiento" element={<SeguimientoPage />} />
            <Route path="/reconocimientos" element={<Reconocimientos />} />
            <Route path="/contacto" element={<Contacto />} />
            
            {/* Rutas protegidas del administrador */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/quejas"
              element={
                <ProtectedRoute>
                  <GestionQuejas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sugerencias"
              element={
                <ProtectedRoute>
                  <GestionSugerencias />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reconocimientos"
              element={
                <ProtectedRoute>
                  <GestionReconocimientos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reportes"
              element={
                <ProtectedRoute>
                  <Reportes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/concentrado-seguimiento"
              element={
                <ProtectedRoute>
                  <ConcentradoSeguimiento />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/configuracion"
              element={
                <ProtectedRoute>
                  <Configuracion />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
        </ToastProvider>
      </UsuarioAuthProvider>
    </AuthProvider>
  );
}

export default App;
