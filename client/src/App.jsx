
import { Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import InventarioPage from "./pages/InventarioPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ProductoDetalle from "./pages/ProductoDetalle.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import "./App.css";

function AppHeader() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  const isLoginPage = location.pathname === "/login";

  return (
    <header className="app-header">
      <div className="app-header-inner">
        {/* Logo que lleva al inventario (si está logueado) o al login */}
        <Link
          to={user ? "/inventario" : "/login"}
          className="app-logo"
        >
          <span className="app-logo-dot" />
          <span className="app-logo-text">Inventario</span>
        </Link>

        <nav className="app-nav">
          {!user && !isLoginPage && (
            <Link to="/login" className="btn btn-primary app-nav-logout">
              Login
            </Link>
          )}

          {user && (
            <button
              type="button"
              className="btn btn-primary app-nav-logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  const { user } = useAuth();

  return (
    <>
      <AppHeader />
      <main className="app-main">
        <Routes>
          {/* Rutas protegidas: requieren user */}
          <Route
            path="/"
            element={user ? <InventarioPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/inventario"
            element={user ? <InventarioPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/producto/:id"
            element={user ? <ProductoDetalle /> : <Navigate to="/login" replace />}
          />

          {/* Login siempre accesible */}
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </main>
    </>
  );
}
