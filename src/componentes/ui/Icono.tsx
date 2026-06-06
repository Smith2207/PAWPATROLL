import {
  AlertTriangle,
  Bell,
  Brain,
  Camera,
  Cat,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleX,
  ClipboardList,
  Crosshair,
  Download,
  Mail,
  Shield,
  Star,
  Clock,
  Dog,
  Eye,
  EyeOff,
  GraduationCap,
  Handshake,
  Home,
  Image as ImageIcon,
  Info,
  Lock,
  Map,
  MapPin,
  Menu,
  Megaphone,
  MessageCircle,
  Palette,
  PartyPopper,
  PawPrint,
  Phone,
  Ruler,
  Scale,
  Search,
  Send,
  Syringe,
  Tag,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

export type NombreIcono =
  | "alerta"
  | "campana"
  | "ojo"
  | "ojoOff"
  | "camara"
  | "mensaje"
  | "mapa"
  | "ubicacion"
  | "celebracion"
  | "check"
  | "dobleCheck"
  | "cerrar"
  | "buscar"
  | "info"
  | "candado"
  | "graduacion"
  | "comunidad"
  | "casa"
  | "perro"
  | "gato"
  | "reloj"
  | "telefono"
  | "color"
  | "tamano"
  | "peso"
  | "etiqueta"
  | "vacuna"
  | "personas"
  | "cerebro"
  | "lista"
  | "imagen"
  | "izquierda"
  | "derecha"
  | "enviar"
  | "huella"
  | "megafono"
  | "menu"
  | "alertaCirculo"
  | "checkCirculo"
  | "xCirculo"
  | "estrella"
  | "escudo"
  | "descargar"
  | "correo"
  | "objetivo";

const MAPA: Record<NombreIcono, LucideIcon> = {
  alerta: AlertTriangle,
  campana: Bell,
  ojo: Eye,
  ojoOff: EyeOff,
  camara: Camera,
  mensaje: MessageCircle,
  mapa: Map,
  ubicacion: MapPin,
  celebracion: PartyPopper,
  check: Check,
  dobleCheck: CheckCheck,
  cerrar: X,
  buscar: Search,
  info: Info,
  candado: Lock,
  graduacion: GraduationCap,
  comunidad: Handshake,
  casa: Home,
  perro: Dog,
  gato: Cat,
  reloj: Clock,
  telefono: Phone,
  color: Palette,
  tamano: Ruler,
  peso: Scale,
  etiqueta: Tag,
  vacuna: Syringe,
  personas: Users,
  cerebro: Brain,
  lista: ClipboardList,
  imagen: ImageIcon,
  izquierda: ChevronLeft,
  derecha: ChevronRight,
  enviar: Send,
  huella: PawPrint,
  megafono: Megaphone,
  menu: Menu,
  alertaCirculo: CircleAlert,
  checkCirculo: CircleCheck,
  xCirculo: CircleX,
  estrella: Star,
  escudo: Shield,
  descargar: Download,
  correo: Mail,
  objetivo: Crosshair,
};

type Props = {
  nombre: NombreIcono;
  size?: number;
  className?: string;
  strokeWidth?: number;
};

export function Icono({
  nombre,
  size = 18,
  className = "",
  strokeWidth = 2,
}: Props) {
  const Componente = MAPA[nombre];
  return (
    <Componente
      size={size}
      strokeWidth={strokeWidth}
      className={`pp-icon ${className}`.trim()}
      aria-hidden
    />
  );
}

export function iconoPorTipoMascota(tipo: string): NombreIcono {
  if (tipo === "Gato") return "gato";
  if (tipo === "Perro") return "perro";
  return "huella";
}
