import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import usuarioRoutes from "./routes/usuarioRoutes";
import categoriaRoutes from "./routes/categoriaRoutes";
import estadoRoutes from "./routes/estadoRoutes";
import comunicacionRoutes from "./routes/comunicacionRoutes";
import evidenciaRoutes from "./routes/evidenciaRoutes";
import seguimientoRoutes from "./routes/seguimientoRoutes";
import comisionRoutes from "./routes/comisionRoutes";
import folioRoutes from "./routes/folioRoutes";
import historialEstadoRoutes from "./routes/historialEstadoRoutes";
import authRoutes from "./routes/authRoutes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos de uploads
import path from "path";
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Rutas
app.use("/auth", authRoutes);
app.use("/usuarios", usuarioRoutes);
app.use("/categorias", categoriaRoutes);
app.use("/estados", estadoRoutes);
app.use("/comunicaciones", comunicacionRoutes);
app.use("/evidencias", evidenciaRoutes);
app.use("/seguimientos", seguimientoRoutes);
app.use("/comisiones", comisionRoutes);
app.use("/folios", folioRoutes);
app.use("/historial-estados", historialEstadoRoutes);

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
