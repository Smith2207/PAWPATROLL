"use client";



/**
 * [ui] Overlay: publicando.
 */
type Props = {
  visible: boolean;
  mensaje?: string;
};

export function OverlayPublicando({
  visible,
  mensaje = "Publicando tu reporte…",
}: Props) {
  if (!visible) return null;

  return (
    <div className="pp-overlay-publicando" role="status" aria-live="polite">
      <div className="pp-overlay-publicando-caja">
        <span className="pp-overlay-publicando-spinner" aria-hidden />
        <p>{mensaje}</p>
      </div>
    </div>
  );
}
