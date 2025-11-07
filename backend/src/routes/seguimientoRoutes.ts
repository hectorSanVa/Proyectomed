import { Router } from "express";
import { SeguimientoController } from "../controllers/SeguimientoController";

const router = Router();

router.get("/", SeguimientoController.getAll);
router.get("/comunicacion/:idComunicacion", SeguimientoController.getByComunicacion);
router.get("/:id", SeguimientoController.getById);
router.post("/", SeguimientoController.create);
router.put("/:id", SeguimientoController.update);
router.delete("/:id", SeguimientoController.delete);

export default router;
