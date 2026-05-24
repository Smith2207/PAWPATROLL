export type UnidadEdad = "años" | "meses";

export function componerEdad(
  valor: string,
  unidad: UnidadEdad,
  aproximada: boolean
): string {
  const n = valor.trim();
  if (!n) return "";
  const sufijo = aproximada ? " (aprox.)" : "";
  return `${n} ${unidad}${sufijo}`;
}

export function parsearEdad(edad: string | null | undefined): {
  valor: string;
  unidad: UnidadEdad;
  aproximada: boolean;
} {
  if (!edad?.trim()) {
    return { valor: "", unidad: "años", aproximada: false };
  }

  const aproximada = /aprox/i.test(edad);
  const match = edad.match(/^([\d.,]+)\s*(años?|meses?)/i);
  if (!match) {
    return { valor: edad.replace(/\s*\(aprox\.?\)/i, "").trim(), unidad: "años", aproximada };
  }

  const unidadRaw = match[2].toLowerCase();
  const unidad: UnidadEdad = unidadRaw.startsWith("mes") ? "meses" : "años";
  return { valor: match[1], unidad, aproximada };
}

export function componerPeso(valor: string, aproximado: boolean): string {
  const n = valor.trim();
  if (!n) return "";
  const texto = n.toLowerCase().includes("kg") ? n : `${n} kg`;
  return aproximado ? `${texto} (aprox.)` : texto;
}

export function parsearPeso(peso: string | null | undefined): {
  valor: string;
  aproximado: boolean;
} {
  if (!peso?.trim()) return { valor: "", aproximado: false };
  const aproximado = /aprox/i.test(peso);
  const valor = peso.replace(/\s*\(aprox\.?\)/i, "").replace(/\s*kg\s*/i, " kg ").trim();
  return { valor, aproximado };
}

export function componerMicrochip(tiene: string, numero: string): string {
  if (tiene === "no") return "No cuenta con microchip";
  if (tiene === "si") {
    const n = numero.trim();
    return n ? `Sí — ${n}` : "Sí cuenta con microchip";
  }
  return "";
}

export function parsearMicrochip(microchip: string | null | undefined): {
  tiene: "" | "si" | "no";
  numero: string;
} {
  if (!microchip?.trim()) return { tiene: "", numero: "" };
  if (/^no/i.test(microchip.trim())) return { tiene: "no", numero: "" };
  const match = microchip.match(/^s[ií]\s*[—-]?\s*(.*)$/i);
  if (match) return { tiene: "si", numero: match[1]?.trim() ?? "" };
  if (/^s[ií]/i.test(microchip.trim())) return { tiene: "si", numero: "" };
  return { tiene: "si", numero: microchip.trim() };
}

export function componerContactoPublico(telefono: string, email: string): string {
  const partes: string[] = [];
  const tel = telefono.trim();
  const mail = email.trim();
  if (tel) partes.push(`Tel: ${tel}`);
  if (mail) partes.push(`Email: ${mail}`);
  return partes.join(" | ");
}

export function parsearContactoPublico(contacto: string | null | undefined): {
  telefono: string;
  email: string;
} {
  if (!contacto?.trim()) return { telefono: "", email: "" };

  let telefono = "";
  let email = "";

  const partes = contacto.split("|").map((p) => p.trim());
  for (const parte of partes) {
    if (/^tel:/i.test(parte)) telefono = parte.replace(/^tel:\s*/i, "").trim();
    else if (/^email:/i.test(parte)) email = parte.replace(/^email:\s*/i, "").trim();
    else if (parte.includes("@") && !email) email = parte;
    else if (!telefono) telefono = parte;
  }

  return { telefono, email };
}
