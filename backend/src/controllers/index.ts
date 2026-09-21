import type { Request, RequestHandler } from "express";
import * as catalog from "../services/catalog.service.js";
import * as registrations from "../services/registration.service.js";
import * as authService from "../services/auth.service.js";
import * as adminService from "../services/admin.service.js";
import { db } from "../lib/db.js";
import { env } from "../config/env.js";
import { audit } from "../repositories/audit.repository.js";
import { registrationScope } from "../repositories/registration.repository.js";
const context = (req: Request) => ({
  requestId: req.requestId,
  actorId: req.auth?.userId,
});
export const getProvinces: RequestHandler = async (_req, res) => {
  res.json(await catalog.provinces());
};
export const getSeccionales: RequestHandler = async (req, res) => {
  res.json(await catalog.seccionales(req.query));
};
export const getSchools: RequestHandler = async (req, res) => {
  res.json(await catalog.schools(req.query));
};
export const privacy: RequestHandler = (_req, res) => {
  res.json({
    version: env.PRIVACY_VERSION,
    controller: env.PRIVACY_CONTROLLER,
    contact: env.PRIVACY_CONTACT,
    retention: env.PRIVACY_RETENTION,
    purpose:
      "Registrar voluntariamente su simpatía por la Corriente Magisterial Juan Pablo Duarte y gestionar su organización por seccional.",
    fields: "Nombre, apellido, cédula, teléfono, seccional y escuela opcional.",
    access:
      "Los líderes autorizados ven nombre, escuela, seccional y estado de su ámbito. Solo administradores pueden recuperar cédula y teléfono, con motivo y auditoría.",
    rights:
      "Solicite acceso, corrección, retiro del consentimiento o supresión a través del contacto del responsable.",
  });
};
export const register: RequestHandler = async (req, res) => {
  res.status(202).json(await registrations.register(req.body, context(req)));
};
export const login: RequestHandler = async (req, res) => {
  const result = await authService.login(req.body, context(req));
  // Revocar la sesión anterior del navegador al cambiar de cuenta.
  if (typeof req.cookies?.session === "string") {
    const { tokenDigest } = await import("../lib/crypto.js");
    await db.session.deleteMany({
      where: { tokenHash: tokenDigest(req.cookies.session) },
    });
  }
  res
    .cookie("session", result.token, {
      ...authService.cookieOptions,
      maxAge: 8 * 60 * 60_000,
    })
    .json(result.user);
};
export const logout: RequestHandler = async (req, res) => {
  await db.$transaction(async (tx) => {
    await tx.session.deleteMany({ where: { id: req.auth!.sessionId } });
    await audit(tx, context(req), "LOGOUT", "User", req.auth!.userId);
  });
  res.clearCookie("session", authService.cookieOptions).status(204).end();
};
export const me: RequestHandler = async (req, res) => {
  const user = await db.user.findUniqueOrThrow({
    where: { id: req.auth!.userId },
    select: { id: true, firstName: true, lastName: true },
  });
  res.json({
    ...user,
    role: req.auth!.role,
    seccionalIds: req.auth!.seccionalIds,
  });
};
export const listRegistrations: RequestHandler = async (req, res) => {
  res.json(
    await registrations.listRegistrations(req.query, req.auth!, context(req)),
  );
};
export const sensitiveData: RequestHandler = async (req, res) => {
  res.json(
    await registrations.sensitiveData(req.params.id, req.body, context(req)),
  );
};
export const updateStatus: RequestHandler = async (req, res) => {
  res.json(
    await registrations.updateStatus(
      req.params.id,
      req.body,
      req.auth!,
      context(req),
    ),
  );
};
export const dashboard: RequestHandler = async (req, res) => {
  const result = await db.$transaction(async (tx) => {
    const counts = await tx.registration.groupBy({
      by: ["status"],
      where: registrationScope(req.auth),
      _count: { _all: true },
    });
    await audit(tx, context(req), "DASHBOARD_READ", "Registration");
    return counts;
  });
  res.json(result);
};
export const listUsers: RequestHandler = async (req, res) => {
  res.json(await adminService.listUsers(req.query));
};
export const createUser: RequestHandler = async (req, res) => {
  res.status(201).json(await authService.createUser(req.body, context(req)));
};
export const setUserActive: RequestHandler = async (req, res) => {
  res.json(
    await adminService.setUserActive(req.params.id, req.body, context(req)),
  );
};
export const assignSeccionales: RequestHandler = async (req, res) => {
  res.json(
    await adminService.assignSeccionales(
      req.params.id,
      req.body,
      context(req),
    ),
  );
};
export const auditLogs: RequestHandler = async (req, res) => {
  res.json(await adminService.auditLogs(req.query, context(req)));
};
export const createCatalog =
  (kind: "province" | "seccional" | "school"): RequestHandler =>
  async (req, res) => {
    res
      .status(201)
      .json(await catalog.createCatalog(kind, req.body, context(req)));
  };

export const createLeader: RequestHandler = async (req, res) => {
  res.status(201).json(await adminService.createLeader(req.body, context(req)));
};
export const listLeaders: RequestHandler = async (req, res) => {
  res.json(await adminService.listLeaders(req.query));
};
