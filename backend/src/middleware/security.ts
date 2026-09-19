import type { RequestHandler, ErrorRequestHandler } from "express";
import { randomUUID } from "node:crypto";
import { rateLimit } from "express-rate-limit";
import { Prisma, RoleCode } from "@prisma/client";
import { ZodError } from "zod";
import { db } from "../lib/db.js";
import { tokenDigest } from "../lib/crypto.js";
import { env, allowedOrigins } from "../config/env.js";
import { HttpError } from "../lib/errors.js";
export const requestContext: RequestHandler = (req, res, next) => {
  req.requestId = randomUUID();
  res.setHeader("X-Request-ID", req.requestId);
  res.setHeader("Cache-Control", "no-store");
  next();
};
export const checkOrigin: RequestHandler = (req, _res, next) => {
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    !allowedOrigins.includes(req.get("origin") ?? "")
  )
    return next(new HttpError(403, "Origen no autorizado"));
  next();
};
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const token = req.cookies?.session as unknown;
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token))
    throw new HttpError(401, "Inicie sesión");
  const session = await db.session.findUnique({
    where: { tokenHash: tokenDigest(token) },
    include: {
      user: {
        include: {
          role: true,
          leader: {
            include: {
              municipalities: {
                where: {
                  municipality: { active: true, province: { active: true } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (
    !session ||
    session.expiresAt <= new Date() ||
    !session.user.active ||
    !session.user.role.active
  )
    throw new HttpError(401, "Sesión inválida");
  if (session.user.role.code === "LEADER" && !session.user.leader?.active)
    throw new HttpError(403, "Líder inactivo");
  req.auth = {
    userId: session.userId,
    sessionId: session.id,
    role: session.user.role.code,
    municipalityIds:
      session.user.leader?.municipalities.map((v) => v.municipalityId) ?? [],
  };
  next();
};
export const allowRoles =
  (...roles: RoleCode[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.auth || !roles.includes(req.auth.role))
      return next(new HttpError(403, "Acceso denegado"));
    next();
  };
const limit = (windowMs: number, count: number) =>
  rateLimit({
    windowMs,
    limit: count,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Demasiadas solicitudes. Inténtelo más tarde." },
  });
export const generalLimit = limit(60_000, 180);
export const loginLimit = limit(15 * 60_000, 15);
export const registrationLimit = limit(60 * 60_000, 20);
export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  req,
  res,
  _next,
) => {
  if (error instanceof ZodError) {
    res
      .status(400)
      .json({
        error: "Datos inválidos",
        fields: error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
    return;
  }
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    ["P2002", "P2003", "P2025"].includes(error.code)
  ) {
    res
      .status(409)
      .json({
        error: "La operación entra en conflicto con los datos existentes",
      });
    return;
  }
  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({ error: "JSON inválido" });
    return;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "entity.too.large"
  ) {
    res.status(413).json({ error: "Solicitud demasiado grande" });
    return;
  }
  // No imprimir error, cuerpo, cabeceras ni valores Prisma: pueden contener datos personales.
  console.error(
    JSON.stringify({ event: "request_failed", requestId: req.requestId }),
  );
  res.status(500).json({ error: "Error interno", requestId: req.requestId });
};
