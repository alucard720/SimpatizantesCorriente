import { Brand } from "./Brand";
import { Link, Navigate, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/Auth";
import type { Role } from "../types";
export function PublicLayout() {
  return (
    <>
      <header className="public-header">
        <Link className="brand" to="/">
          <Brand />
        </Link>
        <Link to="/login">Acceso de gestión ↗</Link>
      </header>
      <main className="public-main">
        <Outlet />
      </main>
      <footer>
        Participación voluntaria · Datos protegidos{" "}
        <Link to="/privacidad">Aviso de privacidad</Link>
      </footer>
    </>
  );
}
export function Protected({ role }: { role?: Role }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="loading">Cargando sesión…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
export function PrivateLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="workspace">
      <aside>
        <Link className="brand" to="/dashboard">
          <Brand />
        </Link>
        <p className="eyebrow">ESPACIO PRIVADO</p>
        <nav>
          <NavLink to="/dashboard">Resumen</NavLink>
          <NavLink to={user?.role === "ADMIN" ? "/admin/registros" : "/lider"}>
            Registros
          </NavLink>
          {user?.role === "ADMIN" && (
            <NavLink to="/admin">Administración</NavLink>
          )}
          <Link className="public-form-link" to="/">
            Ir al formulario público ↗
          </Link>
        </nav>
        <div className="session">
          <strong>
            {user?.firstName} {user?.lastName}
          </strong>
          <small>
            {user?.role === "ADMIN" ? "Administrador" : "Usuario de líder"}
          </small>
          <button
            className="secondary"
            onClick={() => void logout().catch(() => undefined)}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="private-main">
        <Outlet />
      </main>
    </div>
  );
}
