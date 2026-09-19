import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, message } from "../services/api";
import type { Privacy as PrivacyType } from "../types";
export function Success() {
  return (
    <section className="card narrow center">
      <span className="success-icon">✓</span>
      <span className="eyebrow">SOLICITUD RECIBIDA</span>
      <h1>Gracias por participar.</h1>
      <p>
        Si los datos permiten un registro nuevo, será procesado. Por privacidad,
        esta confirmación no indica si una persona ya estaba registrada.
      </p>
      <Link className="button primary" to="/">
        Volver al inicio
      </Link>
    </section>
  );
}
export function Privacy() {
  const [data, setData] = useState<PrivacyType | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    void api<PrivacyType>("/public/privacy")
      .then(setData)
      .catch((e) => setError(message(e)));
  }, []);
  return (
    <article className="card narrow">
      <span className="eyebrow">INFORMACIÓN Y CONSENTIMIENTO</span>
      <h1>Aviso de privacidad</h1>
      {error && <p role="alert">{error}</p>}
      {data ? (
        <>
          <p>Versión {data.version}</p>
          <h2>Responsable</h2>
          <p>{data.controller}</p>
          <p>Contacto: {data.contact}</p>
          <h2>Finalidad</h2>
          <p>{data.purpose}</p>
          <h2>Datos solicitados</h2>
          <p>
            {data.fields} El registro expresa una simpatía asociativa y es
            voluntario.
          </p>
          <h2>Acceso y protección</h2>
          <p>{data.access}</p>
          <h2>Conservación</h2>
          <p>{data.retention}</p>
          <h2>Tus derechos</h2>
          <p>{data.rights}</p>
        </>
      ) : (
        !error && <p>Cargando…</p>
      )}
      <Link to="/">← Volver al registro</Link>
    </article>
  );
}
