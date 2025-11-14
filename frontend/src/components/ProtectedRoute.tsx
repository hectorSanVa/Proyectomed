import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
// --- 1. Importar el tipo AdminRol ---
// --- 1. Importar el tipo AdminRol ---
import type { AdminRol } from "../types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  // --- 2. Añadir la prop 'roles' ---
  // Esta prop es opcional. Si no se pasa, solo verificará la autenticación.
  roles?: AdminRol[];
}

const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
  // --- 3. Obtener el 'user' (que contiene el rol) ---
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation(); // Para saber de dónde venimos

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <p>Cargando...</p>
      </div>
    );
  }

  // --- 4. Primera Verificación: ¿Está autenticado? ---
  if (!isAuthenticated) {
    // Si no está autenticado, mandarlo a login
    // Guardamos la ruta que intentaba visitar (location.pathname)
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // --- 5. Segunda Verificación: ¿Se requieren roles para esta ruta? ---
  if (roles && roles.length > 0) {
    // Si la ruta requiere roles, verificar si el rol del usuario está permitido
    if (!user?.rol || !roles.includes(user.rol)) {
      // El usuario está logueado, pero no tiene el rol correcto.
      // Lo mandamos al dashboard principal (o una página de "No Autorizado")
      // No lo mandamos a /login, porque YA está logueado.
      console.warn(
        `Acceso denegado: Usuario con rol '${
          user?.rol
        }' intentó acceder a ruta protegida para '${roles.join(", ")}'`
      );
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  // Si pasó todas las verificaciones, mostrar la página
  return <>{children}</>;
};

export default ProtectedRoute;
