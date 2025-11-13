import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error("❌ Error en el servidor:", err);
  
  // Si la respuesta ya fue enviada, delegar al manejador de errores por defecto de Express
  if (res.headersSent) {
    return next(err);
  }
  
  // Determinar el código de estado
  const statusCode = err.statusCode || err.status || 500;
  
  // Respuesta de error
  res.status(statusCode).json({
    message: err.message || "Error interno del servidor",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
}

// Middleware para manejar rutas no encontradas (404)
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  res.status(404).json({
    message: `Ruta no encontrada: ${req.method} ${req.path}`,
    error: "Not Found",
  });
}
