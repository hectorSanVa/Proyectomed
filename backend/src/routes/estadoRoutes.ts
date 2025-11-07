import { Router } from "express";
import { EstadoController } from "../controllers/EstadoController";

const router = Router();

router.get("/", EstadoController.getAll);
router.get("/:id", EstadoController.getById);
router.post("/", EstadoController.create);
router.put("/:id", EstadoController.update);
router.delete("/:id", EstadoController.delete);

export default router;
