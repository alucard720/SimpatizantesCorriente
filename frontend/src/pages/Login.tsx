import { Brand } from "../components/Brand";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/Auth";
import { message } from "../services/api";
export function Login() {
  const { user, login } = useAuth(),
    navigate = useNavigate();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      await login(String(f.get("email")), String(f.get("password")));
      navigate("/dashboard");
    } catch (error) {
      setError(message(error));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="card login-card">
      <Brand standalone />
      <span className="eyebrow">PORTAL PRIVADO</span>
      <h1>Bienvenido de nuevo.</h1>
      <p>
        Acceso exclusivo para administradores y usuarios de líderes autorizados.
      </p>
      <form onSubmit={submit}>
        <label>
          Correo electrónico
          <input name="email" type="email" autoComplete="username" required />
        </label>
        <label>
          Contraseña
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            maxLength={128}
            required
          />
        </label>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button className="primary wide" disabled={busy}>
          {busy ? "Ingresando…" : "Iniciar sesión →"}
        </button>
      </form>
      <div className="login-public-access">
        <p>Para registrarte no necesitas una cuenta.</p>
        <Link className="button secondary wide" to="/">
          Ir al formulario público →
        </Link>
      </div>
    </section>
  );
}
