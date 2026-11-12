/**
 * ============================================================================
 * Capa de Presentación Cliente - Cliente HTTP REST (apiClient.js)
 * Sistema de Biblioteca | Arquitectura por Capas (Capítulo 10)
 * ============================================================================
 * 
 * REGLA ARQUITECTÓNICA ESTRICTA:
 * El Frontend tiene PROHIBIDO conectarse directamente a la base de datos (PostgreSQL).
 * Toda interacción atraviesa obligatoriamente la Capa de Servicios Backend vía HTTP REST,
 * enviando y recibiendo exclusivamente 'application/json'.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

/**
 * Función genérica para ejecutar peticiones HTTP con tipado y cabeceras estrictas JSON.
 * Devuelve siempre { ok, status, data, error, rawText, timestamp } para alimentar
 * el Inspector de Arquitectura y las alertas del Frontend.
 * 
 * @param {string} endpoint - Ruta relativa al BASE_URL (ej. '/items')
 * @param {RequestInit} options - Opciones de fetch (method, body, etc.)
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const timestamp = new Date().toISOString();

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  try {
    const response = await fetch(url, config);
    const rawText = await response.text();
    let data = null;

    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch {
      data = { raw: rawText };
    }

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data,
      rawText,
      timestamp,
      error: response.ok ? null : (data?.message || data?.error || `HTTP Error ${response.status}`),
      endpoint,
      method: config.method || 'GET',
    };
  } catch (err) {
    // Error de red (Backend caído, CORS, firewall, etc.)
    return {
      ok: false,
      status: 0,
      statusText: 'Network Error',
      data: null,
      rawText: err.message,
      timestamp,
      error: `Error de Conexión: Backend inalcanzable en ${BASE_URL} (${err.message})`,
      endpoint,
      method: config.method || 'GET',
      isNetworkError: true,
    };
  }
}

/**
 * Servicio de API que expone los 5 endpoints requeridos por el Backend.
 */
export const apiClient = {
  /**
   * 1. GET /api/v1/health
   * Verifica el estado de salud E2E (Frontend -> Backend -> PostgreSQL).
   */
  async checkHealth() {
    return await request('/health', {
      method: 'GET',
    });
  },

  /**
   * 2. GET /api/v1/items
   * Obtiene la lista completa de libros con campos persistidos y calculados por el Negocio.
   */
  async fetchItems() {
    return await request('/items', {
      method: 'GET',
    });
  },

  /**
   * 3. POST /api/v1/items
   * Crea un nuevo libro en el catálogo de la biblioteca.
   * @param {{ title: string, author: string, category: string, stock: number }} payload
   */
  async createItem(payload) {
    return await request('/items', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * 4. PATCH /api/v1/items/:id/status
   * Modifica el estado del libro según la Máquina de Estados Finitos (FSM).
   * @param {string|number} id - Identificador del libro
   * @param {'available'|'reserved'|'maintenance'|'archived'} status - Nuevo estado
   */
  async updateItemStatus(id, status) {
    return await request(`/items/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  /**
   * 5. DELETE /api/v1/items/:id
   * Elimina un libro del catálogo si pasa las reglas de negocio (Compliance Guard).
   * @param {string|number} id - Identificador del libro
   */
  async deleteItem(id) {
    return await request(`/items/${id}`, {
      method: 'DELETE',
    });
  },
};

export default apiClient;

