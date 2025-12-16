

import { Router } from "express";
import {
  getProductos,
  getProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
} from "./productos.controller.js";

import { verificarToken } from "./auth.middleware.js";

const router = Router();

// Listar todos los productos
router.get("/", verificarToken, getProductos);

// Obtener detalle de un producto por ID
router.get("/:id", verificarToken, getProductoPorId);

// Crear nuevo producto
router.post("/", verificarToken, crearProducto);

// Actualizar producto existente
router.put("/:id", verificarToken, actualizarProducto);

// Eliminar producto
router.delete("/:id", verificarToken, eliminarProducto);

export default router;
