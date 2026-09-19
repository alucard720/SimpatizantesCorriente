export function developmentOrigins(origin: string, mode: string): string[] {
  const values = new Set([origin]);
  const url = new URL(origin);
  if (mode === "development" && ["localhost", "127.0.0.1"].includes(url.hostname)) {
    url.hostname = url.hostname === "localhost" ? "127.0.0.1" : "localhost";
    values.add(url.origin);
  }
  return [...values];
}
