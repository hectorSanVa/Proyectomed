import { Router } from "express";
import { AuthController } from "../controllers/AuthController";

const router = Router();

// Rutas para administradores
router.post("/admin/login", AuthController.login);
router.get("/verify", AuthController.verify);

export default router;

