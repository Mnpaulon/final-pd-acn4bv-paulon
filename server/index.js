
// server/index.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import "./db/database.js";

import { login } from "./auth.controller.js";
import productosRouter from "./productos.routes.js";
import usuariosRouter from "./usuarios.routes.js";

const app = express();
const PORT = 3000;

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// ----------------------
// Rutas de la API
// ----------------------

// Login (devuelve token JWT)
app.post("/api/login", login);

// Productos (todas protegidas por verificarToken dentro del router)
app.use("/api/productos", productosRouter);

// Usuarios (gestión solo para admin)
app.use("/api/usuarios", usuariosRouter);

// ----------------------
// 404 - Ruta no encontrada
// ----------------------
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// ----------------------
// Manejo global de errores (extra prolijo, opcional)
// ----------------------
app.use((err, req, res, next) => {
  console.error("Error global:", err);

  if (err.type === "entity.parse.failed") {
    return res
      .status(400)
      .json({ error: "JSON inválido en el cuerpo de la petición" });
  }

  res.status(500).json({ error: "Error interno del servidor" });
});

// ----------------------
// Levantar servidor
// ----------------------
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});
