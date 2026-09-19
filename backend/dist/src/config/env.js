import { developmentOrigins } from "./origins.js";
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
// Resolver backend/.env tanto desde src/config como desde dist/src/config.
// Las variables proporcionadas por el despliegue conservan prioridad.
const backendRoot = existsSync(new URL("../../package.json", import.meta.url))
    ? new URL("../../", import.meta.url)
    : new URL("../../../", import.meta.url);
config({ path: fileURLToPath(new URL(".env", backendRoot)) });
import { z } from "zod";
const key = z
    .string()
    .regex(/^[A-Za-z0-9+/]{43}=$/, "Debe ser una clave aleatoria de 32 bytes en base64");
const parsed = z
    .object({
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    DATABASE_URL: z.string().url(),
    FRONTEND_ORIGIN: z.string().url(),
    DATA_ENCRYPTION_KEY: key,
    CEDULA_HMAC_KEY: key,
    CAPTCHA_PROVIDER: z.enum(["disabled", "turnstile"]).default("disabled"),
    TURNSTILE_SECRET_KEY: z.string().default(""),
    TURNSTILE_HOSTNAME: z.string().default("localhost"),
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
    PRIVACY_VERSION: z.string().min(1).max(40).default("2026-01"),
    PRIVACY_CONTROLLER: z.string().min(1),
    PRIVACY_CONTACT: z.string().min(1),
    PRIVACY_RETENTION: z.string().min(1),
})
    .safeParse(process.env);
if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((issue) => issue.path.join(".")))];
    throw new Error(`Configuración incompleta o inválida: ${fields.join(", ")}. Revise backend/.env usando backend/.env.example como referencia.`);
}
export const env = parsed.data;
if (env.DATA_ENCRYPTION_KEY === env.CEDULA_HMAC_KEY)
    throw new Error("Utilice claves independientes para cifrado y HMAC");
if (env.CAPTCHA_PROVIDER === "turnstile" && !env.TURNSTILE_SECRET_KEY)
    throw new Error("Falta TURNSTILE_SECRET_KEY");
if (env.NODE_ENV === "production") {
    if (env.CAPTCHA_PROVIDER === "disabled" ||
        !env.FRONTEND_ORIGIN.startsWith("https://"))
        throw new Error("Producción requiere HTTPS y CAPTCHA");
    if ([env.PRIVACY_CONTROLLER, env.PRIVACY_CONTACT, env.PRIVACY_RETENTION].some((v) => v.startsWith("Configurar")))
        throw new Error("Complete el aviso de privacidad");
}
export const allowedOrigins = developmentOrigins(env.FRONTEND_ORIGIN, env.NODE_ENV);
