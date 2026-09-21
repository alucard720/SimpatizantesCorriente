import express from "express";
import {fileURLToPath} from "node:url"
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
  helmet({
    contentSecurityPolicy: {
    directives: {
      scriptSrc: ["'self'", "https://challenges.cloudflare.com"],
      frameSrc: ["'self'", "https://challenges.cloudflare.com"],
    },
   },
  }),
  cors({ origin: allowedOrigins, credentials: true }),
  generalLimit,
  checkOrigin,
  express.json({ limit: "16kb" }),
  cookieParser(),
);
app.use("/api", router);
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

if (process.env.NODE_ENV === "production") {
  const frontendDir = fileURLToPath(
    new URL("../../../frontend/dist/", import.meta.url),
  );

  app.use(express.static(frontendDir));

  // Permite abrir directamente las rutas de React.
  app.get(/.*/, (_req, res, next) => {
    res.sendFile("index.html", { root: frontendDir }, (error) => {
      if (error) next(error);
    });
  });
}
app.use((_req, res) => res.status(404).json({ error: "Ruta no encontrada" }));
app.use(errorHandler);
