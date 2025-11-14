import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";
import jwt from "jsonwebtoken"; // <--- 1. Importar jsonwebtoken
import { UsuarioAdmin } from "../models/UsuarioAdmin"; // <--- 2. Importar el modelo real

// 3. Definir el secreto de JWT. ¡Debe estar en tu .env!
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secret_key_muy_segura_aqui_POR_FAVOR_CAMBIALA';

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Usuario y contraseña son requeridos" });
      }

      // 4. AuthService ahora devuelve un usuario de la BD (o null)
      const user = await AuthService.login(username, password);

      if (!user) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      // 5. Crear el Payload del Token
      //    (Contiene la información que guardaremos dentro del token)
      const payload = {
        id: user.id_admin, // ID del usuario
        rol: user.rol,     // Rol del usuario ('admin', 'monitor', 'moderador')
      };

      // 6. Firmar el Token
      const token = jwt.sign(payload, JWT_SECRET, {
        expiresIn: '8h', // El token expirará en 8 horas
      });

      // 7. Devolver el Token y la información del usuario al frontend
      res.json({
        success: true,
        token: token, // <--- El token para guardar en el frontend
        user: {
          id: user.id_admin, // Mapear id_admin a id para el frontend
          username: user.username,
          nombre: user.nombre,
          rol: user.rol
        },
        message: "Login exitoso"
      });
      
    } catch (error) {
      console.error("Error en AuthController.login:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async verify(req: Request, res: Response) {
    try {
      // 8. Esta ruta ahora debe estar protegida por el middleware 'isAuthenticated'
      //    Si el middleware pasa, (req as any).user contendrá el payload del token.
      const userPayload = (req as any).user;
      
      if (!userPayload) {
         // Esto no debería pasar si el middleware está bien configurado en la ruta
        return res.status(401).json({ error: "Sesión inválida (no hay payload)" });
      }

      // Devolvemos la información del usuario que está en el token
      res.json({
        success: true,
        message: "Sesión válida",
        user: userPayload // Devuelve { id: ..., rol: ... }
      });
    } catch (error) {
      res.status(401).json({ error: "Sesión inválida" });
    }
  }
}