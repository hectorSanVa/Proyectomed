import { Router } from "express";
import { ComunicacionController } from "../controllers/ComunicacionController";

const router = Router();

router.get("/", ComunicacionController.getAll);
router.get("/reconocimientos/publicos", ComunicacionController.getReconocimientosPublicos);
router.get("/usuario/:idUsuario", ComunicacionController.getByUsuario);
// Ruta para buscar por folio (debe ir antes de /:id para evitar conflictos)
// Usamos query parameter para manejar folios con barras
router.get("/folio", ComunicacionController.getByFolio);
router.get("/:id", ComunicacionController.getById);
router.post("/", ComunicacionController.create);
router.put("/:id", ComunicacionController.update);
router.delete("/:id", ComunicacionController.delete);

export default router;
