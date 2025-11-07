import { Router } from "express";
import { HistorialEstadoController } from "../controllers/HistorialEstadoController";

const router = Router();

router.get("/", HistorialEstadoController.getAll);
router.get("/comunicacion/:idComunicacion", HistorialEstadoController.getByComunicacion);
router.get("/:id", HistorialEstadoController.getById);
router.post("/", HistorialEstadoController.create);
router.delete("/:id", HistorialEstadoController.delete);

export default router;
