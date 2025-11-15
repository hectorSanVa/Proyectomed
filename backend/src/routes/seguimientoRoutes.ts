import { Router } from "express";
import { SeguimientoController } from "../controllers/SeguimientoController";
// --- 1. Importar middlewares ---
import { isAuthenticated, hasRole } from "../middlewares/authMiddleware";

const router = Router();

// --- 2. Ruta Pública (SIN protección) ---
// La consulta de folio pública y "Mis Seguimientos" usan esta ruta
router.get("/comunicacion/:idComunicacion", SeguimientoController.getByComunicacion);


// --- 3. Rutas de Admin (CON protección) ---

// GET /: Admins, Monitores y Moderadores pueden listar
// La lógica de filtrado por rol irá en el CONTROLLER
router.get(
  "/", 
  isAuthenticated, 
  hasRole(['admin', 'monitor', 'moderador']), 
  SeguimientoController.getAll
);

// GET /:id: Admins, Monitores y Moderadores pueden ver
router.get(
  "/:id", 
  isAuthenticated, 
  hasRole(['admin', 'monitor', 'moderador']), 
  SeguimientoController.getById
);

// POST /: Solo Admins pueden crear un seguimiento (Moderadores solo actualizan)
router.post(
  "/", 
  isAuthenticated, 
  hasRole(['admin']), 
  SeguimientoController.create
);

// PUT /:id: Admins (full) y Moderadores (limitado) pueden actualizar
// La lógica de permisos irá en el CONTROLLER
router.put(
  "/:id", 
  isAuthenticated, 
  hasRole(['admin', 'moderador']), // Monitores NO pueden actualizar
  SeguimientoController.update
);

// DELETE /:id: Solo Admins pueden eliminar un seguimiento
router.delete(
  "/:id", 
  isAuthenticated, 
  hasRole(['admin']), 
  SeguimientoController.delete
);

export default router;