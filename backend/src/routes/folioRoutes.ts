import { Router } from "express";
import { FolioController } from "../controllers/FolioController";

const router = Router();

router.get("/", FolioController.getAll);
router.get("/:medio/:anio", FolioController.getByMedioAnio);

export default router;
