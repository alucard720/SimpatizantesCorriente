import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/Auth";
import { api, message } from "../services/api";
import type { Status } from "../types";
export const statusLabels: Record<Status, string> = {
  PENDING: "Pendientes",
  VERIFIED: "Verificados",
  ARCHIVED: "Archivados",
};
export function Dashboard() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<
      { status: Status; _count: { _all: number } }[]
    >([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    void api<typeof counts>("/private/dashboard")
      .then(setCounts)
      .catch((e) => setError(message(e)))
      .finally(() => setLoading(false));
  }, []);
  return (
    <>
      <span className="eyebrow">VISTA GENERAL</span>
      <h1>Tu comunidad, en perspectiva.</h1>
      <p className="lead">
        {user?.role === "ADMIN"
          ? "Resumen general de los registros recibidos."
          : "Resumen de los municipios asignados a tu líder."}
      </p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="stats">
        {Object.entries(statusLabels).map(([key, label]) => (
          <div className="card stat" key={key}>
            <span>{label}</span>
            <strong>
              {loading
                ? "…"
                : (counts.find((c) => c.status === key)?._count._all ?? 0)}
            </strong>
            <small>Registros en tu ámbito</small>
          </div>
        ))}
      </div>
      <section className="card">
        <h2>Gestión de registros</h2>
        <p>
          Consulta y revisa los registros de tu ámbito. Los datos de contacto no
          aparecen en los listados.
        </p>
        <Link
          className="button primary"
          to={user?.role === "ADMIN" ? "/admin/registros" : "/lider"}
        >
          Ver registros →
        </Link>
      </section>
    </>
  );
}
