import { Router } from "express";
import { UsuarioAdminController } from "../controllers/UsuarioAdminController";
import { isAuthenticated, hasRole } from "../middlewares/authMiddleware";

const router = Router();

// Proteger TODAS estas rutas.
// 1. Debe estar autenticado (isAuthenticated)
// 2. Debe tener el rol 'admin' (hasRole(['admin']))
router.use(isAuthenticated, hasRole(['admin']));

// Definir las rutas CRUD
router.get("/", UsuarioAdminController.getAll);
router.post("/", UsuarioAdminController.create);

router.get("/:id", UsuarioAdminController.getById);
router.put("/:id", UsuarioAdminController.update);
router.delete("/:id", UsuarioAdminController.delete);

export default router;