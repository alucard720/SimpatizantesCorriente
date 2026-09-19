/** Imagen original de la marca, sin recortar ni deformar. */
export function Brand({ standalone = false }: { standalone?: boolean }) {
  return (
    <span className={standalone ? "brand-identity brand-identity--standalone" : "brand-identity"}>
      <img className="brand-logo" src={`${import.meta.env.BASE_URL}brand/juan-pablo-duarte.jpg`} alt="Corriente Magisterial Juan Pablo Duarte — Bienestar de la escuela" width="960" height="960" decoding="async" />
      {!standalone && <span className="brand-name" aria-hidden="true">Corriente Magisterial<strong>Juan Pablo Duarte</strong><small>Bienestar de la escuela</small></span>}
    </span>
  );
}
