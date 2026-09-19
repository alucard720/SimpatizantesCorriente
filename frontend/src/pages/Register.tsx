import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { CatalogItem, Privacy } from "../types";
import { api, send, message } from "../services/api";
import { Captcha } from "../components/Captcha";
export function Register() {
  const navigate = useNavigate();
  const [provinces, setProvinces] = useState<CatalogItem[]>([]),
    [municipalities, setMunicipalities] = useState<CatalogItem[]>([]),
    [schools, setSchools] = useState<CatalogItem[]>([]);
  const [provinceId, setProvince] = useState(""),
    [municipalityId, setMunicipality] = useState(""),
    [schoolId, setSchool] = useState(""),
    [search, setSearch] = useState("");
  const [privacy, setPrivacy] = useState<Privacy | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [token, setToken] = useState(""),
    [reset, setReset] = useState(0);
  useEffect(() => {
    void Promise.all([
      api<CatalogItem[]>("/public/provinces"),
      api<Privacy>("/public/privacy"),
    ])
      .then(([p, v]) => {
        setProvinces(p);
        setPrivacy(v);
      })
      .catch((e) => setError(message(e)));
  }, []);
  useEffect(() => {
    setMunicipalities([]);
    if (!provinceId) return;
    const c = new AbortController();
    void api<CatalogItem[]>(`/public/municipalities?provinceId=${provinceId}`, {
      signal: c.signal,
    })
      .then(setMunicipalities)
      .catch((e) => {
        if (!c.signal.aborted) setError(message(e));
      });
    return () => c.abort();
  }, [provinceId]);
  useEffect(() => {
    setSchools([]);
    if (!municipalityId) return;
    const c = new AbortController();
    const timer = setTimeout(() => {
      void api<CatalogItem[]>(
        `/public/schools?municipalityId=${municipalityId}&q=${encodeURIComponent(search)}`,
        { signal: c.signal },
      )
        .then(setSchools)
        .catch((e) => {
          if (!c.signal.aborted) setError(message(e));
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      c.abort();
    };
  }, [municipalityId, search]);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!privacy) return;
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      await send("/public/registrations", {
        firstName: data.get("firstName"),
        lastName: data.get("lastName"),
        cedula: data.get("cedula"),
        phone: data.get("phone"),
        provinceId,
        municipalityId,
        schoolId: schoolId || undefined,
        schoolName:
          !schoolId && data.get("schoolName")
            ? data.get("schoolName")
            : undefined,
        consent: data.get("consent") === "on",
        consentVersion: privacy.version,
        captchaToken: token || undefined,
      });
      navigate("/exito", { replace: true });
    } catch (e) {
      setError(message(e));
      setToken("");
      setReset((v) => v + 1);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="registration-layout">
      <section className="intro">
        <span className="eyebrow">COMUNIDAD MAGISTERIAL</span>
        <h1>
          Tu participación
          <br />
          <em>nos une.</em>
        </h1>
        <p>
          Registra tu simpatía por la Corriente Magisterial Juan Pablo Duarte y
          forma parte de nuestra comunidad.
        </p>
        <div className="intro-note">
          <span>01 —</span>
          <h3>Un registro sencillo</h3>
          <p>
            No necesitas crear una cuenta. Completa tus datos y selecciona tu
            municipio.
          </p>
        </div>
        <div className="intro-note">
          <span>02 —</span>
          <h3>Tu información, protegida</h3>
          <p>
            El acceso está limitado al personal autorizado. La cédula y el
            teléfono se almacenan cifrados.
          </p>
        </div>
      </section>
      <section className="card registration-card">
        <div className="card-heading">
          <span className="eyebrow">REGISTRO VOLUNTARIO</span>
          <h2>Cuéntanos sobre ti</h2>
          <p>Los campos con * son obligatorios.</p>
        </div>
        <form onSubmit={submit}>
          <fieldset disabled={busy}>
            <div className="form-grid">
              <label>
                Nombre *
                <input
                  name="firstName"
                  autoComplete="given-name"
                  maxLength={100}
                  required
                />
              </label>
              <label>
                Apellido *
                <input
                  name="lastName"
                  autoComplete="family-name"
                  maxLength={100}
                  required
                />
              </label>
              <label>
                Cédula *
                <input
                  name="cedula"
                  inputMode="numeric"
                  placeholder="000-0000000-0"
                  maxLength={20}
                  pattern="[0-9 -]{11,20}"
                  required
                />
                <small>11 dígitos, con o sin guiones.</small>
              </label>
              <label>
                Teléfono *
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="809 000 0000"
                  maxLength={24}
                  required
                />
              </label>
            </div>
            <h3 className="form-section">Tu comunidad educativa</h3>
            <div className="form-grid">
              <label>
                Provincia *
                <select
                  value={provinceId}
                  onChange={(e) => {
                    setProvince(e.target.value);
                    setMunicipality("");
                    setSchool("");
                    setSearch("");
                  }}
                  required
                >
                  <option value="">Selecciona una provincia</option>
                  {provinces.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Municipio *
                <select
                  value={municipalityId}
                  disabled={!provinceId}
                  onChange={(e) => {
                    setMunicipality(e.target.value);
                    setSchool("");
                    setSearch("");
                  }}
                  required
                >
                  <option value="">Selecciona un municipio</option>
                  {municipalities.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {!provinces.length && (
              <p className="notice">
                El catálogo de provincias aún no está disponible. El
                administrador debe cargarlo antes de recibir registros.
              </p>
            )}
            <label>
              Buscar escuela <span className="muted">(opcional)</span>
              <input
                value={search}
                disabled={!municipalityId}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSchool("");
                }}
                placeholder="Escribe parte del nombre"
                maxLength={100}
              />
            </label>
            <label>
              Escuela del catálogo
              <select
                value={schoolId}
                onChange={(e) => setSchool(e.target.value)}
                disabled={!municipalityId}
              >
                <option value="">No aparece / completar después</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            {!schoolId && (
              <label>
                Nombre de la escuela <span className="muted">(opcional)</span>
                <input
                  name="schoolName"
                  minLength={2}
                  maxLength={200}
                  placeholder="Si aún no aparece en el catálogo"
                />
              </label>
            )}
            <label className="check">
              <input type="checkbox" name="consent" required />
              <span>
                Confirmo mis datos y consiento voluntariamente su tratamiento
                para registrar mi simpatía y gestionar la organización por
                municipio, según el{" "}
                <Link to="/privacidad" target="_blank">
                  aviso de privacidad
                </Link>
                .
              </span>
            </label>
            <Captcha onToken={setToken} onError={setError} reset={reset} />
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <button
              className="primary wide"
              disabled={
                !privacy ||
                !provinces.length ||
                (Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY) && !token)
              }
            >
              {busy ? "Enviando…" : "Enviar registro →"}
            </button>
          </fieldset>
        </form>
      </section>
    </div>
  );
}
