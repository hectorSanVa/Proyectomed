import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { authService } from "../services/authService";
import type { User } from "../types";

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Esta función verificará el token contra el backend
    const verifyAuth = async () => {
      try {
        // 'verifySession' será una nueva función en authService
        // que llama al endpoint /auth/verify del backend.
        const user = await authService.verifySession();
        if (user) {
          setUser(user);
        }
      } catch (error) {
        console.error("Error verificando la sesión:", error);
        console.warn("No hay sesión válida o el token expiró.");
        // authService.verifySession se encargará de limpiar el token inválido
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const login = async (username: string, password: string) => {
    // 1. 'authService.login' ya guarda el token y el user en localStorage
    const response = await authService.login({ username, password });

    // 2. Verificamos que 'success' sea true Y que 'user' exista
    if (response.success && response.user) {
      // 3. Ya no llamamos a authService.saveUser() (Error 1 solucionado)

      // 4. 'response.user' es de tipo 'User', no 'undefined' (Error 2 solucionado)
      setUser(response.user);
    } else {
      // 5. Lanzamos el error que nos da el backend
      throw new Error(response.error || "Credenciales inválidas");
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
