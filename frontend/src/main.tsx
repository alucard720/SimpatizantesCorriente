import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AuthProvider } from "./context/Auth";
import { PublicLayout, PrivateLayout, Protected } from "./components/Layout";
import { Register } from "./pages/Register";
import { Success, Privacy } from "./pages/Public";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Registrations } from "./pages/Registrations";
import { Admin } from "./pages/Admin";
import "./styles.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Register />} />
            <Route path="/exito" element={<Success />} />
            <Route path="/privacidad" element={<Privacy />} />
            <Route path="/login" element={<Login />} />
          </Route>
          <Route element={<Protected />}>
            <Route element={<PrivateLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route element={<Protected role="LEADER" />}>
                <Route path="/lider" element={<Registrations />} />
              </Route>
              <Route element={<Protected role="ADMIN" />}>
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/registros" element={<Registrations />} />
              </Route>
            </Route>
          </Route>
          <Route
            path="*"
            element={
              <main className="narrow">
                <h1>Página no encontrada</h1>
                <Link to="/">Ir al inicio</Link>
              </main>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
