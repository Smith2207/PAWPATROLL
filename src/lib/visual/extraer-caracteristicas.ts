/**
 * Extracción heurística de atributos visibles (M3).
 * Complementa CLIP: color dominante vía muestreo RGB; resto es orientativo.
 */

export type CaracteristicasVisuales = {
  colorPredominante: string;
  colorRgb: { r: number; g: number; b: number };
  tamanoEstimado: "pequeño" | "mediano" | "grande" | "desconocido";
  patrones: string[];
  confianzaColor: number;
};

const ETIQUETAS_COLOR: { nombre: string; rgb: [number, number, number] }[] = [
  { nombre: "negro", rgb: [30, 30, 30] },
  { nombre: "blanco", rgb: [245, 245, 245] },
  { nombre: "marrón", rgb: [120, 80, 50] },
  { nombre: "dorado", rgb: [210, 170, 80] },
  { nombre: "gris", rgb: [140, 140, 140] },
  { nombre: "naranja", rgb: [220, 120, 50] },
  { nombre: "atigrado (marrón)", rgb: [150, 100, 60] },
  { nombre: "manchado (blanco y negro)", rgb: [180, 180, 180] },
];

function distanciaRgb(a: { r: number; g: number; b: number }, b: [number, number, number]) {
  return Math.sqrt((a.r - b[0]) ** 2 + (a.g - b[1]) ** 2 + (a.b - b[2]) ** 2);
}

function clasificarColor(r: number, g: number, b: number): string {
  let mejor = ETIQUETAS_COLOR[0];
  let min = Infinity;
  for (const e of ETIQUETAS_COLOR) {
    const d = distanciaRgb({ r, g, b }, e.rgb);
    if (d < min) {
      min = d;
      mejor = e;
    }
  }
  return mejor.nombre;
}

function detectarPatrones(muestras: { r: number; g: number; b: number }[]): string[] {
  const patrones: string[] = [];
  const variacion =
    muestras.reduce((s, c) => s + Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b), 0) /
    muestras.length;

  const claros = muestras.filter((c) => (c.r + c.g + c.b) / 3 > 180).length;
  const oscuros = muestras.filter((c) => (c.r + c.g + c.b) / 3 < 70).length;

  if (claros > muestras.length * 0.25 && oscuros > muestras.length * 0.25) {
    patrones.push("contraste claro/oscuro (posible manchas o atigrado)");
  }
  if (variacion > 55) {
    patrones.push("variedad de tonos en el pelaje");
  }
  if (patrones.length === 0) {
    patrones.push("pelaje de color relativamente uniforme");
  }
  return patrones;
}

/** Analiza un data URL en el navegador (Canvas API). */
export function extraerCaracteristicasDesdeDataUrl(
  dataUrl: string
): Promise<CaracteristicasVisuales> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const w = 64;
      const h = 64;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas no disponible"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const { data } = ctx.getImageData(0, 0, w, h);
      const muestras: { r: number; g: number; b: number }[] = [];
      let sr = 0;
      let sg = 0;
      let sb = 0;
      let n = 0;

      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) continue;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        muestras.push({ r, g, b });
        sr += r;
        sg += g;
        sb += b;
        n++;
      }

      if (n === 0) {
        resolve({
          colorPredominante: "desconocido",
          colorRgb: { r: 128, g: 128, b: 128 },
          tamanoEstimado: "desconocido",
          patrones: ["no se pudo analizar la imagen"],
          confianzaColor: 0,
        });
        return;
      }

      const promedio = {
        r: Math.round(sr / n),
        g: Math.round(sg / n),
        b: Math.round(sb / n),
      };

      const areaRelativa = (img.width * img.height) / (1920 * 1080);
      let tamanoEstimado: CaracteristicasVisuales["tamanoEstimado"] = "mediano";
      if (areaRelativa < 0.08) tamanoEstimado = "pequeño";
      else if (areaRelativa > 0.35) tamanoEstimado = "grande";

      resolve({
        colorPredominante: clasificarColor(promedio.r, promedio.g, promedio.b),
        colorRgb: promedio,
        tamanoEstimado,
        patrones: detectarPatrones(muestras),
        confianzaColor: Math.min(0.92, 0.5 + n / (w * h)),
      });
    };
    img.onerror = () => reject(new Error("Imagen no válida"));
    img.src = dataUrl;
  });
}
