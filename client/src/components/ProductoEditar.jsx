
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProductoEditar({ producto, onUpdated, onCancel }) {
  const { token } = useAuth();

  const [nombre, setNombre] = useState(producto?.nombre ?? "");
  const [categoria, setCategoria] = useState(producto?.categoria ?? "");
  const [precio, setPrecio] = useState(String(producto?.precio ?? ""));
  const [stock, setStock] = useState(String(producto?.stock ?? ""));
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function validarCampos() {
    const errores = [];

    if (!nombre.trim()) errores.push("El nombre es obligatorio.");
    if (!categoria.trim()) errores.push("La categoría es obligatoria.");

    const precioNum = Number(precio);
    if (!Number.isFinite(precioNum) || precioNum <= 0) {
      errores.push("El precio debe ser mayor a 0.");
    }

    const stockNum = Number(stock);
    if (!Number.isInteger(stockNum) || stockNum <= 0) {
      errores.push("El stock debe ser un entero mayor a 0.");
    }

    if (errores.length) {
      setError(errores.join(" "));
      return false;
    }

    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!validarCampos()) return;

    try {
      setLoading(true);

      const res = await fetch(
        `http://localhost:3000/api/productos/${producto.id}`,
        {
          method: "PUT", // 👈 IMPORTANTE: coincide con el backend
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            nombre: nombre.trim(),
            categoria: categoria.trim(),
            precio: Number(precio),
            stock: Number(stock),
          }),
        }
      );

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error || "Error al actualizar producto.");
      }

      if (onUpdated) onUpdated(body);
    } catch (err) {
      console.error("Error al actualizar producto:", err);
      setError(err.message || "No se pudo actualizar el producto.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form-panel">
      <div className="form-group">
        <label className="form-label">
          Nombre
          <input
            type="text"
            className="form-input"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </label>
      </div>

      <div className="form-group">
        <label className="form-label">
          Categoría
          <input
            type="text"
            className="form-input"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          />
        </label>
      </div>

      <div className="form-group">
        <label className="form-label">
          Precio
          <input
            type="number"
            className="form-input"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            min="1"
            step="0.01"
          />
        </label>
      </div>

      <div className="form-group">
        <label className="form-label">
          Stock
          <input
            type="number"
            className="form-input"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            min="1"
            step="1"
          />
        </label>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
