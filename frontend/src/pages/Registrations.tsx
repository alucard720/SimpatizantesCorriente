import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../context/Auth";
import type { Page, Registration, Status } from "../types";
import { api, send, message } from "../services/api";
import { statusLabels } from "./Dashboard";
export function Registrations() {
  const { user } = useAuth();
  const [data, setData] = useState<Page<Registration> | null>(null),
    [page, setPage] = useState(1),
    [status, setStatus] = useState(""),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0),
    [selected, setSelected] = useState<Registration | null>(null),
    [sensitive, setSensitive] = useState<{
      cedula: string;
      phone: string;
    } | null>(null),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const c = new AbortController();
    setData(null);
    void api<Page<Registration>>(
      `/private/registrations?page=${page}&pageSize=25${status ? `&status=${status}` : ""}`,
      { signal: c.signal },
    )
      .then(setData)
      .catch((e) => {
        if (!c.signal.aborted) setError(message(e));
      });
    return () => c.abort();
  }, [page, status, revision]);
  useEffect(() => {
    if (!sensitive) return;
    const t = setTimeout(() => {
      setSensitive(null);
      setSelected(null);
    }, 60_000);
    return () => clearTimeout(t);
  }, [sensitive]);
  const update = async (id: string, value: Status) => {
    setBusy(true);
    setError("");
    try {
      await send(
        `/private/registrations/${id}/status`,
        { status: value },
        "PATCH",
      );
      setRevision((v) => v + 1);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  };
  const reveal = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      setSensitive(
        await send(`/private/registrations/${selected.id}/sensitive`, {
          reason: f.get("reason"),
        }),
      );
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <span className="eyebrow">
        {user?.role === "ADMIN" ? "ADMINISTRACIÓN" : "ÁMBITO DEL LÍDER"}
      </span>
      <h1>Registros</h1>
      <p>Consulta y revisa los registros autorizados para tu cuenta.</p>
      <div className="toolbar">
        <label>
          Estado
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos</option>
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <span>{data ? `${data.total} registros` : "Cargando…"}</span>
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Seccional</th>
              <th>Escuela</th>
              <th>Estado</th>
              {user?.role === "ADMIN" && <th>Datos protegidos</th>}
            </tr>
          </thead>
          <tbody>
            {data?.items.map((r) => (
              <tr key={r.id}>
                <td>
                  <strong>
                    {r.firstName} {r.lastName}
                  </strong>
                  <small>
                    {new Date(r.createdAt).toLocaleDateString("es-DO")}
                  </small>
                </td>
                <td>
                  {r.seccional.name}
                  <small>{r.seccional.province.name}</small>
                </td>
                <td>{r.school?.name || r.schoolName || "Sin especificar"}</td>
                <td>
                  <select
                    aria-label={`Estado de ${r.firstName} ${r.lastName}`}
                    value={r.status}
                    disabled={busy}
                    onChange={(e) =>
                      void update(r.id, e.target.value as Status)
                    }
                  >
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                {user?.role === "ADMIN" && (
                  <td>
                    <button
                      className="secondary"
                      onClick={() => {
                        setSelected(r);
                        setSensitive(null);
                      }}
                    >
                      Consultar
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {data?.items.length === 0 && (
          <p className="empty">Todavía no hay registros en esta vista.</p>
        )}
      </div>
      <div className="pagination">
        <button
          className="secondary"
          disabled={page === 1}
          onClick={() => setPage((v) => v - 1)}
        >
          ← Anterior
        </button>
        <span>Página {page}</span>
        <button
          className="secondary"
          disabled={!data || page * 25 >= data.total}
          onClick={() => setPage((v) => v + 1)}
        >
          Siguiente →
        </button>
      </div>
      {selected && (
        <div className="modal-backdrop">
          <section
            className="card modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sensitive-title"
          >
            <h2 id="sensitive-title">Consulta de datos protegidos</h2>
            <p>
              {selected.firstName} {selected.lastName}
            </p>
            {sensitive ? (
              <>
                <p>
                  Cédula: <strong>{sensitive.cedula}</strong>
                </p>
                <p>
                  Teléfono: <strong>{sensitive.phone}</strong>
                </p>
                <small>Se ocultarán automáticamente en un minuto.</small>
              </>
            ) : (
              <form onSubmit={reveal}>
                <label>
                  Motivo de la consulta
                  <textarea
                    name="reason"
                    minLength={10}
                    maxLength={300}
                    required
                    placeholder="Indique la finalidad; no incluya datos personales."
                  />
                </label>
                <p>Esta consulta quedará registrada en auditoría.</p>
                <button disabled={busy} className="primary">
                  Recuperar datos
                </button>
              </form>
            )}
            <button
              className="secondary"
              onClick={() => {
                setSelected(null);
                setSensitive(null);
              }}
            >
              Cerrar
            </button>
          </section>
        </div>
      )}
    </>
  );
}
