

import bcrypt from "bcryptjs";
import { dbAll, dbGet, dbRun } from "./db/database.js";

// Normaliza roles permitidos
function normalizarRol(role) {
  const r = String(role || "").toLowerCase().trim();
  if (r === "admin") return "admin";
  return "usuario"; // default
}

// GET /api/usuarios
export async function getUsuarios(req, res) {
  try {
    // Devolvemos SIN password_hash
    const usuarios = await dbAll(
      "SELECT id, username, role FROM usuarios ORDER BY id ASC"
    );
    return res.json(usuarios);
  } catch (error) {
    console.error("Error cargando usuarios:", error);
    return res.status(500).json({ error: "No se pudieron cargar los usuarios" });
  }
}

// POST /api/usuarios
export async function crearUsuario(req, res) {
  try {
    const { username, password, role } = req.body || {};

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Usuario y contraseña son obligatorios" });
    }

    const usernameClean = String(username).trim();

    // Evitar duplicados
    const existente = await dbGet(
      "SELECT id FROM usuarios WHERE username = ?",
      [usernameClean]
    );
    if (existente) {
      return res.status(400).json({ error: "El usuario ya existe" });
    }

    const roleClean = normalizarRol(role);

    // Hash password
    const hash = await bcrypt.hash(String(password), 10);

    const result = await dbRun(
      "INSERT INTO usuarios (username, password_hash, role) VALUES (?,?,?)",
      [usernameClean, hash, roleClean]
    );

    const creado = await dbGet(
      "SELECT id, username, role FROM usuarios WHERE id = ?",
      [result.id]
    );

    return res.status(201).json(creado);
  } catch (error) {
    console.error("Error creando usuario:", error);
    return res.status(500).json({ error: "No se pudo crear el usuario" });
  }
}

// DELETE /api/usuarios/:id
export async function eliminarUsuario(req, res) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    // No permitir borrarse a sí mismo (si el middleware pone req.user)
    if (req.user && Number(req.user.id) === id) {
      return res.status(400).json({ error: "No podés eliminar tu propia cuenta" });
    }

    const existe = await dbGet(
      "SELECT id, role FROM usuarios WHERE id = ?",
      [id]
    );
    if (!existe) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // NO permitir eliminar al único admin
    if (existe.role === "admin") {
      const row = await dbGet(
        "SELECT COUNT(*) AS total FROM usuarios WHERE role = 'admin'"
      );
      const totalAdmins = row?.total ?? 0;

      if (totalAdmins <= 1) {
        return res
          .status(400)
          .json({ error: "No se puede eliminar el único usuario administrador" });
      }
    }

    await dbRun("DELETE FROM usuarios WHERE id = ?", [id]);
    return res.json({ mensaje: "Usuario eliminado" });
  } catch (error) {
    console.error("Error eliminando usuario:", error);
    return res.status(500).json({ error: "No se pudo eliminar el usuario" });
  }
}
