import { Request, Response } from 'express';
import { ConfiguracionService } from '../services/ConfiguracionService';

export const configuracionController = {
  // Obtener todas las configuraciones
  getAll: async (req: Request, res: Response) => {
    try {
      const configs = await ConfiguracionService.getAll();
      res.json(configs);
    } catch (error: any) {
      console.error('Error al obtener configuraciones:', error);
      res.status(500).json({ error: error.message || 'Error al obtener configuraciones' });
    }
  },

  // Obtener configuración por clave
  getByClave: async (req: Request, res: Response) => {
    try {
      const { clave } = req.params;
      const config = await ConfiguracionService.getByClave(clave);
      if (!config) {
        return res.status(404).json({ error: 'Configuración no encontrada' });
      }
      res.json(config);
    } catch (error: any) {
      console.error('Error al obtener configuración:', error);
      res.status(500).json({ error: error.message || 'Error al obtener configuración' });
    }
  },

  // Obtener configuración como objeto simple
  getConfigData: async (req: Request, res: Response) => {
    try {
      const config = await ConfiguracionService.getConfigData();
      res.json(config);
    } catch (error: any) {
      console.error('Error al obtener configuración:', error);
      res.status(500).json({ error: error.message || 'Error al obtener configuración' });
    }
  },

  // Actualizar configuración
  updateConfigData: async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const actualizadoPor = (req as any).user?.username || 'Sistema';
      const updatedConfig = await ConfiguracionService.updateConfigData(data, actualizadoPor);
      // Devolver directamente el objeto de configuración
      res.json(updatedConfig);
    } catch (error: any) {
      console.error('Error al actualizar configuración:', error);
      res.status(400).json({ error: error.message || 'Error al actualizar configuración' });
    }
  },
};

