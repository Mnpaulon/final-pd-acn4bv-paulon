
// server/db/database.js
import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

sqlite3.verbose();

// Resolver ruta absoluta del archivo de base de datos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, "database.db");

// Crear conexión a la base de datos
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("❌ Error conectando a SQLite:", err);
  } else {
    console.log("✅ Conectado a SQLite en", DB_PATH);
  }
});

db.serialize(() => {
 
  // TABLA CATEGORIAS

  db.run(
    `CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE
    )`,
    (err) => {
      if (err) console.error("❌ Error creando tabla categorias:", err);
      else console.log("✔ Tabla categorias verificada/creada");
    }
  );


  // TABLA PRODUCTOS (FK categorias)

  db.run(
    `CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      precio REAL NOT NULL,
      stock INTEGER NOT NULL,
      categoria_id INTEGER NOT NULL,
      FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    )`,
    (err) => {
      if (err) console.error("❌ Error creando tabla productos:", err);
      else console.log("✔ Tabla productos verificada/creada");
    }
  );


  // TABLA USUARIOS (3ra tabla)

  db.run(
    `CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin','usuario'))
    )`,
    (err) => {
      if (err) console.error("❌ Error creando tabla usuarios:", err);
      else console.log("✔ Tabla usuarios verificada/creada");
    }
  );


  // SEED: categorias por defecto

  db.all("SELECT COUNT(*) AS total FROM categorias", (err, rows) => {
    if (err) {
      console.error("❌ Error contando categorias:", err);
      return;
    }

    const total = rows?.[0]?.total ?? 0;
    if (total === 0) {
      const defaults = ["Electrónica", "Hogar", "Deportes", "Otros"];
      const stmt = db.prepare("INSERT INTO categorias (nombre) VALUES (?)");
      defaults.forEach((nombre) => stmt.run(nombre));
      stmt.finalize((err2) => {
        if (err2) console.error("❌ Error insertando categorías:", err2);
        else console.log("✔ Categorías por defecto insertadas");
      });
    }
  });


  // SEED: admin por defecto si no hay usuarios

  db.get("SELECT COUNT(*) AS total FROM usuarios", async (err, row) => {
    if (err) {
      console.error("❌ Error contando usuarios:", err);
      return;
    }

    const total = row?.total ?? 0;
    if (total === 0) {
      try {
        const hash = await bcrypt.hash("admin123", 10);
        db.run(
          "INSERT INTO usuarios (username, password_hash, role) VALUES (?,?,?)",
          ["admin", hash, "admin"],
          (err2) => {
            if (err2) console.error("❌ Error creando admin seed:", err2);
            else console.log("✔ Usuario admin por defecto creado (admin/admin123)");
          }
        );
      } catch (e) {
        console.error("❌ Error hasheando password seed:", e);
      }
    }
  });
});

// Helpers async/await
export function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

export function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

export default db;
