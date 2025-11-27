import { Router } from "express";
import { ComisionController } from "../controllers/ComisionController";
import { isAuthenticated, hasRole } from "../middlewares/authMiddleware";

const router = Router();

// Proteger todas las rutas de comisiones - solo admins pueden gestionar
router.use(isAuthenticated, hasRole(['admin']));

router.get("/", ComisionController.getAll);
router.get("/:id", ComisionController.getById);
router.post("/", ComisionController.create);
router.put("/:id", ComisionController.update);
router.delete("/:id", ComisionController.delete);

export default router;
