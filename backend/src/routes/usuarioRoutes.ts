import { Router } from "express";
import { UsuarioController } from "../controllers/UsuarioController";

const router = Router();

router.get("/", UsuarioController.getAll);
router.get("/correo/:correo", UsuarioController.getByCorreo);
router.get("/:id", UsuarioController.getById);
router.post("/", UsuarioController.create);
router.put("/:id", UsuarioController.update);
router.delete("/:id", UsuarioController.delete);

export default router;
