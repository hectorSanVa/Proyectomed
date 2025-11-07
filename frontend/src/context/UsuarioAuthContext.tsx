import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usuarioAuthService } from '../services/usuarioAuthService';
import type { UsuarioSession } from '../types';

interface UsuarioAuthContextType {
  session: UsuarioSession | null;
  login: (correo: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const UsuarioAuthContext = createContext<UsuarioAuthContextType | undefined>(undefined);

export const UsuarioAuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<UsuarioSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedSession = usuarioAuthService.getCurrentSession();
    if (savedSession) {
      setSession(savedSession);
    }
    setLoading(false);
  }, []);

  const login = async (correo: string) => {
    const response = await usuarioAuthService.login(correo);
    if (response.success) {
      setSession(response.session);
    } else {
      throw new Error('Error al iniciar sesión');
    }
  };

  const logout = () => {
    usuarioAuthService.logout();
    setSession(null);
  };

  return (
    <UsuarioAuthContext.Provider
      value={{
        session,
        login,
        logout,
        isAuthenticated: !!session,
        loading,
      }}
    >
      {children}
    </UsuarioAuthContext.Provider>
  );
};

export const useUsuarioAuth = () => {
  const context = useContext(UsuarioAuthContext);
  if (context === undefined) {
    throw new Error('useUsuarioAuth must be used within a UsuarioAuthProvider');
  }
  return context;
};
