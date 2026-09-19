import { useEffect, useRef } from "react";
declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: Record<string, unknown>,
      ) => string;
      remove: (id: string) => void;
    };
  }
}
let load: Promise<void> | undefined;
function loadScript() {
  return (load ??= new Promise<void>((resolve, reject) => {
    if (window.turnstile) return resolve();
    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      load = undefined;
      reject(new Error("No se pudo cargar CAPTCHA"));
    };
    document.head.appendChild(script);
  }));
}
export function Captcha({
  onToken,
  onError,
  reset,
}: {
  onToken: (token: string) => void;
  onError: (error: string) => void;
  reset: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const key = import.meta.env.VITE_TURNSTILE_SITE_KEY;
    if (!key) return;
    let disposed = false,
      id: string | undefined;
    void loadScript()
      .then(() => {
        if (disposed || !ref.current) return;
        id = window.turnstile!.render(ref.current, {
          sitekey: key,
          action: "registration",
          callback: onToken,
          "expired-callback": () => onToken(""),
          "error-callback": () => {
            onToken("");
            onError("No se pudo verificar CAPTCHA. Recargue la página.");
          },
        });
      })
      .catch(() => onError("No se pudo cargar CAPTCHA. Recargue la página."));
    return () => {
      disposed = true;
      if (id) window.turnstile?.remove(id);
    };
  }, [onToken, onError, reset]);
  return <div ref={ref} />;
}
