
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./ProductoDetalle.css";

export default function ProductoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [producto, setProducto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function cargarDetalle() {
      try {
        if (!token) {
          setError("Debés iniciar sesión para ver el detalle.");
          setCargando(false);
          return;
        }

        const res = await fetch(`http://localhost:3000/api/productos/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.error || "No se pudo obtener el producto");
        }

        setProducto(data);
        setError(null);
      } catch (err) {
        console.error("Error cargando detalle:", err);
        setError(err.message || "Error al cargar el detalle");
      } finally {
        setCargando(false);
      }
    }

    cargarDetalle();
  }, [id, token]);

  function volverAlListado() {
    navigate("/inventario");
  }

  return (
    <div className="detalle-layout">
      <div className="detalle-container">
        <header className="detalle-header">
          <div>
            <p className="detalle-kicker">Inventario · Detalle</p>
            <h1 className="detalle-title">Detalle de producto</h1>
            <p className="detalle-subtitle">
              Visualizá la información completa del ítem seleccionado.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-ghost detalle-back-btn"
            onClick={volverAlListado}
          >
            ← Volver al listado
          </button>
        </header>

        {cargando && (
          <div className="detalle-card detalle-card--loading">
            Cargando información del producto...
          </div>
        )}

        {!cargando && error && (
          <div className="detalle-card detalle-card--error">
            <p>{error}</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={volverAlListado}
            >
              Volver al listado
            </button>
          </div>
        )}

        {!cargando && !error && producto && (
          <section className="detalle-card detalle-card--main">
            <div className="detalle-meta">
              <span className="detalle-id">ID #{producto.id}</span>
              <span className="detalle-category-badge">
                {producto.categoria || "Sin categoría"}
              </span>
            </div>

            <h2 className="detalle-product-name">
              {producto.nombre || "Sin nombre"}
            </h2>

            <div className="detalle-grid">
              <div className="detalle-field">
                <span className="detalle-label">Nombre</span>
                <span className="detalle-value">
                  {producto.nombre || "—"}
                </span>
              </div>

              <div className="detalle-field">
                <span className="detalle-label">Categoría</span>
                <span className="detalle-value">
                  {producto.categoria || "—"}
                </span>
              </div>

              <div className="detalle-field">
                <span className="detalle-label">Precio</span>
                <span className="detalle-value detalle-value--price">
                  $
                  {Number(producto.precio || 0).toLocaleString("es-AR", {
                    minimumFractionDigits: 0,
                  })}
                </span>
              </div>

              <div className="detalle-field">
                <span className="detalle-label">Stock disponible</span>
                <span className="detalle-value detalle-value--stock">
                  {producto.stock ?? 0}
                </span>
              </div>
            </div>

            <footer className="detalle-footer">
              <p className="detalle-helper">
                Esta vista es sólo de lectura. Cualquier cambio se realiza desde
                el listado principal.
              </p>
            </footer>
          </section>
        )}
      </div>
    </div>
  );
}
