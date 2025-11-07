import { Router } from "express";
import { ComisionController } from "../controllers/ComisionController";

const router = Router();

router.get("/", ComisionController.getAll);
router.get("/:id", ComisionController.getById);
router.post("/", ComisionController.create);
router.put("/:id", ComisionController.update);
router.delete("/:id", ComisionController.delete);

export default router;
