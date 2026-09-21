import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { CatalogItem, Privacy } from "../types";
import { api, send, message } from "../services/api";
import { Captcha } from "../components/Captcha";
import { CatalogSelect } from "../components/CatalogSelect";
import { MaskedNumberInput } from "../components/MaskedNumberInput";
export function Register() {
  const navigate = useNavigate();
  const [provinces, setProvinces] = useState<CatalogItem[]>([]),
    [seccionales, setSeccionales] = useState<CatalogItem[]>([]);
  const [provinceId, setProvince] = useState(""),
    [seccionalId, setSeccional] = useState("");
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
    setSeccionales([]);
    if (!provinceId) return;
    const c = new AbortController();
    void api<CatalogItem[]>(`/public/seccionales?provinceId=${provinceId}`, {
      signal: c.signal,
    })
      .then(setSeccionales)
      .catch((e) => {
        if (!c.signal.aborted) setError(message(e));
      });
    return () => c.abort();
  }, [provinceId]);
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
        seccionalId,
        schoolName: String(data.get("schoolName") || "").trim() || undefined,
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
        <div className="candidate-message">
          <strong>Menegildo de la Rosa</strong>
          <span>Presidente ADP 2027-2030</span>
        </div>
        <p>
          Registra tu simpatía por la Corriente Magisterial Juan Pablo Duarte y
          forma parte de nuestra comunidad.
        </p>
        <div className="intro-note">
          <span>01 —</span>
          <h3>Un registro sencillo</h3>
          <p>
            No necesitas crear una cuenta. Completa tus datos y selecciona tu
            seccional.
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
                <MaskedNumberInput
                  name="cedula"
                  groups={[3, 7, 1]}
                  placeholder="000-0000000-0"
                  pattern="[0-9]{3}-[0-9]{7}-[0-9]"
                  title="Introduce los 11 dígitos de tu cédula"
                  required
                />
                <small>11 dígitos. Los guiones se agregan automáticamente.</small>
              </label>
              <label>
                Teléfono *
                <MaskedNumberInput
                  name="phone"
                  type="tel"
                  groups={[3, 3, 4]}
                  autoComplete="tel"
                  placeholder="000-000-0000"
                  pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
                  title="Introduce los 10 dígitos de tu teléfono"
                  required
                />
              </label>
            </div>
            <h3 className="form-section">Tu comunidad educativa</h3>
            <div className="form-grid">
              <CatalogSelect label="Provincia" items={provinces} value={provinceId} required
                onChange={id => { setProvince(id); setSeccional(""); setSeccionales([]); }} />
              <CatalogSelect key={provinceId} label="Seccional" items={seccionales} value={seccionalId} required
                disabled={!provinceId || !seccionales.length}
                onChange={setSeccional} />
            </div>
            {!provinces.length && (
              <p className="notice">
                El catálogo de provincias aún no está disponible. El
                administrador debe cargarlo antes de recibir registros.
              </p>
            )}
            <label>
              Nombre de la escuela <span className="muted">(opcional)</span>
              <input
                name="schoolName"
                minLength={2}
                maxLength={200}
                placeholder="Escribe el nombre de la escuela"
              />
            </label>
            <label className="check">
              <input type="checkbox" name="consent" required />
              <span>
                Confirmo mis datos y consiento voluntariamente su tratamiento
                para registrar mi simpatía y gestionar la organización por
                seccional, según el{" "}
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
                !seccionalId ||
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
