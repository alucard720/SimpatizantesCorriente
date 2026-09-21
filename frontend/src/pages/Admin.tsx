import { useEffect, useState, type FormEvent } from "react";
import { api, send, message } from "../services/api";
import type { AdminUser, Leader, Audit, CatalogItem } from "../types";
import { CatalogSelect } from "../components/CatalogSelect";
import { catalogLabel } from "../services/catalog";
export function Admin() {
  const [tab, setTab] = useState("leaders"),
    [users, setUsers] = useState<AdminUser[]>([]),
    [leaders, setLeaders] = useState<Leader[]>([]),
    [logs, setLogs] = useState<Audit[]>([]),
    [provinces, setProvinces] = useState<CatalogItem[]>([]),
    [seccionales, setSeccionales] = useState<CatalogItem[]>([]);
  const [schoolSeccional, setSchoolSeccional] = useState("");
  const [newProvince, setNewProvince] = useState("");
  const [province, setProvince] = useState(""),
    [role, setRole] = useState("LEADER"),
    [page, setPage] = useState(1),
    [revision, setRevision] = useState(0),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [selectedLeader, setSelectedLeader] = useState(""),
    [assigned, setAssigned] = useState<string[]>([]);
  useEffect(() => {
    void api<CatalogItem[]>("/public/provinces")
      .then(setProvinces)
      .catch((e) => setError(message(e)));
  }, [revision]);
  useEffect(() => {
    if (!province) {
      setSeccionales([]);
      return;
    }
    const c = new AbortController();
    void api<CatalogItem[]>(`/public/seccionales?provinceId=${province}`, {
      signal: c.signal,
    })
      .then(setSeccionales)
      .catch((e) => {
        if (!c.signal.aborted) setError(message(e));
      });
    return () => c.abort();
  }, [province, revision]);
  useEffect(() => {
    const c = new AbortController();
    const opts = { signal: c.signal };
    setUsers([]);
    setLogs([]);
    setLeaders([]);
    void (async () => {
      if (tab === "users") {
        const [u, l] = await Promise.all([
          api<AdminUser[]>(`/private/admin/users?page=${page}`, opts),
          api<Leader[]>("/private/admin/leaders?pageSize=100", opts),
        ]);
        setUsers(u);
        setLeaders(l);
      } else if (tab === "leaders")
        setLeaders(
          await api<Leader[]>(`/private/admin/leaders?page=${page}`, opts),
        );
      else if (tab === "audit")
        setLogs(
          await api<Audit[]>(`/private/admin/audit-logs?page=${page}`, opts),
        );
    })().catch((e) => {
      if (!c.signal.aborted) setError(message(e));
    });
    return () => c.abort();
  }, [tab, page, revision]);
  const mutate = async (path: string, data: unknown, method = "POST") => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await send(path, data, method);
      setNotice("Cambios guardados.");
      setRevision((v) => v + 1);
      return true;
    } catch (e) {
      setError(message(e));
      return false;
    } finally {
      setBusy(false);
    }
  };
  const submit = (kind: string) => async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    if (kind === "users") {
      data.role = role;
      if (role === "ADMIN") delete data.leaderId;
    }
    if (data.code === "") delete data.code;
    if (await mutate(`/private/admin/${kind}`, data)) form.reset();
  };
  const selectLeader = (id: string) => {
    setSelectedLeader(id);
    setAssigned(
      leaders
        .find((l) => l.id === id)
        ?.seccionales.map((m) => m.seccionalId) ?? [],
    );
  };
  return (
    <>
      <span className="eyebrow">CONTROL DE ACCESO Y CATÁLOGOS</span>
      <h1>Administración</h1>
      <div className="tabs">
        {[
          ["leaders", "Líderes"],
          ["users", "Usuarios"],
          ["catalogs", "Catálogos"],
          ["audit", "Auditoría"],
        ].map(([id, label]) => (
          <button
            className={tab === id ? "primary" : "secondary"}
            key={id}
            onClick={() => {
              setTab(id);
              setPage(1);
              setSelectedLeader("");
              setNotice("");
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      {tab === "leaders" && (
        <>
          <div className="admin-grid">
            <section className="card">
              <h2>Crear líder</h2>
              <p>
                Un líder agrupa varios usuarios y sus seccionales autorizadas.
              </p>
              <form onSubmit={submit("leaders")}>
                <label>
                  Nombre del líder o grupo
                  <input name="name" minLength={2} maxLength={150} required />
                </label>
                <button className="primary" disabled={busy}>
                  Crear líder
                </button>
              </form>
            </section>
            <section className="card">
              <h2>Asignar seccionales</h2>
              <label>
                Líder
                <select
                  value={selectedLeader}
                  onChange={(e) => selectLeader(e.target.value)}
                  required
                >
                  <option value="">Seleccionar</option>
                  {leaders.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </label>
              <CatalogSelect label="Provincia" items={provinces} value={province} required
                onChange={id => { setProvince(id); setSeccionales([]); setSchoolSeccional(""); }} />
              {province && !seccionales.length && <p role="status">No hay seccionales disponibles.</p>}
              {seccionales.map((m) => (
                <label className="check" key={m.id}>
                  <input
                    type="checkbox"
                    disabled={!selectedLeader}
                    checked={assigned.includes(m.id)}
                    onChange={(e) =>
                      setAssigned((v) =>
                        e.target.checked
                          ? [...v, m.id]
                          : v.filter((id) => id !== m.id),
                      )
                    }
                  />
                  {catalogLabel(m)}
                </label>
              ))}
              <p>
                {assigned.length} seccionales seleccionadas, incluyendo otras
                provincias.
              </p>
              <button
                className="primary"
                disabled={busy || !selectedLeader}
                onClick={() =>
                  void mutate(
                    `/private/admin/leaders/${selectedLeader}/seccionales`,
                    { seccionalIds: assigned },
                    "PUT",
                  )
                }
              >
                Guardar ámbito
              </button>
            </section>
          </div>
          <div className="card table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Líder</th>
                  <th>Usuarios</th>
                  <th>Seccionales</th>
                </tr>
              </thead>
              <tbody>
                {leaders.map((l) => (
                  <tr key={l.id}>
                    <td>{l.name}</td>
                    <td>{l._count.users}</td>
                    <td>
                      {l.seccionales
                        .map((m) => m.seccional.name)
                        .join(", ") || "Sin asignaciones"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!leaders.length && (
              <p className="empty">No hay líderes en esta página.</p>
            )}
          </div>
        </>
      )}
      {tab === "users" && (
        <>
          <section className="card">
            <h2>Nuevo usuario</h2>
            <form onSubmit={submit("users")}>
              <div className="form-grid">
                <label>
                  Nombre
                  <input name="firstName" maxLength={100} required />
                </label>
                <label>
                  Apellido
                  <input name="lastName" maxLength={100} required />
                </label>
                <label>
                  Email
                  <input type="email" name="email" required />
                </label>
                <label>
                  Contraseña inicial
                  <input
                    type="password"
                    name="password"
                    minLength={12}
                    maxLength={128}
                    autoComplete="new-password"
                    required
                  />
                </label>
                <label>
                  Rol
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="LEADER">Usuario de líder</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </label>
                {role === "LEADER" && (
                  <label>
                    Líder
                    <select name="leaderId" required>
                      <option value="">Seleccionar</option>
                      {leaders.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
              <button className="primary" disabled={busy}>
                Crear acceso
              </button>
            </form>
          </section>
          <div className="card table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Acceso</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      {u.firstName} {u.lastName}
                      <small>{u.email}</small>
                    </td>
                    <td>{u.role.code}</td>
                    <td>
                      <button
                        className="secondary"
                        disabled={busy}
                        onClick={() =>
                          void mutate(
                            `/private/admin/users/${u.id}`,
                            { active: !u.active },
                            "PATCH",
                          )
                        }
                      >
                        {u.active ? "Desactivar" : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {tab === "catalogs" && (
        <div className="admin-grid">
          <section className="card">
            <h2>Provincia</h2>
            <form onSubmit={submit("provinces")}>
              <label>
                Código oficial
                <input name="code" maxLength={20} required />
              </label>
              <label>
                Nombre
                <input name="name" maxLength={100} required />
              </label>
              <button className="primary" disabled={busy}>
                Añadir provincia
              </button>
            </form>
          </section>
          <section className="card">
            <h2>Seccional</h2>
            <form onSubmit={submit("seccionales")}>
              <CatalogSelect label="Provincia" name="provinceId" items={provinces} value={newProvince} onChange={setNewProvince} required />
              <label>
                Número de seccional
                <input name="number" type="number" min={1} step={1} required />
              </label>
              <label>
                Nombre
                <input name="name" maxLength={150} required />
              </label>
              <button className="primary" disabled={busy}>
                Añadir seccional
              </button>
            </form>
          </section>
          <section className="card">
            <h2>Escuela</h2>
            <form onSubmit={submit("schools")}>
              <CatalogSelect label="Provincia" items={provinces} value={province} required
                onChange={id => { setProvince(id); setSeccionales([]); setSchoolSeccional(""); }} />
              <CatalogSelect key={province} label="Seccional" name="seccionalId" items={seccionales} value={schoolSeccional} onChange={setSchoolSeccional} disabled={!province} required />
              <label>
                Código (opcional)
                <input name="code" maxLength={30} />
              </label>
              <label>
                Nombre
                <input name="name" maxLength={200} required />
              </label>
              <button className="primary" disabled={busy}>
                Añadir escuela
              </button>
            </form>
          </section>
        </div>
      )}
      {tab === "audit" && (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Acción</th>
                <th>Usuario / entidad</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td>{new Date(l.createdAt).toLocaleString("es-DO")}</td>
                  <td>{l.action}</td>
                  <td>
                    <small>{l.actorId || "Público / sistema"}</small>
                    <small>
                      {l.entityType}: {l.entityId || "Listado"}
                    </small>
                  </td>
                  <td>{l.reason || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab !== "catalogs" && (
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
            disabled={
              (tab === "users"
                ? users.length
                : tab === "leaders"
                  ? leaders.length
                  : logs.length) < 25
            }
            onClick={() => setPage((v) => v + 1)}
          >
            Siguiente →
          </button>
        </div>
      )}
    </>
  );
}
