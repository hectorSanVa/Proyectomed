import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UsuarioAdminService } from '../services/UsuarioAdminService';
import { AdminRol } from '../models/UsuarioAdmin';

// Carga el secreto de JWT desde tus variables de entorno (.env)
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secret_key_muy_segura_aqui';

// Interfaz para el payload del token de admin
interface AdminJwtPayload {
  id: number;
  rol: AdminRol;
}

// Interfaz para el payload del token de usuario regular
interface UsuarioJwtPayload {
  id_usuario: number;
  correo: string;
  tipo: 'usuario';
}

/**
 * Middleware para verificar si el usuario ADMIN está autenticado
 */
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  // El token viene como "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó token.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AdminJwtPayload | UsuarioJwtPayload;
    
    // Verificar que sea token de admin (tiene 'rol')
    if (!('rol' in payload)) {
      return res.status(403).json({ error: 'Token de usuario regular. Se requiere token de administrador.' });
    }
    
    // Adjuntamos los datos del usuario (id y rol) al objeto `req`
    (req as any).user = payload;
    
    next();
  } catch (error) {
    console.error("Error de token:", error);
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }
};

/**
 * Middleware para verificar si el USUARIO REGULAR está autenticado
 */
export const isUsuarioAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó token.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AdminJwtPayload | UsuarioJwtPayload;
    
    // Verificar que sea token de usuario regular (tiene 'tipo: usuario')
    if (!('tipo' in payload) || payload.tipo !== 'usuario') {
      return res.status(403).json({ error: 'Token inválido. Se requiere token de usuario regular.' });
    }
    
    // Adjuntamos los datos del usuario al objeto `req`
    (req as any).usuario = payload;
    
    next();
  } catch (error) {
    console.error("Error de token de usuario:", error);
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }
};

/**
 * Middleware para verificar si el usuario tiene un rol específico
 * Úsalo *después* de isAuthenticated
 */
export const hasRole = (roles: AdminRol[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.rol;

    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ error: 'Acceso denegado. No tiene los permisos necesarios.' });
    }
    
    next();
  };
};