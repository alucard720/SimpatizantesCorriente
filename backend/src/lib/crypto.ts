import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  scrypt,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { env } from "../config/env.js";
const derive = (password: string, salt: string) =>
  new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password,
      salt,
      64,
      { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
      (error, key) => (error ? reject(error) : resolve(key)),
    );
  });
const encryptionKey = Buffer.from(env.DATA_ENCRYPTION_KEY, "base64");
export const normalizeCedula = (value: string) => value.replace(/[\s-]/g, "");
export const cedulaDigest = (value: string) =>
  createHmac("sha256", Buffer.from(env.CEDULA_HMAC_KEY, "base64"))
    .update(normalizeCedula(value))
    .digest("hex");
// AAD vincula cada sobre al registro y campo para impedir intercambiar ciphertexts.
export function encrypt(value: string, context: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey, iv);
  cipher.setAAD(Buffer.from(context));
  const ciphertext = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  return [
    "v1",
    iv.toString("base64"),
    cipher.getAuthTag().toString("base64"),
    ciphertext.toString("base64"),
  ].join(".");
}
export function decrypt(value: string, context: string) {
  const [version, iv, tag, ciphertext] = value.split(".");
  if (version !== "v1" || !iv || !tag || !ciphertext)
    throw new Error("Sobre cifrado inválido");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey,
    Buffer.from(iv, "base64"),
  );
  decipher.setAAD(Buffer.from(context));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const result = await derive(password, salt);
  return `scrypt$32768$${salt}$${result.toString("hex")}`;
}
export async function verifyPassword(password: string, hash: string) {
  const [algorithm, cost, salt, expected] = hash.split("$");
  if (algorithm !== "scrypt" || cost !== "32768" || !salt || !expected)
    return false;
  const actual = await derive(password, salt);
  const target = Buffer.from(expected, "hex");
  return target.length === actual.length && timingSafeEqual(target, actual);
}
export const sessionToken = () => randomBytes(32).toString("base64url");
export const tokenDigest = (token: string) =>
  createHash("sha256").update(token).digest("hex");
