import React, { useState } from 'react';
import {
  Layers,
  Terminal,
  FileJson,
  ArrowRight,
  Server,
  Database,
  Cpu,
  Monitor,
  CheckCircle,
  Copy,
  Check,
} from 'lucide-react';

/**
 * ArchitectureInspector
 * Componente interactivo diseñado para la sustentación y defensa del proyecto.
 * Demuestra la separación estricta de capas según el Capítulo 10 de
 * "Fundamentals of Software Architecture" (Mark Richards & Neal Ford).
 */
export function ArchitectureInspector({
  lastTrace = [],
  lastRawResponse = null,
  lastEndpoint = 'GET /api/v1/items',
  lastStatus = 200,
}) {
  const [activeTab, setActiveTab] = useState('diagram');
  const [copied, setCopied] = useState(false);

  const handleCopyRaw = () => {
    if (!lastRawResponse) return;
    const text = typeof lastRawResponse === 'string'
      ? lastRawResponse
      : JSON.stringify(lastRawResponse, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Traza por defecto demostrativa en caso de que el backend no haya devuelto una aún
  const displayTrace = lastTrace && lastTrace.length > 0 ? lastTrace : [
    '1. [Client Presentation] React UI dispatched fetch(POST/GET/PATCH) with application/json',
    '2. [HTTP Network] Reverse Proxy / REST Routing -> Endpoint reached on port 4000',
    '3. [Presentation Controller] Express/FastAPI Router validated HTTP headers and parsed request body',
    '4. [Business Service Layer] Domain rules executed: FSM transitions, stock alert calculation, loan policy',
    '5. [Persistence Repository Layer] Prepared SQL query executed with parameterized inputs',
    '6. [Database Engine] PostgreSQL 16 committed transaction and returned relational rowset',
    '7. [Business Service Layer] Entity mapped to DTO + enriched with calculated business properties',
    '8. [Presentation Controller] Serialized response into pure JSON with HTTP status code',
    '9. [Client Presentation] React State updated via re-render without page refresh (SPA)'
  ];

  return (
    <div className="inspector-panel">
      <div className="panel-header">
        <div>
          <h2>
            <Layers size={20} color="#818cf8" />
            <span>Inspector de Arquitectura por Capas (Cap. 10)</span>
          </h2>
          <p>
            Verificación técnica de aislamiento de capas, contratos HTTP JSON y traza de ejecución E2E
          </p>
        </div>

        <div className="header-badges">
          <span className="badge badge-category">
            {lastEndpoint}
          </span>
          <span className={`badge ${lastStatus >= 200 && lastStatus < 300 ? 'badge-available' : 'badge-reserved'}`}>
            HTTP {lastStatus || '---'}
          </span>
        </div>
      </div>

      {/* Pestañas del Inspector */}
      <div className="inspector-tabs-header">
        <button
          type="button"
          className={`inspector-tab-btn ${activeTab === 'diagram' ? 'active' : ''}`}
          onClick={() => setActiveTab('diagram')}
        >
          <Layers size={16} />
          <span>1. Flujo de Capas E2E</span>
        </button>

        <button
          type="button"
          className={`inspector-tab-btn ${activeTab === 'trace' ? 'active' : ''}`}
          onClick={() => setActiveTab('trace')}
        >
          <Terminal size={16} />
          <span>2. architecture_trace ({displayTrace.length})</span>
        </button>

        <button
          type="button"
          className={`inspector-tab-btn ${activeTab === 'raw' ? 'active' : ''}`}
          onClick={() => setActiveTab('raw')}
        >
          <FileJson size={16} />
          <span>3. Raw JSON Payload</span>
        </button>
      </div>

      {/* Pestaña 1: Diagrama de Capas */}
      {activeTab === 'diagram' && (
        <div className="layers-flow-diagram">
          <div className="layer-step-card">
            <div className="layer-number-badge layer-1">01</div>
            <div className="layer-step-body">
              <div className="layer-step-title">
                <Monitor size={16} color="#38bdf8" />
                <span>Capa de Presentación Cliente (React SPA + Vite)</span>
              </div>
              <p className="layer-step-desc">
                Interfaz de usuario reactiva alojada en el navegador. Gestiona el estado local, renderiza vistas y orquesta eventos. <strong>Prohibido acceso directo a la BD</strong>.
              </p>
            </div>
            <span className="badge badge-category">Frontend Port 5173</span>
          </div>

          <div className="layer-step-connector">
            <span>▼ Transmisión HTTP REST: <code>Content-Type: application/json</code> ▼</span>
          </div>

          <div className="layer-step-card">
            <div className="layer-number-badge layer-2">02</div>
            <div className="layer-step-body">
              <div className="layer-step-title">
                <Server size={16} color="#818cf8" />
                <span>Capa de Presentación Servidor (Controllers / Routers)</span>
              </div>
              <p className="layer-step-desc">
                Punto de entrada HTTP en el Backend (puerto 4000). Valida contratos de entrada, deserializa JSON, aplica CORS y delega el flujo a la Capa de Negocio sin contener lógica de dominio.
              </p>
            </div>
            <span className="badge badge-category">REST API Layer</span>
          </div>

          <div className="layer-step-connector">
            <span>▼ Invocación de Métodos de Dominio (Dependency Injection) ▼</span>
          </div>

          <div className="layer-step-card">
            <div className="layer-number-badge layer-3">03</div>
            <div className="layer-step-body">
              <div className="layer-step-title">
                <Cpu size={16} color="#a855f7" />
                <span>Capa de Negocio (Domain & Services Layer)</span>
              </div>
              <p className="layer-step-desc">
                Corazón del sistema. Aplica reglas de negocio: Máquina de Estados Finitos (FSM), cálculo de <code>stock_alert</code>, políticas de préstamo (<code>loan_policy</code>) y Compliance Guard (HTTP 409).
              </p>
            </div>
            <span className="badge badge-category">Business Rules</span>
          </div>

          <div className="layer-step-connector">
            <span>▼ Operaciones de Abstracción de Datos (Repository Pattern) ▼</span>
          </div>

          <div className="layer-step-card">
            <div className="layer-number-badge layer-4">04</div>
            <div className="layer-step-body">
              <div className="layer-step-title">
                <Database size={16} color="#ec4899" />
                <span>Capa de Persistencia (Repository / DAO)</span>
              </div>
              <p className="layer-step-desc">
                Aísla el mecanismo de almacenamiento del resto de la aplicación. Construye consultas SQL parametrizadas evitando inyecciones y mapea tuplas a modelos de dominio.
              </p>
            </div>
            <span className="badge badge-category">Data Access</span>
          </div>

          <div className="layer-step-connector">
            <span>▼ TCP Socket / Conexión Pool PostgreSQL ▼</span>
          </div>

          <div className="layer-step-card">
            <div className="layer-number-badge layer-5">05</div>
            <div className="layer-step-body">
              <div className="layer-step-title">
                <Database size={16} color="#10b981" />
                <span>Base de Datos Relacional (PostgreSQL 16)</span>
              </div>
              <p className="layer-step-desc">
                Motor transaccional ACID. Almacena las tablas de catálogo y auditoría con integridad referencial.
              </p>
            </div>
            <span className="badge badge-category">Port 5432</span>
          </div>
        </div>
      )}

      {/* Pestaña 2: architecture_trace */}
      {activeTab === 'trace' && (
        <div className="trace-container">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Traza de responsabilidades por capa generada durante la última operación:
          </p>
          {displayTrace.map((step, idx) => (
            <div key={idx} className="trace-item">
              <span className="trace-index">#{String(idx + 1).padStart(2, '0')}</span>
              <span className="trace-text">{step}</span>
            </div>
          ))}
        </div>
      )}

      {/* Pestaña 3: Raw JSON Payload */}
      {activeTab === 'raw' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Última respuesta HTTP en crudo (Prueba de transmisión pura JSON y cero HTML):
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleCopyRaw}
              title="Copiar JSON al portapapeles"
            >
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copied ? 'Copiado!' : 'Copiar JSON'}</span>
            </button>
          </div>
          <pre className="raw-json-viewer">
            {lastRawResponse
              ? typeof lastRawResponse === 'string'
                ? lastRawResponse
                : JSON.stringify(lastRawResponse, null, 2)
              : '// Esperando primera respuesta del servidor...'}
          </pre>
        </div>
      )}
    </div>
  );
}

export default ArchitectureInspector;

