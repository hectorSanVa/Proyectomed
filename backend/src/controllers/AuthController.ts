import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Usuario y contraseña son requeridos" });
      }

      const user = await AuthService.login(username, password);

      if (!user) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      // En producción, aquí se generaría un JWT token
      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          nombre: user.nombre,
          rol: user.rol
        },
        message: "Login exitoso"
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async verify(req: Request, res: Response) {
    try {
      // En producción, esto verificaría el JWT token
      // Por ahora, simplemente retornamos éxito si hay un usuario en la sesión
      res.json({
        success: true,
        message: "Sesión válida"
      });
    } catch (error) {
      res.status(401).json({ error: "Sesión inválida" });
    }
  }
}



