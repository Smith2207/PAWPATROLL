export function FormularioDatosMascota() {
  return (
    <>
      <div className="section-divider">Datos de la mascota</div>

      <div className="form-row">
        <div className="form-group">
          <label>Nombre de la mascota *</label>
          <input type="text" placeholder="Ej: Max" />
        </div>
        <div className="form-group">
          <label>Tipo *</label>
          <select defaultValue="">
            <option value="">Seleccionar...</option>
            <option>🐕 Perro</option>
            <option>🐱 Gato</option>
            <option>🐦 Ave</option>
            <option>Otro</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Raza</label>
          <input type="text" placeholder="Ej: Golden Retriever" />
        </div>
        <div className="form-group">
          <label>Sexo</label>
          <select defaultValue="">
            <option value="">Seleccionar...</option>
            <option>Macho</option>
            <option>Hembra</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Color principal</label>
          <input type="text" placeholder="Ej: Dorado, marrón" />
        </div>
        <div className="form-group">
          <label>Tamaño</label>
          <select defaultValue="">
            <option value="">Seleccionar...</option>
            <option>Pequeño (menos de 10kg)</option>
            <option>Mediano (10–25kg)</option>
            <option>Grande (más de 25kg)</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Edad aproximada</label>
          <input type="text" placeholder="Ej: 3 años" />
        </div>
        <div className="form-group">
          <label>Fecha y hora de pérdida *</label>
          <input type="datetime-local" />
        </div>
      </div>

      <div className="section-divider">Accesorios e identificación</div>

      <div className="form-group">
        <label>Descripción adicional</label>
        <textarea
          rows={2}
          placeholder="Señas particulares, collar azul, cicatrices, comportamiento especial..."
        />
      </div>
    </>
  );
}
