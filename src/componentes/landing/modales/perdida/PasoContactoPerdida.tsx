/**
 * [perdida] Wizard paso 3: contacto público y recompensa.
 */
type Props = {
  contactoNombre: string;
  onContactoNombreChange: (v: string) => void;
  contactoTelefono: string;
  onContactoTelefonoChange: (v: string) => void;
  contactoEmail: string;
  onContactoEmailChange: (v: string) => void;
  recompensa: string;
  onRecompensaChange: (v: string) => void;
  nombreSesion?: string | null;
  emailSesion?: string | null;
};

export function PasoContactoPerdida({
  contactoNombre,
  onContactoNombreChange,
  contactoTelefono,
  onContactoTelefonoChange,
  contactoEmail,
  onContactoEmailChange,
  recompensa,
  onRecompensaChange,
  nombreSesion,
  emailSesion,
}: Props) {
  return (
    <>
      <div className="section-divider">Datos de contacto en la página pública</div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="contactoNombre">Tu nombre</label>
          <input
            id="contactoNombre"
            name="contactoNombre"
            type="text"
            placeholder="Nombre del dueño"
            value={contactoNombre || nombreSesion || ""}
            onChange={(e) => onContactoNombreChange(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="contactoTelefono">Teléfono (público en la página)</label>
          <input
            id="contactoTelefono"
            name="contactoTelefono"
            type="tel"
            placeholder="+51 999 999 999"
            value={contactoTelefono}
            onChange={(e) => onContactoTelefonoChange(e.target.value)}
          />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="contactoEmail">Correo (público en la página)</label>
        <input
          id="contactoEmail"
          name="contactoEmail"
          type="email"
          placeholder="tucorreo@ejemplo.com"
          value={contactoEmail || emailSesion || ""}
          onChange={(e) => onContactoEmailChange(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="recompensa">¿Ofrece recompensa?</label>
        <input
          id="recompensa"
          name="recompensa"
          type="text"
          placeholder="Ej: S/. 200 a quien lo encuentre (opcional)"
          value={recompensa}
          onChange={(e) => onRecompensaChange(e.target.value)}
        />
      </div>
    </>
  );
}
