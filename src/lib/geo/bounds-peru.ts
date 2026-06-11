/** Límites aproximados del territorio peruano (con margen costero/fronterizo). */
const LAT_MIN = -19.5;
const LAT_MAX = -0.2;
const LNG_MIN = -82.5;
const LNG_MAX = -68.0;

export function estaEnPeru(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= LAT_MIN &&
    lat <= LAT_MAX &&
    lng >= LNG_MIN &&
    lng <= LNG_MAX
  );
}
