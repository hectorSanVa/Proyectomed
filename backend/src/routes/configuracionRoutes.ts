import { Router } from 'express';
import { configuracionController } from '../controllers/configuracionController';

const router = Router();

// Obtener todas las configuraciones
router.get('/', configuracionController.getAll);

// Obtener configuración por clave
router.get('/clave/:clave', configuracionController.getByClave);

// Obtener configuración como objeto simple
router.get('/data', configuracionController.getConfigData);

// Actualizar configuración
router.put('/data', configuracionController.updateConfigData);

export default router;

