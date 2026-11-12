# 📚 Sistema de Biblioteca — Capa de Presentación Cliente (SPA React + Vite)

> **Repositorio 2:** Frontend Single Page Application (SPA) desarrollado en **React 18** y potenciado por **Vite**, diseñado bajo los principios de **Arquitectura por Capas (Layered Architecture Style)** documentados en el **Capítulo 10** del libro *"Fundamentals of Software Architecture"* (Mark Richards & Neal Ford).

---

## 🏛️ 1. Fundamentos Arquitectónicos (Capítulo 10)

En la Arquitectura por Capas clásica, los componentes se organizan en capas horizontales, donde cada una desempeña un rol técnico específico.

```
+-------------------------------------------------------------------------+
|  1. CAPA DE PRESENTACIÓN CLIENTE (Este Repositorio: React SPA + Vite)   |
|     - Interfaz de Usuario Reactiva                                      |
|     - Inspector de Arquitectura & Handshake E2E                         |
|     - Transmisión exclusiva: HTTP REST (application/json)               |
+-------------------------------------------------------------------------+
                                    │  HTTP / JSON
                                    ▼
+-------------------------------------------------------------------------+
|  2. CAPA DE PRESENTACIÓN SERVIDOR (Backend Controllers / Routers)        |
|     - Endpoint Gateway (Puerto 4000)                                    |
|     - Validación sintáctica y deserialización DTO                       |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|  3. CAPA DE NEGOCIO (Domain & Business Services)                        |
|     - Máquina de Estados Finitos (FSM) -> HTTP 422 si es inválida       |
|     - Compliance Guard -> HTTP 409 si se intenta borrar un 'archived'   |
|     - Enriquecimiento: stock_alert y loan_policy                        |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|  4. CAPA DE PERSISTENCIA (Data Access Objects / Repositories)           |
|     - Consultas SQL parametrizadas                                      |
|     - Mapeo relacional de tuplas a modelos de dominio                   |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|  5. CAPA DE BASE DE DATOS (PostgreSQL 16)                               |
|     - Motor relacional ACID (Puerto 5432)                               |
+-------------------------------------------------------------------------+
```

### 🚫 Regla de Aislamiento Estricta (Layers of Isolation)
* **Prohibición Directa:** La Capa de Presentación Cliente tiene **terminantemente prohibido** conectarse de forma directa al motor PostgreSQL.
* **Contrato Puro:** Toda la comunicación fluye a través de la Capa de Servicios Backend vía HTTP utilizando exclusivamente cabeceras `Content-Type: application/json` y `Accept: application/json`.
* **Zero HTML en el Servidor:** La API transmite JSON puro, garantizando el desacoplamiento total entre la lógica de interfaz de usuario y la lógica de negocio.

---

## 🚀 2. Requisitos Previos

* **Node.js:** Versión 18 o superior (probado en Node v20 / v22 / v26).
* **NPM:** Versión 9 o superior.
* **Docker & Docker Compose:** (Opcional, para ejecución contenerizada).

---

## 🛠️ 3. Ejecución Local (Desarrollo)

### Paso 1: Instalar dependencias
```bash
npm install
```

### Paso 2: Configurar variables de entorno
El archivo `.env` ya viene preconfigurado para apuntar al backend local:
```env
VITE_API_URL=http://localhost:4000/api/v1
```

### Paso 3: Iniciar servidor de desarrollo
```bash
npm run dev
```
La aplicación estará disponible inmediatamente en: **`http://localhost:5173`**

### Paso 4: Construir para producción (Build estático)
```bash
npm run build
npm run preview
```

---

## 🐳 4. Ejecución con Docker

### Modo Desarrollo (Hot-Reload activo en contenedor):
```bash
docker compose -f docker-compose.dev.yml up --build
```
* Acceso: **`http://localhost:5173`**
* Los cambios en el código fuente local se reflejan instantáneamente en el contenedor mediante volúmenes montados.

### Modo Producción (Multi-Stage Build + Nginx Alpine):
```bash
docker compose -f docker-compose.prod.yml up --build -d
```
* Acceso: **`http://localhost:8080`**
* Utiliza una compilación en dos etapas con `nginx:stable-alpine`, optimizada con compresión gzip y enrutamiento SPA (`try_files $uri $uri/ /index.html`).

---

## 🔌 5. Contrato de Integración REST (5 Endpoints)

El servicio `src/services/apiClient.js` encapsula las peticiones hacia el Backend:

| Método | Endpoint | Descripción | Códigos HTTP Manejados |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Handshake de salud E2E (Frontend ↔ Backend ↔ DB) | `200 OK`, `503 Service Unavailable` |
| `GET` | `/items` | Obtiene el catálogo enriquecido por la Capa de Negocio | `200 OK`, `500 Internal Error` |
| `POST` | `/items` | Registra un nuevo libro en la base de datos | `201 Created`, `400 Bad Request`, `422 Unprocessable` |
| `PATCH` | `/items/:id/status` | Transiciona el estado del libro según la FSM | `200 OK`, `422 Unprocessable Entity` (FSM Violada) |
| `DELETE` | `/items/:id` | Elimina un registro si cumple las reglas de auditoría | `200 OK`, `409 Conflict` (Compliance Guard) |

---

## 🧠 6. Reglas de Negocio Implementadas en la UI

### A. Máquina de Estados Finitos (FSM) — HTTP 422
Cada libro posee un ciclo de vida controlado:
* `available` (Disponible)
* `reserved` (Reservado)
* `maintenance` (En Mantenimiento)
* `archived` (Archivado)

Si el usuario solicita un cambio de estado no admitido por el modelo de dominio (por ejemplo, transicionar de `archived` directamente a `reserved`), el Backend responde con **`HTTP 422 Unprocessable Entity`**. La interfaz captura el error y despliega una alerta visual ambarina destacando la violación de la regla FSM.

### B. Compliance Guard — HTTP 409
Por políticas de retención legal y auditoría, **ningún libro en estado `archived` puede ser eliminado físicamente**. Si se intenta invocar `DELETE /items/:id` sobre un registro archivado, el Backend responde con **`HTTP 409 Conflict`**. La UI presenta un banner de advertencia crítico con el mensaje exacto devuelto por el servidor.

### C. Campos Dinámicos Calculados por la Capa de Negocio
* **`stock_alert`:** La Capa de Negocio evalúa el stock y retorna indicadores como `CRITICAL_LOW`, `LOW_STOCK` o `NORMAL` sin requerir que la base de datos almacene redundancias.
* **`loan_policy`:** Determina la política de préstamo aplicable (ej. `STANDARD_14_DAYS`, `RESTRICTED_REFERENCE`, `7_DAYS_RENEWABLE`).

---

## 🔍 7. Inspector de Arquitectura (Panel de Sustentación)

Ubicado al pie de la aplicación, este componente interactivo ofrece tres herramientas para la defensa técnica:

1. **Pestaña 1 ("Flujo de Capas E2E"):** Diagrama visual detallado paso a paso del viaje de una petición: `React UI -> HTTP JSON -> Controller -> Service -> Repository -> PostgreSQL 16`.
2. **Pestaña 2 ("architecture_trace"):** Lista cronológica del arreglo `architecture_trace` devuelto por el backend, demostrando qué capa procesó qué tarea y en qué orden.
3. **Pestaña 3 ("Raw JSON Payload"):** Visor de código en tiempo real con la respuesta cruda en JSON recibida, certificando que no existe acoplamiento de plantillas HTML en el servidor.

---

## 📂 8. Estructura de Archivos del Proyecto

```
library-Frontend/
├── .env                         # Variables de entorno activas (VITE_API_URL)
├── .env.example                 # Plantilla de variables de entorno
├── .gitignore                   # Exclusiones de control de versiones
├── .dockerignore                # Exclusiones del contexto de construcción Docker
├── package.json                 # Dependencias y scripts de Vite
├── vite.config.js               # Configuración del empaquetador Vite (host: 0.0.0.0)
├── index.html                   # Entry point HTML de la SPA con fuentes tipográficas
├── nginx.conf                   # Servidor web Nginx con soporte SPA y compresión gzip
├── Dockerfile.dev               # Imagen de desarrollo Node 20 con Hot-Reload
├── Dockerfile.prod              # Imagen de producción Multi-Stage (Node -> Nginx)
├── docker-compose.dev.yml       # Orquestador Docker para desarrollo (puerto 5173)
├── docker-compose.prod.yml      # Orquestador Docker para producción (puerto 8080)
├── README.md                    # Manual de arquitectura y despliegue
└── src/
    ├── main.jsx                 # Bootstrap de React 18 en el DOM
    ├── App.jsx                  # Componente raíz orquestador de estado y eventos
    ├── index.css                # Hoja de estilos moderna oscura con CSS variables
    ├── services/
    │   └── apiClient.js         # Cliente HTTP REST centralizado con headers JSON
    └── components/
        ├── HealthBanner.jsx         # Indicador en vivo de conexión E2E y DB
        ├── MetricsOverview.jsx      # Tarjetas de KPIs calculadas sobre el catálogo
        ├── CreateItemForm.jsx       # Formulario con Live JSON Payload Preview
        ├── ItemsGrid.jsx            # Grilla con controles FSM y badges de negocio
        └── ArchitectureInspector.jsx# Panel de 3 pestañas para sustentación
```

