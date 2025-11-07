import { Router } from "express";
import { EvidenciaController } from "../controllers/EvidenciaController";
import { upload } from "../middlewares/upload";

const router = Router();

router.get("/", EvidenciaController.getAll);
router.get("/comunicacion/:idComunicacion", EvidenciaController.getByComunicacion);
router.get("/:id/download", EvidenciaController.download);
// Esta ruta debe ir al final para evitar conflictos
router.get("/:id", EvidenciaController.getById);
router.post("/", upload.single('archivo'), EvidenciaController.create);
router.put("/:id", EvidenciaController.update);
router.delete("/:id", EvidenciaController.delete);

export default router;
