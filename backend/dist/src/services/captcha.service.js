import { env } from "../config/env.js";
import { HttpError } from "../lib/errors.js";
export async function verifyCaptcha(token) {
    if (env.CAPTCHA_PROVIDER === "disabled" && env.NODE_ENV !== "production")
        return;
    if (!token)
        throw new HttpError(400, "Complete la verificación CAPTCHA");
    try {
        const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            body: new URLSearchParams({
                secret: env.TURNSTILE_SECRET_KEY,
                response: token,
            }),
            signal: AbortSignal.timeout(5000),
        });
        if (!response.ok)
            throw new Error();
        const result = (await response.json());
        if (!result.success ||
            result.hostname !== env.TURNSTILE_HOSTNAME ||
            result.action !== "registration")
            throw new Error();
    }
    catch {
        throw new HttpError(400, "No se pudo verificar CAPTCHA; inténtelo nuevamente");
    }
}
