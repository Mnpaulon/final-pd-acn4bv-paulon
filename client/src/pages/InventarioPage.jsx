
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import ProductoForm from "../components/ProductoForm.jsx";
import ProductoEditar from "../components/ProductoEditar.jsx";
import "./InventarioPage.css";

export default function InventarioPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [editando, setEditando] = useState(null);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  // pestaña activa: "productos" | "usuarios"
  const [activeTab, setActiveTab] = useState("productos");

  // estado para gestión de usuarios
  const [usuarios, setUsuarios] = useState([]);
  const [nuevoUsername, setNuevoUsername] = useState("");
  const [nuevoPassword, setNuevoPassword] = useState("");
  const [nuevoRol, setNuevoRol] = useState("admin");

  const isLoggedIn = !!user;
  const isAdmin = isLoggedIn && user.role === "admin";

  
  // Mensajes globales
  
  function mostrarMensaje(tipo, texto) {
    setMensaje({ tipo, texto });
    setTimeout(() => {
      setMensaje(null);
    }, 3000);
  }

  
  // Productos
  
  async function cargarProductos() {
    try {
      if (!isLoggedIn || !token) {
        setProductos([]);
        mostrarMensaje(
          "error",
          "Necesitás iniciar sesión para ver los productos."
        );
        return;
      }

      const res = await fetch("http://localhost:3000/api/productos", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setProductos([]);
        mostrarMensaje(
          "error",
          "Tu sesión no es válida o expiró. Volvé a iniciar sesión."
        );
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Error al obtener productos");
      }

      if (!Array.isArray(data)) {
        console.error("Respuesta inesperada de /api/productos:", data);
        throw new Error("Formato de respuesta inesperado");
      }

      setProductos(data);
    } catch (err) {
      console.error("Error al cargar productos:", err);
      mostrarMensaje("error", "No se pudieron cargar los productos.");
      setProductos([]);
    }
  }

  async function eliminar(id) {
    if (!isLoggedIn) {
      mostrarMensaje("error", "Debes iniciar sesión para eliminar productos.");
      return;
    }

    const confirmar = window.confirm(
      "¿Estás seguro de que querés eliminar este producto?"
    );
    if (!confirmar) return;

    try {
      const res = await fetch(`http://localhost:3000/api/productos/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Error al eliminar producto");
      }

      await cargarProductos();
      mostrarMensaje("ok", "Producto eliminado correctamente.");
    } catch (err) {
      console.error(err);
      mostrarMensaje("error", "No se pudo eliminar el producto.");
    }
  }

  function handleCreated(nuevo) {
    setProductos((prev) => [...prev, nuevo]);
    setMostrarFormNuevo(false);
    mostrarMensaje("ok", "Producto creado correctamente.");
  }

  function handleUpdated(actualizado) {
    setProductos((prev) =>
      prev.map((p) => (p.id === actualizado.id ? actualizado : p))
    );
    setEditando(null);
    mostrarMensaje("ok", "Producto actualizado correctamente.");
  }

  function handleNuevoProducto() {
    setEditando(null);
    setMostrarFormNuevo(true);
  }

  function handleEditarProducto(prod) {
    setMostrarFormNuevo(false);
    setEditando(prod);
  }

  const productosFiltrados = Array.isArray(productos)
    ? productos.filter((p) => {
        const texto = (p.nombre || "").toLowerCase();
        return texto.includes(filtroNombre.toLowerCase());
      })
    : [];

  
  // Gestión de usuarios
  
  async function cargarUsuarios() {
    if (!isAdmin) return;

    try {
      const res = await fetch("http://localhost:3000/api/usuarios", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await res.json().catch(() => ({}));

      // Manejo explícito de 401/403
      if (res.status === 401 || res.status === 403) {
        setUsuarios([]);
        mostrarMensaje(
          "error",
          data.error || "No estás autorizado a ver usuarios."
        );
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Error al cargar usuarios");
      }

      if (!Array.isArray(data)) {
        throw new Error("Respuesta inesperada del servidor de usuarios");
      }

      setUsuarios(data);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      setUsuarios([]); // siempre dejamos array
      mostrarMensaje("error", "No se pudieron cargar los usuarios.");
    }
  }

  async function handleCrearUsuario(e) {
    e.preventDefault();

    if (!nuevoUsername || !nuevoPassword) {
      mostrarMensaje("error", "Usuario y contraseña son obligatorios.");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/api/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          username: nuevoUsername,
          password: nuevoPassword,
          role: nuevoRol.toLowerCase(),
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.error || "Error al crear usuario");
      }

      const creado = await res.json();
      setUsuarios((prev) => [...prev, creado]);
      setNuevoUsername("");
      setNuevoPassword("");
      setNuevoRol("admin");
      mostrarMensaje("ok", "Usuario creado correctamente.");
    } catch (err) {
      console.error("Error al crear usuario:", err);
      mostrarMensaje("error", err.message || "No se pudo crear el usuario.");
    }
  }

  async function handleEliminarUsuario(id) {
    // No permitir borrarse a sí mismo
    if (user && user.id === id) {
      mostrarMensaje(
        "error",
        "No podés eliminar tu propia cuenta de administrador."
      );
      return;
    }

    const confirmar = window.confirm(
      "¿Estás seguro de que querés eliminar este usuario?"
    );
    if (!confirmar) return;

    try {
      const res = await fetch(`http://localhost:3000/api/usuarios/${id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Error al eliminar usuario");
      }

      setUsuarios((prev) => prev.filter((u) => u.id !== id));
      mostrarMensaje("ok", "Usuario eliminado correctamente.");
    } catch (err) {
      console.error("Error al eliminar usuario:", err);
      mostrarMensaje("error", "No se pudo eliminar el usuario.");
    }
  }

  
  // Efectos
  
  useEffect(() => {
    if (isLoggedIn && token) {
      cargarProductos();
    } else {
      setProductos([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, token]);

  // Cargar usuarios solo cuando soy admin y estoy en la pestaña Usuarios
  useEffect(() => {
    if (isAdmin && activeTab === "usuarios") {
      cargarUsuarios();
    }
  }, [isAdmin, activeTab]);

  // Si se desloguea mientras estaba en "usuarios", vuelvo a "productos"
  useEffect(() => {
    if (!isLoggedIn && activeTab === "usuarios") {
      setActiveTab("productos");
    }
  }, [isLoggedIn, activeTab]);

  
  // Render
  
  return (
    <div className="inventario-layout">
      {/* SIDEBAR */}
      <aside className="inventario-sidebar">
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">📦</span>
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-title">Inventario</span>
            <span className="sidebar-logo-subtitle">Panel interno</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={
              activeTab === "productos"
                ? "sidebar-nav-item sidebar-nav-item--active"
                : "sidebar-nav-item"
            }
            onClick={() => setActiveTab("productos")}
          >
            <span>Productos</span>
          </button>

          {isAdmin && (
            <button
              className={
                activeTab === "usuarios"
                  ? "sidebar-nav-item sidebar-nav-item--active"
                  : "sidebar-nav-item"
              }
              onClick={() => setActiveTab("usuarios")}
            >
              <span>Usuarios</span>
            </button>
          )}
        </nav>

        <div className="sidebar-footer">
          <span className="sidebar-user">
            <span className="sidebar-user-avatar">
              {(user?.username || "M").charAt(0).toUpperCase()}
            </span>
            <span className="sidebar-user-name">
              {user ? user.username : "Invitado"}
            </span>
          </span>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="inventario-main">
        <div className="inventario-container">
          {/* MENSAJE GLOBAL */}
          {mensaje && (
            <div
              className={`inventario-alert ${
                mensaje.tipo === "ok"
                  ? "inventario-alert--ok"
                  : "inventario-alert--error"
              }`}
            >
              {mensaje.texto}
            </div>
          )}

          {/*  TABLA PRODUCTOS  */}
          {activeTab === "productos" && (
            <>
              <header className="inventario-header">
                <div>
                  <p className="inventario-kicker">Panel de control</p>
                  <h1 className="inventario-title">Gestión de inventario</h1>
                  <p className="inventario-subtitle">
                    Visualizá tus productos. Para modificarlos necesitás iniciar
                    sesión.
                  </p>
                </div>

                <div className="inventario-header-actions">
                  <div className="inventario-search">
                    <span className="inventario-search-icon">🔍</span>
                    <input
                      type="text"
                      placeholder="Buscar por nombre..."
                      value={filtroNombre}
                      onChange={(e) => setFiltroNombre(e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={cargarProductos}
                  >
                    ↻ Recargar
                  </button>

                  {isLoggedIn ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleNuevoProducto}
                    >
                      + Nuevo producto
                    </button>
                  ) : (
                    <span className="inventario-readonly-badge">
                      Modo lectura (logueate para editar)
                    </span>
                  )}
                </div>
              </header>

              {isLoggedIn && mostrarFormNuevo && (
                <section className="inventario-form-card">
                  <h2 className="inventario-form-title">Crear nuevo producto</h2>
                  <ProductoForm onCreated={handleCreated} />
                </section>
              )}

              {isLoggedIn && editando && (
                <section className="inventario-form-card">
                  <h2 className="inventario-form-title">
                    Editar producto: {editando.nombre}
                  </h2>
                  <ProductoEditar
                    producto={editando}
                    onUpdated={handleUpdated}
                    onCancel={() => setEditando(null)}
                  />
                </section>
              )}

              <section className="inventario-resumen">
                <div className="inventario-card">
                  <span className="inventario-card-label">
                    Total de productos
                  </span>
                  <span className="inventario-card-value">
                    {productos.length}
                  </span>
                  <span className="inventario-card-helper">
                    Registrados en el sistema
                  </span>
                </div>

                <div className="inventario-card">
                  <span className="inventario-card-label">Stock global</span>
                  <span className="inventario-card-value">
                    {productos.reduce(
                      (total, p) => total + (p.stock || 0),
                      0
                    )}
                  </span>
                  <span className="inventario-card-helper">
                    Unidades disponibles
                  </span>
                </div>

                <div className="inventario-card">
                  <span className="inventario-card-label">Valor estimado</span>
                  <span className="inventario-card-value">
                    $
                    {productos
                      .reduce(
                        (total, p) => total + (p.stock || 0) * (p.precio || 0),
                        0
                      )
                      .toLocaleString("es-AR")}
                  </span>
                  <span className="inventario-card-helper">
                    Stock valorizado
                  </span>
                </div>
              </section>

              <section className="inventario-table-card">
                <div className="inventario-table-header">
                  <div>
                    <h2>Listado de productos</h2>
                    <p>Administrá los datos básicos de cada ítem.</p>
                  </div>
                </div>

                <div className="inventario-table-wrapper">
                  <table className="inventario-table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Categoría</th>
                        <th>Stock</th>
                        <th>Precio</th>
                        <th className="th-actions">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productosFiltrados.map((producto) => (
                        <tr key={producto.id}>
                          <td>{producto.nombre}</td>
                          <td>{producto.categoria}</td>
                          <td>{producto.stock}</td>
                          <td>
                            ${producto.precio?.toLocaleString("es-AR")}
                          </td>
                          <td className="td-actions">
                            {isLoggedIn ? (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-ghost"
                                  onClick={() =>
                                    navigate(`/producto/${producto.id}`)
                                  }
                                >
                                  Ver detalle
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost"
                                  onClick={() =>
                                    handleEditarProducto(producto)
                                  }
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger"
                                  onClick={() => eliminar(producto.id)}
                                >
                                  Eliminar
                                </button>
                              </>
                            ) : (
                              <span className="acciones-lectura">
                                Login para editar
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}

                      {productosFiltrados.length === 0 && (
                        <tr>
                          <td colSpan={5} className="inventario-empty">
                            No se encontraron productos para el criterio de
                            búsqueda.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {/* TABLA USUARIOS (ADMIN)  */}
          {activeTab === "usuarios" && isAdmin && (
            <section className="inventario-users-card">
              <div className="inventario-users-header">
                <h2>Gestión de usuarios</h2>
                <p>
                  Creá nuevos usuarios con acceso al inventario. Solo los
                  administradores pueden ver esta sección.
                </p>
              </div>

              {/* FORMULARIO */}
              <form
                className="usuarios-form"
                onSubmit={handleCrearUsuario}
                autoComplete="off"
              >
                <div className="usuarios-form-field">
                  <label>
                    Usuario
                    <input
                      type="text"
                      value={nuevoUsername}
                      onChange={(e) => setNuevoUsername(e.target.value)}
                      placeholder="Nombre de usuario"
                    />
                  </label>
                </div>

                <div className="usuarios-form-field">
                  <label>
                    Contraseña
                    <input
                      type="password"
                      value={nuevoPassword}
                      onChange={(e) => setNuevoPassword(e.target.value)}
                      placeholder="Contraseña"
                    />
                  </label>
                </div>

                <div className="usuarios-form-field">
                  <label>
                    Rol
                    <select
                      value={nuevoRol}
                      onChange={(e) => setNuevoRol(e.target.value)}
                    >
                      <option value="admin">Admin</option>
                      <option value="usuario">Usuario</option>
                    </select>
                  </label>
                </div>

                <button type="submit" className="usuarios-create-btn">
                  Crear usuario
                </button>
              </form>

              {/* TABLA */}
              <table className="usuarios-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {!Array.isArray(usuarios) || usuarios.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        style={{
                          textAlign: "center",
                          padding: "1rem",
                          color: "#9ca3af",
                        }}
                      >
                        No hay usuarios cargados.
                      </td>
                    </tr>
                  ) : (
                    usuarios.map((u) => {
                      const esActual =
                        user && Number(user.id) === Number(u.id);

                      return (
                        <tr key={u.id}>
                          <td>{u.id}</td>
                          <td>{u.username}</td>
                          <td>{u.role}</td>
                          <td>
                            {esActual ? (
                              <span className="tag-cuenta-actual">
                                Cuenta actual
                              </span>
                            ) : (
                              <button
                                className="btn-outline-danger"
                                type="button"
                                onClick={() => handleEliminarUsuario(u.id)}
                              >
                                Eliminar
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
