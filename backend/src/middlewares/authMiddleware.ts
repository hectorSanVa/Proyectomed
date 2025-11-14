import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UsuarioAdminService } from '../services/UsuarioAdminService';
import { AdminRol } from '../models/UsuarioAdmin';

// Carga el secreto de JWT desde tus variables de entorno (.env)
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secret_key_muy_segura_aqui';

// Interfaz para el payload del token
interface JwtPayload {
  id: number;
  rol: AdminRol;
}

/**
 * Middleware para verificar si el usuario está autenticado
 */
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  // El token viene como "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó token.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    // Adjuntamos los datos del usuario (id y rol) al objeto `req`
    // para que los siguientes middlewares y controladores puedan usarlo.
    (req as any).user = payload;
    
    next();
  } catch (error) {
    console.error("Error de token:", error);
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