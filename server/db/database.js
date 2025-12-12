
// server/db/database.js
import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

sqlite3.verbose();

// Resolver ruta absoluta del archivo de base de datos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, "database.db");

// Crear conexión a la base de datos (si no existe, la crea)
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("❌ Error conectando a SQLite:", err);
  } else {
    console.log("✅ Conectado a SQLite en", DB_PATH);
  }
});

// Activar llaves foráneas
db.run("PRAGMA foreign_keys = ON");

// Crear tablas si no existen
db.serialize(() => {
  // ===============================
  // TABLA: categorias
  // ===============================
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

  // ===============================
  // TABLA: productos (FK categoria_id)
  // ===============================
  db.run(
    `CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      precio REAL NOT NULL,
      stock INTEGER NOT NULL,
      categoria_id INTEGER,
      FOREIGN KEY (categoria_id)
        REFERENCES categorias(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
    )`,
    (err) => {
      if (err) console.error("❌ Error creando tabla productos:", err);
      else console.log("✔ Tabla productos verificada/creada");
    }
  );

  // ===============================
  // Insertar categorías por defecto
  // ===============================
  db.get("SELECT COUNT(*) AS total FROM categorias", (err, row) => {
    if (err) {
      console.error("❌ Error contando categorias:", err);
      return;
    }

    if (row.total === 0) {
      console.log("ℹ Insertando categorías por defecto...");

      const defaults = ["Electrónica", "Hogar", "Deportes", "Otros"];
      const stmt = db.prepare("INSERT INTO categorias (nombre) VALUES (?)");

      defaults.forEach((nombre) => stmt.run(nombre));

      stmt.finalize((err2) => {
        if (err2)
          console.error("❌ Error insertando categorías por defecto:", err2);
        else console.log("✔ Categorías por defecto insertadas");
      });
    }
  });
});

// ===============================
// Helpers async/await para controllers
// ===============================
export function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

export function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
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
