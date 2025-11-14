import { Router } from "express";
import { ComunicacionController } from "../controllers/ComunicacionController";
// --- 1. Importar middlewares ---
import { isAuthenticated, hasRole } from "../middlewares/authMiddleware";

const router = Router();

// --- 2. Rutas Públicas (SIN protección) ---
// El público puede crear comunicaciones
router.post("/", ComunicacionController.create);
// El público puede ver reconocimientos públicos
router.get("/reconocimientos/publicos", ComunicacionController.getReconocimientosPublicos);
// El usuario puede ver sus propias comunicaciones (para la pág. "Mis Seguimientos")
router.get("/usuario/:idUsuario", ComunicacionController.getByUsuario);
// El público puede consultar por folio
router.get("/folio", ComunicacionController.getByFolio);


// --- 3. Rutas de Admin (CON protección) ---

// GET /: Admins, Monitores y Moderadores pueden ver la lista
// La lógica de "ver solo asignados" (para Moderador) irá en el CONTROLLER
router.get(
  "/", 
  isAuthenticated, 
  hasRole(['admin', 'monitor', 'moderador']), 
  ComunicacionController.getAll
);

// GET /:id: Admins, Monitores y Moderadores pueden ver detalles
router.get(
  "/:id", 
  isAuthenticated, 
  hasRole(['admin', 'monitor', 'moderador']), 
  ComunicacionController.getById
);

// PUT /:id: Solo Admins pueden actualizar una comunicación (ej. 'mostrar_publico')
router.put(
  "/:id", 
  isAuthenticated, 
  hasRole(['admin']), 
  ComunicacionController.update
);

// DELETE /:id: Solo Admins pueden eliminar una comunicación
router.delete(
  "/:id", 
  isAuthenticated, 
  hasRole(['admin']), 
  ComunicacionController.delete
);

export default router;