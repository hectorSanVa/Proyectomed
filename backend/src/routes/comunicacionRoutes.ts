import { Router } from "express";
import { ComunicacionController } from "../controllers/ComunicacionController";

const router = Router();

router.get("/", ComunicacionController.getAll);
router.get("/usuario/:idUsuario", ComunicacionController.getByUsuario);
router.get("/:id", ComunicacionController.getById);
router.post("/", ComunicacionController.create);
router.put("/:id", ComunicacionController.update);
router.delete("/:id", ComunicacionController.delete);

export default router;
