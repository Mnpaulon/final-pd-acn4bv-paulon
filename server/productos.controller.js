

import { dbAll, dbGet, dbRun } from "./db/database.js";


// VALIDACIÓN

function validarProducto({ nombre, precio, categoria, stock }) {
  const errores = [];

  if (!nombre || !String(nombre).trim()) {
    errores.push("Nombre es obligatorio");
  }

  if (!categoria || !String(categoria).trim()) {
    errores.push("Categoría es obligatoria");
  }

  const pr = Number(precio);
  if (!Number.isFinite(pr) || pr < 0) {
    errores.push("El precio debe ser un número válido (>= 0)");
  }

  const st = Number(stock);
  if (!Number.isInteger(st) || st < 0) {
    errores.push("El stock debe ser un número entero >= 0");
  }

  return errores;
}


// HELPER: obtener o crear categoría

async function obtenerCategoriaId(nombreCategoria) {
  const cat = await dbGet(
    "SELECT id FROM categorias WHERE nombre = ?",
    [nombreCategoria]
  );

  if (cat) return cat.id;

  // Si no existe, la creamos
  const result = await dbRun(
    "INSERT INTO categorias (nombre) VALUES (?)",
    [nombreCategoria]
  );

  return result.id;
}


// GET /api/productos

export async function getProductos(req, res) {
  try {
    const productos = await dbAll(
      `SELECT 
          p.id,
          p.nombre,
          p.precio,
          p.stock,
          c.nombre AS categoria
        FROM productos p
        JOIN categorias c ON c.id = p.categoria_id
        ORDER BY p.id ASC`
    );

    res.json(productos);
  } catch (err) {
    console.error("Error al obtener productos:", err);
    res.status(500).json({ error: "Error al obtener productos" });
  }
}


// GET /api/productos/:id  (para vista detalle)

export async function getProductoPorId(req, res) {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const producto = await dbGet(
      `SELECT 
          p.id,
          p.nombre,
          p.precio,
          p.stock,
          c.nombre AS categoria
        FROM productos p
        JOIN categorias c ON c.id = p.categoria_id
        WHERE p.id = ?`,
      [id]
    );

    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(producto);
  } catch (err) {
    console.error("Error al obtener producto por ID:", err);
    res.status(500).json({ error: "Error interno" });
  }
}


// POST /api/productos

export async function crearProducto(req, res) {
  try {
    const errores = validarProducto(req.body);
    if (errores.length) {
      return res.status(400).json({ error: errores.join(". ") });
    }

    const { nombre, precio, categoria, stock } = req.body;

    // Obtener ID de categoría (crea si no existe)
    const categoriaId = await obtenerCategoriaId(categoria);

    const result = await dbRun(
      `INSERT INTO productos (nombre, precio, stock, categoria_id)
       VALUES (?, ?, ?, ?)`,
      [nombre.trim(), Number(precio), Number(stock), categoriaId]
    );

    const nuevo = {
      id: result.id,
      nombre: nombre.trim(),
      categoria,
      precio: Number(precio),
      stock: Number(stock),
    };

    res.status(201).json(nuevo);
  } catch (err) {
    console.error("Error al crear producto:", err);
    res.status(500).json({ error: "Error al crear producto" });
  }
}


// PUT /api/productos/:id

export async function actualizarProducto(req, res) {
  try {
    const id = Number(req.params.id);
    const { nombre, precio, categoria, stock } = req.body;

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const errores = validarProducto({ nombre, precio, categoria, stock });
    if (errores.length) {
      return res.status(400).json({ error: errores.join(". ") });
    }

    const existe = await dbGet("SELECT id FROM productos WHERE id = ?", [id]);
    if (!existe) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const categoriaId = await obtenerCategoriaId(categoria);

    await dbRun(
      `UPDATE productos
       SET nombre = ?, precio = ?, stock = ?, categoria_id = ?
       WHERE id = ?`,
      [nombre.trim(), Number(precio), Number(stock), categoriaId, id]
    );

    res.json({
      id,
      nombre: nombre.trim(),
      categoria,
      precio: Number(precio),
      stock: Number(stock),
    });
  } catch (err) {
    console.error("Error al actualizar producto:", err);
    res.status(500).json({ error: "Error al actualizar producto" });
  }
}


// DELETE /api/productos/:id

export async function eliminarProducto(req, res) {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const result = await dbRun("DELETE FROM productos WHERE id = ?", [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({
      mensaje: "Producto eliminado correctamente",
      id,
    });
  } catch (err) {
    console.error("Error al eliminar producto:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}
