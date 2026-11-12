import React, { useState } from 'react';
import {
  Library,
  Trash2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Search,
  Layers,
  ArrowRightCircle,
  Package,
} from 'lucide-react';

const STATUSES = [
  { key: 'available', label: 'Disponible' },
  { key: 'reserved', label: 'Reservado' },
  { key: 'maintenance', label: 'Mantenimiento' },
  { key: 'archived', label: 'Archivado' },
];

/**
 * ItemsGrid
 * Presenta el catálogo de libros y expone controles para transiciones de estado FSM
 * y eliminación protegida por Compliance Guard.
 */
export function ItemsGrid({
  items = [],
  loading,
  onUpdateStatus,
  onDeleteItem,
  actionLoadingId,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  // Filtrado reactivo en el frontend para respuesta instantánea
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      (item.title && item.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.author && item.author.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      filterCategory === 'ALL' || item.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  // Lista única de categorías para el filtro
  const categories = ['ALL', ...new Set(items.map((i) => i.category).filter(Boolean))];

  // Helper para renderizar el estilo del badge de estado
  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return <span className="badge badge-available">● Disponible</span>;
      case 'reserved':
        return <span className="badge badge-reserved">● Reservado</span>;
      case 'maintenance':
        return <span className="badge badge-maintenance">● Mantenimiento</span>;
      case 'archived':
        return <span className="badge badge-archived">● Archivado</span>;
      default:
        return <span className="badge badge-category">{status || 'Desconocido'}</span>;
    }
  };

  // Helper para el campo de cálculo de negocio `stock_alert`
  const renderStockAlert = (alert) => {
    if (!alert) return <span className="business-prop-value">Normal</span>;
    const alertUpper = String(alert).toUpperCase();

    if (alertUpper.includes('CRITICAL') || alertUpper.includes('OUT') || alertUpper === 'AGOTADO') {
      return (
        <span className="business-prop-value stock-alert-critical">
          ⚠️ {alert}
        </span>
      );
    }
    if (alertUpper.includes('LOW') || alertUpper.includes('BAJO')) {
      return (
        <span className="business-prop-value stock-alert-warning">
          ⚡ {alert}
        </span>
      );
    }
    return (
      <span className="business-prop-value stock-alert-ok">
        ✓ {alert}
      </span>
    );
  };

  return (
    <div className="card-panel">
      <div className="panel-header">
        <div>
          <h2>
            <Library size={20} color="#38bdf8" />
            <span>Catálogo de Biblioteca (PostgreSQL + Capa de Negocio)</span>
          </h2>
          <p>
            Registros persistidos enriquecidos con <code>stock_alert</code> y <code>loan_policy</code>
          </p>
        </div>
        <span className="badge badge-category">GET /api/v1/items ({items.length})</span>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="items-controls-bar">
        <div className="items-search-box">
          <Search size={15} color="#94a3b8" />
          <input
            type="text"
            placeholder="Buscar por título o autor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {categories.length > 1 && (
          <select
            className="form-control"
            style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'ALL' ? 'Todas las Categorías' : cat}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Estado de carga */}
      {loading && items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <span className="spinner" style={{ width: 24, height: 24 }} />
          </div>
          <h3>Consultando Capa de Persistencia...</h3>
          <p>Recuperando registros desde PostgreSQL 16 a través de la Capa de Servicios REST.</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Package size={28} />
          </div>
          <h3>No se encontraron libros</h3>
          <p>
            {items.length === 0
              ? 'El catálogo se encuentra vacío en la base de datos. Utilice el formulario para registrar el primer libro.'
              : 'Ningún libro coincide con el criterio de búsqueda actual.'}
          </p>
        </div>
      ) : (
        <div className="items-grid">
          {filteredItems.map((item) => {
            const isActing = actionLoadingId === item.id;

            return (
              <div key={item.id} className="item-card">
                <div>
                  <div className="item-card-header">
                    <span className="item-card-id">ID: #{item.id}</span>
                    {getStatusBadge(item.status)}
                  </div>

                  <h3 className="item-title">{item.title}</h3>
                  <p className="item-author">por {item.author}</p>

                  <div className="item-meta-badges">
                    <span className="badge badge-category">
                      {item.category || 'General'}
                    </span>
                    <span className="badge badge-category">
                      Stock: {item.stock !== undefined ? item.stock : 'N/A'}
                    </span>
                  </div>

                  {/* Campos Calculados por la Capa de Negocio (Domain Logic) */}
                  <div className="business-layer-props">
                    <div className="business-prop-row">
                      <span className="business-prop-label">
                        <AlertTriangle size={12} /> Stock Alert:
                      </span>
                      {renderStockAlert(item.stock_alert || item.stockAlert)}
                    </div>
                    <div className="business-prop-row">
                      <span className="business-prop-label">
                        <Clock size={12} /> Loan Policy:
                      </span>
                      <span className="business-prop-value" style={{ color: '#a5b4fc' }}>
                        {item.loan_policy || item.loanPolicy || 'STANDARD_14_DAYS'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones de Cambio de Estado (FSM) y Eliminación */}
                <div className="item-card-actions">
                  <div className="status-fsm-group">
                    <span className="fsm-label">Transición FSM (PATCH /status):</span>
                    <div className="fsm-buttons-row">
                      {STATUSES.map((st) => (
                        <button
                          key={st.key}
                          type="button"
                          disabled={isActing || item.status === st.key}
                          className={`fsm-btn ${item.status === st.key ? 'active' : ''}`}
                          onClick={() => onUpdateStatus(item.id, st.key)}
                          title={`Transicionar estado a "${st.label}"`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isActing}
                    className="item-delete-btn"
                    onClick={() => onDeleteItem(item.id, item.status)}
                    title="Eliminar libro (Protegido por Compliance Guard en backend)"
                  >
                    {isActing ? (
                      <>
                        <span className="spinner" style={{ width: 12, height: 12 }} />
                        <span>Procesando...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 size={13} />
                        <span>Eliminar (DELETE /api/v1/items/{item.id})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ItemsGrid;

