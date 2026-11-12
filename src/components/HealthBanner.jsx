import React from 'react';
import { Activity, CheckCircle2, XCircle, RefreshCw, Database, Server } from 'lucide-react';

/**
 * HealthBanner
 * Monitorea y visualiza el estado en vivo de la conexión End-to-End:
 * [React SPA] ---> HTTP GET /api/v1/health ---> [Backend API] ---> [PostgreSQL 16]
 */
export function HealthBanner({ healthData, isHealthy, loading, onRefresh }) {
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

  // Extraer información del backend y DB si viene en la respuesta
  const dbStatus = healthData?.database || healthData?.db || (isHealthy ? 'connected' : 'disconnected');
  const serviceName = healthData?.service || 'Library Management Backend API';
  const environment = healthData?.environment || 'development';
  const responseTime = healthData?.timestamp ? new Date(healthData.timestamp).toLocaleTimeString() : null;

  return (
    <div className={`health-banner ${isHealthy ? 'healthy' : 'unhealthy'}`}>
      <div className="health-status-group">
        <div className="pulse-dot" />

        <div className="health-text">
          <h3>
            {isHealthy ? (
              <>
                <CheckCircle2 size={18} color="#10b981" />
                <span>Capa de Servicios Conectada (HTTP 200 OK)</span>
              </>
            ) : (
              <>
                <XCircle size={18} color="#ef4444" />
                <span>Sin Conexión con el Backend / Base de Datos</span>
              </>
            )}
          </h3>
          <p>
            {isHealthy ? (
              <>
                Comunicación activa con <code>{backendUrl}</code> | Base de Datos: <strong>{String(dbStatus).toUpperCase()}</strong> {responseTime && `| Sincronizado: ${responseTime}`}
              </>
            ) : (
              <>
                No se pudo alcanzar el endpoint <code>{backendUrl}/health</code>. Verifique que el contenedor o servicio del Backend esté en ejecución en el puerto 4000.
              </>
            )}
          </p>
        </div>
      </div>

      <div className="health-actions">
        <div className="header-badges">
          <span className="architecture-tag">
            <Server size={13} />
            <span>Backend: {isHealthy ? 'Online' : 'Offline'}</span>
          </span>
          <span className="architecture-tag">
            <Database size={13} />
            <span>PostgreSQL: {String(dbStatus)}</span>
          </span>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="btn btn-secondary btn-sm"
          title="Reintentar handshake con el Backend"
        >
          <RefreshCw size={14} className={loading ? 'spinner' : ''} />
          <span>{loading ? 'Verificando...' : 'Reconectar'}</span>
        </button>
      </div>
    </div>
  );
}

export default HealthBanner;

