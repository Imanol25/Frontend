import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from './services/apiClient';
import HealthBanner from './components/HealthBanner';
import MetricsOverview from './components/MetricsOverview';
import CreateItemForm from './components/CreateItemForm';
import ItemsGrid from './components/ItemsGrid';
import ArchitectureInspector from './components/ArchitectureInspector';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  X,
  Database,
  ExternalLink,
  Info,
} from 'lucide-react';

export function App() {
  // Estado global de ítems
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Estado de salud E2E
  const [healthData, setHealthData] = useState(null);
  const [isHealthy, setIsHealthy] = useState(false);
  const [checkingHealth, setCheckingHealth] = useState(false);

  // Alertas / Notificaciones activas en pantalla (para 201, 422, 409, 500)
  const [notification, setNotification] = useState(null);

  // Estados para el Inspector de Arquitectura
  const [lastTrace, setLastTrace] = useState([]);
  const [lastRawResponse, setLastRawResponse] = useState(null);
  const [lastEndpoint, setLastEndpoint] = useState('GET /api/v1/items');
  const [lastStatus, setLastStatus] = useState(200);

  /**
   * Helper para actualizar la traza y respuesta cruda del inspector
   */
  const updateInspectorData = (response, customTrace) => {
    setLastEndpoint(`${response.method || 'REQ'} ${response.endpoint || ''}`);
    setLastStatus(response.status);
    setLastRawResponse(response.data || response.rawText);

    if (response.data && Array.isArray(response.data.architecture_trace)) {
      setLastTrace(response.data.architecture_trace);
    } else if (customTrace && Array.isArray(customTrace)) {
      setLastTrace(customTrace);
    }
  };

  /**
   * 1. Handshake E2E: Verificación de salud (Health Check)
   */
  const handleCheckHealth = useCallback(async () => {
    setCheckingHealth(true);
    const res = await apiClient.checkHealth();
    setCheckingHealth(false);

    if (res.ok) {
      setIsHealthy(true);
      setHealthData(res.data);
      updateInspectorData(res, [
        '1. [Client Presentation] GET /api/v1/health disparado desde React',
        '2. [Presentation Controller] HealthController recibió la solicitud de sondeo',
        '3. [Business Service] HealthCheckService verificó estado de dependencias del sistema',
        '4. [Persistence Layer] DBConnectionPool ejecutó query "SELECT 1" en PostgreSQL 16',
        '5. [Database Engine] PostgreSQL respondió con estado activo (ready)',
        '6. [Presentation Controller] Serialización de JSON de diagnóstico -> HTTP 200 OK'
      ]);
    } else {
      setIsHealthy(false);
      setHealthData(null);
      updateInspectorData(res, [
        '1. [Client Presentation] Intento de conexión HTTP GET /api/v1/health',
        `2. [Network / Gateway] Fallo al alcanzar el servidor Backend: ${res.error || 'Connection refused'}`,
        '3. [Client Presentation] Modo offline activado para proteger la experiencia del usuario'
      ]);
    }
  }, []);

  /**
   * 2. Carga inicial del catálogo de libros
   */
  const loadItems = useCallback(async () => {
    setLoadingItems(true);
    const res = await apiClient.fetchItems();
    setLoadingItems(false);

    if (res.ok) {
      const itemsList = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.items)
        ? res.data.items
        : [];
      setItems(itemsList);
      updateInspectorData(res, res.data?.architecture_trace || [
        '1. [Client Presentation] useEffect montado -> Dispara fetchItems()',
        '2. [Presentation Controller] ItemsController.getAll() recibe petición GET',
        '3. [Business Layer] ItemDomainService.enrichItems() calcula stock_alert y loan_policy',
        '4. [Persistence Layer] ItemRepository.findAll() consulta tabla "items" en PostgreSQL',
        '5. [Database Engine] PostgreSQL devuelve tuplas ordenadas por id DESC',
        '6. [Presentation Controller] Respuesta enviada con cabecera application/json -> HTTP 200 OK'
      ]);
    } else {
      updateInspectorData(res);
      if (res.status !== 0) {
        setNotification({
          type: 'error',
          status: res.status,
          title: `Error al Cargar Catálogo (HTTP ${res.status})`,
          message: res.error || 'No fue posible recuperar los registros del backend.',
        });
      }
    }
  }, []);

  // Efecto inicial: verificación de salud y carga de datos automática
  useEffect(() => {
    handleCheckHealth();
    loadItems();
  }, [handleCheckHealth, loadItems]);

  /**
   * 3. Crear Libro (POST /api/v1/items)
   */
  const handleCreateItem = async (payload) => {
    setIsSubmitting(true);
    const res = await apiClient.createItem(payload);
    setIsSubmitting(false);

    updateInspectorData(res, res.data?.architecture_trace || [
      '1. [Client Presentation] Formulario emitió POST /api/v1/items con JSON serializado',
      '2. [Presentation Controller] ItemsController.create() validó esquema de entrada DTO',
      '3. [Business Layer] ItemDomainService inicializó estado en "available" y evaluó stock_alert',
      '4. [Persistence Layer] ItemRepository.save() ejecutó INSERT INTO items (title, author, ...) RETURNING *',
      '5. [Database Engine] PostgreSQL asignó clave primaria y confirmó transacción con éxito',
      '6. [Presentation Controller] HTTP 201 Created emitido hacia el Frontend'
    ]);

    if (res.ok && (res.status === 201 || res.status === 200)) {
      setNotification({
        type: 'status-201',
        status: 201,
        title: '¡Libro Registrado Exitosamente! (HTTP 201 Created)',
        message: `El libro "${payload.title}" fue persistido en PostgreSQL y enriquecido por la Capa de Negocio.`,
      });
      // Recargar la grilla para sincronizar la BD
      loadItems();
      return true;
    } else {
      setNotification({
        type: res.status === 422 ? 'status-422' : 'error',
        status: res.status,
        title: `Error al Registrar Libro (HTTP ${res.status})`,
        message: res.error || 'El backend rechazó la creación del libro.',
      });
      return false;
    }
  };

  /**
   * 4. Transición de Estado FSM (PATCH /api/v1/items/:id/status)
   */
  const handleUpdateStatus = async (id, newStatus) => {
    setActionLoadingId(id);
    const res = await apiClient.updateItemStatus(id, newStatus);
    setActionLoadingId(null);

    updateInspectorData(res, res.data?.architecture_trace || [
      `1. [Client Presentation] Botón FSM presionado -> PATCH /api/v1/items/${id}/status {"status":"${newStatus}"}`,
      '2. [Presentation Controller] ItemsController.updateStatus() recibió la petición',
      `3. [Business Layer] FSM_Validator.evaluateTransition(current -> ${newStatus})`,
      res.ok
        ? '4. [Persistence Layer] UPDATE items SET status = $1 WHERE id = $2 ejecutado en PostgreSQL'
        : '4. [Business Layer REJECTED] Regla FSM violada -> Lanzó BusinessRuleViolationException (HTTP 422)',
      res.ok
        ? '5. [Presentation Controller] Retorno exitoso de entidad actualizada -> HTTP 200 OK'
        : '5. [Presentation Controller] Manejador de excepciones globales capturó error -> HTTP 422 Unprocessable Entity'
    ]);

    if (res.ok) {
      setNotification({
        type: 'success',
        status: res.status,
        title: 'Estado Actualizado Correctamente (HTTP 200 OK)',
        message: `El estado del libro #${id} ha sido cambiado a "${newStatus}" según las reglas de la Máquina de Estados.`,
      });
      // Actualización optimista o recarga
      loadItems();
    } else {
      // Regla de Negocio FSM Violada (HTTP 422)
      setNotification({
        type: res.status === 422 ? 'status-422' : 'error',
        status: res.status,
        title: res.status === 422
          ? 'Regla de Negocio Violada - Transición FSM Inválida (HTTP 422)'
          : `Error al Actualizar Estado (HTTP ${res.status})`,
        message: res.error || `No se permite la transición hacia "${newStatus}" según la Máquina de Estados Finitos del negocio.`,
      });
    }
  };

  /**
   * 5. Eliminar Libro (DELETE /api/v1/items/:id)
   */
  const handleDeleteItem = async (id, currentStatus) => {
    // Alerta previa informativa
    if (!window.confirm(`¿Desea solicitar la eliminación del libro #${id} al Backend?`)) {
      return;
    }

    setActionLoadingId(id);
    const res = await apiClient.deleteItem(id);
    setActionLoadingId(null);

    updateInspectorData(res, res.data?.architecture_trace || [
      `1. [Client Presentation] Disparo DELETE /api/v1/items/${id}`,
      '2. [Presentation Controller] ItemsController.delete() interceptó solicitud',
      '3. [Business Layer] ComplianceGuard.validateDeletionPolicy(item)',
      res.status === 409
        ? '4. [Compliance Guard TRIGGERED] Ítem archivado protegido por retención legal -> HTTP 409 Conflict'
        : '4. [Persistence Layer] DELETE FROM items WHERE id = $1 ejecutado en PostgreSQL',
      res.ok
        ? '5. [Presentation Controller] Confirmación emitida -> HTTP 200 / 204'
        : '5. [Presentation Controller] Retorno de violación de compliance -> HTTP 409 Conflict'
    ]);

    if (res.ok) {
      setNotification({
        type: 'success',
        status: res.status,
        title: 'Libro Eliminado (HTTP 200 OK)',
        message: `El registro #${id} fue eliminado de PostgreSQL con éxito.`,
      });
      loadItems();
    } else {
      // Alerta especial de Compliance Guard (HTTP 409) o error
      setNotification({
        type: res.status === 409 ? 'status-409' : 'error',
        status: res.status,
        title: res.status === 409
          ? 'Compliance Guard: Eliminación Bloqueada (HTTP 409 Conflict)'
          : `Error al Eliminar Libro (HTTP ${res.status})`,
        message: res.error || (
          currentStatus === 'archived'
            ? 'Regla de Negocio / Auditoría: Los libros en estado ARCHIVADO no pueden ser eliminados de la base de datos para preservar el historial.'
            : `El servidor no pudo procesar la eliminación (HTTP ${res.status}).`
        ),
      });
    }
  };

  return (
    <div className="app-container">
      {/* Encabezado Principal */}
      <header className="app-header">
        <div className="brand-wrapper">
          <div className="brand-icon">
            <Layers size={28} />
          </div>
          <div className="brand-info">
            <h1>Sistema de Biblioteca | Repositorio 2</h1>
            <p>Capa de Presentación Cliente (SPA en React 18 + Vite) — Cap. 10 "Layered Architecture"</p>
          </div>
        </div>

        <div className="header-badges">
          <span className="architecture-tag">
            <Info size={13} />
            <span>Pure REST / JSON</span>
          </span>
          <span className="architecture-tag">
            <Database size={13} />
            <span>Zero Direct DB Access</span>
          </span>
          <span className="badge badge-category">
            React + Vite SPA
          </span>
        </div>
      </header>

      {/* Banner de Conexión End-to-End */}
      <HealthBanner
        healthData={healthData}
        isHealthy={isHealthy}
        loading={checkingHealth}
        onRefresh={handleCheckHealth}
      />

      {/* Banner de Notificaciones / Alertas de Negocio (201, 422, 409, etc.) */}
      {notification && (
        <div className={`alert-toast ${notification.type}`}>
          <div style={{ flexShrink: 0, marginTop: '2px' }}>
            {notification.status === 201 || notification.type === 'success' ? (
              <CheckCircle2 size={20} color="#10b981" />
            ) : notification.status === 422 ? (
              <AlertTriangle size={20} color="#f59e0b" />
            ) : notification.status === 409 ? (
              <AlertOctagon size={20} color="#f43f5e" />
            ) : (
              <AlertTriangle size={20} color="#ef4444" />
            )}
          </div>

          <div className="alert-content">
            <div className="alert-title">
              <span>{notification.title}</span>
            </div>
            <div className="alert-message">{notification.message}</div>
          </div>

          <button
            type="button"
            className="alert-close-btn"
            onClick={() => setNotification(null)}
            title="Cerrar notificación"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Métricas Globales de Negocio */}
      <MetricsOverview items={items} />

      {/* Layout Principal: Formulario + Grilla */}
      <main className="main-content-layout">
        {/* Formulario para POST /items */}
        <section>
          <CreateItemForm
            onSubmit={handleCreateItem}
            isSubmitting={isSubmitting}
          />
        </section>

        {/* Grilla y Controles FSM / Delete */}
        <section>
          <ItemsGrid
            items={items}
            loading={loadingItems}
            onUpdateStatus={handleUpdateStatus}
            onDeleteItem={handleDeleteItem}
            actionLoadingId={actionLoadingId}
          />
        </section>
      </main>

      {/* Inspector de Arquitectura con 3 Pestañas */}
      <section>
        <ArchitectureInspector
          lastTrace={lastTrace}
          lastRawResponse={lastRawResponse}
          lastEndpoint={lastEndpoint}
          lastStatus={lastStatus}
        />
      </section>

      {/* Pie de Página con Referencias Arquitectónicas */}
      <footer className="app-footer">
        <p>
          <strong>Arquitectura por Capas (Layered Architecture Style)</strong> — Implementación práctica basada en el Capítulo 10 de <em>"Fundamentals of Software Architecture"</em> (Mark Richards & Neal Ford).
        </p>
        <p>
          Regla de Aislamiento: La Capa de Presentación Cliente consume exclusivamente contratos <code>application/json</code> a través de la Capa de Servicios Backend.
        </p>
      </footer>
    </div>
  );
}

export default App;

