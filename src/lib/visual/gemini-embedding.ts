/**
 * Adaptador visual: data URL → lib/gemini.ts (Flash + Embedding 2).
 */

import { dataUrlABuffer } from "@/lib/visual/data-url";
import { preprocesarDataUrlParaClip } from "@/lib/visual/preprocesar-imagen";
import {
  coseno,
  geminiConfigurada,
  MODELO_GEMINI_EMBEDDING,
  vectorDesdeImagenBuffer,
} from "@/lib/gemini";

export {
  coseno,
  geminiConfigurada as geminiEmbeddingConfigurada,
  MODELO_GEMINI_EMBEDDING,
  proyectoGoogleCloud,
} from "@/lib/gemini";

export type ResultadoEmbeddingVisual = {
  vector: number[];
  modelo: string;
  descripcion?: string;
};

export async function embeddingDesdeDataUrl(
  dataUrl: string,
  opciones?: { sinPreproceso?: boolean }
): Promise<ResultadoEmbeddingVisual> {
  if (!geminiConfigurada()) {
    throw new Error(
      "Gemini no configurado: GOOGLE_CLOUD_PROJECT + credenciales ADC."
    );
  }
  if (!dataUrl.startsWith("data:image/")) {
    throw new Error("La imagen debe ser un data URL (data:image/...).");
  }

  const preparada = opciones?.sinPreproceso
    ? dataUrl
    : await preprocesarDataUrlParaClip(dataUrl);
  const { buffer, mime } = dataUrlABuffer(preparada);
  const { vector, descripcion, modelo } = await vectorDesdeImagenBuffer(
    buffer,
    mime
  );

  return { vector, modelo, descripcion };
}
