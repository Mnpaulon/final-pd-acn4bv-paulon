

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { dbGet } from "./db/database.js";

// Clave secreta para firmar el token (en la vida real va en variables de entorno)
const JWT_SECRET = "clave-super-secreta-del-parcial";

// LOGIN: POST /api/login
export async function login(req, res) {
  try {
    const { username, password } = req.body || {};

    // Validación básica
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Usuario y contraseña son obligatorios" });
    }

    // Buscar usuario en SQLite
    const usuario = await dbGet(
      "SELECT id, username, password_hash, role FROM usuarios WHERE username = ?",
      [String(username).trim()]
    );

    if (!usuario) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const ok = await bcrypt.compare(String(password), usuario.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Payload del token (NO incluimos password_hash)
    const payload = {
      id: usuario.id,
      username: usuario.username,
      role: usuario.role || "usuario",
    };

    // Generar token JWT (expira en 1 hora)
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

    return res.json({
      mensaje: "Login exitoso",
      token,
      user: payload,
    });
  } catch (err) {
    console.error("Error en login:", err);
    return res.status(500).json({ error: "Error interno en login" });
  }
}

export { JWT_SECRET };
