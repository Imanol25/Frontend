import React, { useState } from 'react';
import { PlusCircle, Send, Code2, BookOpen } from 'lucide-react';

const CATEGORIES = [
  'Tecnología',
  'Arquitectura de Software',
  'Ciencia Ficción',
  'Filosofía',
  'Historia',
  'Literatura Clásica',
  'Matemáticas',
  'Bases de Datos',
];

/**
 * CreateItemForm
 * Formulario para registrar un nuevo libro en la base de datos a través de la Capa de Servicios.
 * Expone la vista previa en vivo del JSON que viajará por HTTP (demostración de transporte JSON puro).
 */
export function CreateItemForm({ onSubmit, isSubmitting }) {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: 'Arquitectura de Software',
    stock: 5,
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : parseInt(value, 10)) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.author.trim()) {
      return;
    }

    const payload = {
      title: formData.title.trim(),
      author: formData.author.trim(),
      category: formData.category,
      stock: Number(formData.stock) || 0,
    };

    const success = await onSubmit(payload);
    if (success) {
      // Resetear campos del formulario manteniendo categoría por defecto
      setFormData({
        title: '',
        author: '',
        category: 'Arquitectura de Software',
        stock: 5,
      });
    }
  };

  // Payload exacto que se transmitirá por HTTP POST en formato JSON
  const livePayloadJson = JSON.stringify(
    {
      title: formData.title || '',
      author: formData.author || '',
      category: formData.category,
      stock: Number(formData.stock) || 0,
    },
    null,
    2
  );

  return (
    <div className="card-panel">
      <div className="panel-header">
        <div>
          <h2>
            <BookOpen size={20} color="#38bdf8" />
            <span>Registrar Libro</span>
          </h2>
          <p>Envío HTTP POST a la Capa de Servicios</p>
        </div>
        <span className="badge badge-category">POST /api/v1/items</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Título del Libro *</label>
          <input
            id="title"
            name="title"
            type="text"
            required
            className="form-control"
            placeholder="Ej: Fundamentals of Software Architecture"
            value={formData.title}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="author">Autor(es) *</label>
          <input
            id="author"
            name="author"
            type="text"
            required
            className="form-control"
            placeholder="Ej: Mark Richards & Neal Ford"
            value={formData.author}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Categoría</label>
            <select
              id="category"
              name="category"
              className="form-control"
              value={formData.category}
              onChange={handleChange}
              disabled={isSubmitting}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="stock">Stock Inicial</label>
            <input
              id="stock"
              name="stock"
              type="number"
              min="0"
              max="999"
              className="form-control"
              value={formData.stock}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Vista previa en vivo del JSON a transmitir */}
        <div className="json-preview-container">
          <div className="json-preview-header">
            <span className="json-preview-title">
              <Code2 size={13} style={{ display: 'inline', marginRight: '4px' }} />
              Live JSON Payload Preview (application/json)
            </span>
          </div>
          <pre className="json-preview-code">{livePayloadJson}</pre>
        </div>

        <div style={{ marginTop: '1.25rem' }}>
          <button
            type="submit"
            disabled={isSubmitting || !formData.title.trim() || !formData.author.trim()}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            {isSubmitting ? (
              <>
                <span className="spinner" />
                <span>Transmitiendo HTTP POST...</span>
              </>
            ) : (
              <>
                <Send size={15} />
                <span>Enviar a la Capa de Negocio</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateItemForm;

