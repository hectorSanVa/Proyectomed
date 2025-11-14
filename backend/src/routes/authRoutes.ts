import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { isAuthenticated } from "../middlewares/authMiddleware"; // <-- ¡Importa el middleware!

const router = Router();

// Rutas para administradores
router.post("/admin/login", AuthController.login);

// Protege la ruta de verificación con el middleware
router.get("/verify", isAuthenticated, AuthController.verify);

export default router;