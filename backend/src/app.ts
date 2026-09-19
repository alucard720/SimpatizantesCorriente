import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env, allowedOrigins } from "./config/env.js";
import { router } from "./routes/index.js";
import {
  requestContext,
  checkOrigin,
  generalLimit,
  errorHandler,
} from "./middleware/security.js";
export const app = express();
app.disable("x-powered-by");
if (env.TRUST_PROXY_HOPS) app.set("trust proxy", env.TRUST_PROXY_HOPS);
app.use(
  requestContext,
  helmet(),
  cors({ origin: allowedOrigins, credentials: true }),
  generalLimit,
  checkOrigin,
  express.json({ limit: "16kb" }),
  cookieParser(),
);
app.use("/api", router);
app.use((_req, res) => res.status(404).json({ error: "Ruta no encontrada" }));
app.use(errorHandler);
