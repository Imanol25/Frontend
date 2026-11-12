import React from 'react';
import { BookOpen, CheckCircle, Clock, Wrench, Archive, AlertTriangle } from 'lucide-react';

/**
 * MetricsOverview
 * Visualiza indicadores clave del negocio (KPIs) calculados sobre los datos
 * recibidos de la Capa de Servicios.
 */
export function MetricsOverview({ items = [] }) {
  const totalItems = items.length;
  const availableItems = items.filter((i) => i.status === 'available').length;
  const reservedItems = items.filter((i) => i.status === 'reserved').length;
  const maintenanceItems = items.filter((i) => i.status === 'maintenance').length;
  const archivedItems = items.filter((i) => i.status === 'archived').length;

  const lowStockCount = items.filter((i) => {
    const alert = String(i.stock_alert || i.stockAlert || '').toUpperCase();
    return alert.includes('LOW') || alert.includes('CRITICAL') || alert.includes('OUT') || alert === 'AGOTADO';
  }).length;

  return (
    <div className="metrics-grid">
      <div className="metric-card">
        <div className="metric-icon-box cyan">
          <BookOpen size={22} />
        </div>
        <div>
          <div className="metric-value">{totalItems}</div>
          <div className="metric-label">Total en Catálogo</div>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon-box green">
          <CheckCircle size={22} />
        </div>
        <div>
          <div className="metric-value">{availableItems}</div>
          <div className="metric-label">Disponibles para Préstamo</div>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon-box amber">
          <Clock size={22} />
        </div>
        <div>
          <div className="metric-value">{reservedItems}</div>
          <div className="metric-label">Reservados / En Tránsito</div>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon-box purple">
          <AlertTriangle size={22} />
        </div>
        <div>
          <div className="metric-value">{lowStockCount}</div>
          <div className="metric-label">Alertas de Stock</div>
        </div>
      </div>
    </div>
  );
}

export default MetricsOverview;

