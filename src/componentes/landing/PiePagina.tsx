/**
 * [landing] Componente React: pie pagina.
 */
import { Icono } from "@/componentes/ui/Icono";

export function PiePagina() {
  return (
    <footer>
      <div className="footer-inner">
        <div>
          <div className="footer-logo">
            <Icono nombre="huella" size={18} className="pp-icon--btn" />
            PawPatrol
          </div>
        </div>
        <div className="footer-text">
          © 2026 <span>PawPatrol</span> — Universidad Nacional del Altiplano ·
          Ingeniería Estadística e Informática · Puno, Perú
          <div className="footer-members">
            Branly Paucar · Lenin Apaza · Geremi Venegas · Fernando Mamani ·
            Eddy Mamani
          </div>
        </div>
      </div>
    </footer>
  );
}
