import { Router } from "express";
import { UsuarioController } from "../controllers/UsuarioController";

const router = Router();

// Rutas específicas primero (antes de las rutas con parámetros)
router.post("/login", UsuarioController.login);
router.get("/correo/:correo", UsuarioController.getByCorreo);

// Rutas generales
router.get("/", UsuarioController.getAll);
router.post("/", UsuarioController.create);

// Rutas con parámetros al final
router.get("/:id", UsuarioController.getById);
router.put("/:id", UsuarioController.update);
router.delete("/:id", UsuarioController.delete);

export default router;
