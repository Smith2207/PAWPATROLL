import { Icono, type NombreIcono } from "@/componentes/ui/Icono";

const CARACTERISTICAS: {
  clase: string;
  iconoClase: string;
  icono: NombreIcono;
  titulo: string;
  desc: string;
}[] = [
  {
    clase: "fc-orange",
    iconoClase: "fi-or",
    icono: "camara" as const,
    titulo: "Búsqueda por foto",
    desc: "Compara una imagen con fichas de mascotas perdidas usando similitud visual (IA). Sirve para orientar un avistamiento; la confirmación la hace la comunidad.",
  },
  {
    clase: "fc-blue",
    iconoClase: "fi-bl",
    icono: "mapa" as const,
    titulo: "Mapa comunitario",
    desc: "Mapa comunitario con zona de búsqueda por mascota y avistamientos; en cada ficha, mapa propio con refugios probables y guía de búsqueda.",
  },
  {
    clase: "fc-blue",
    iconoClase: "fi-bl",
    icono: "cerebro" as const,
    titulo: "Guía de búsqueda",
    desc: "Consejos según raza y tamaño, radio de búsqueda que crece con el tiempo y puntos de refugio probables en la ficha de cada mascota.",
  },
  {
    clase: "fc-yellow",
    iconoClase: "fi-ye",
    icono: "campana" as const,
    titulo: "Avisos al dueño",
    desc: "Cuando un avistamiento se vincula a una mascota, el dueño recibe un correo (si SMTP está configurado). Puedes verificar o descartar reportes en la ficha.",
  },
  {
    clase: "fc-purple",
    iconoClase: "fi-pu",
    icono: "mensaje" as const,
    titulo: "Mensajes por avistamiento",
    desc: "Chat por cada reporte entre dueño y quien avistó. El mapa se actualiza al instante en local y se refresca automáticamente en producción.",
  },
  {
    clase: "fc-red",
    iconoClase: "fi-re",
    icono: "personas" as const,
    titulo: "Ficha pública",
    desc: "Enlace para compartir fotos, contacto que tú elijas y línea de tiempo de avistamientos en la búsqueda.",
  },
];

type Props = { sinEncabezado?: boolean };

export function SeccionCaracteristicas({ sinEncabezado = false }: Props) {
  return (
    <div className="section-wrap">
      {!sinEncabezado && (
        <div className="section-header section-header--izq">
          <div className="section-eyebrow">Funciones</div>
          <div className="section-title">¿Qué incluye PawPatrol?</div>
          <p className="section-sub">
            Herramientas concretas para dueños y vecinos, sin promesas que el
            sistema no cumple solo.
          </p>
        </div>
      )}
      <div className="features-grid">
        {CARACTERISTICAS.map((c) => (
          <div key={c.titulo} className={`feature-card ${c.clase}`}>
            <div className={`feature-icon ${c.iconoClase}`}>
              <Icono nombre={c.icono} size={24} />
            </div>
            <div className="feature-title">{c.titulo}</div>
            <div className="feature-desc">{c.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
