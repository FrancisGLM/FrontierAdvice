# FrontierAdvice Chile

> Plataforma web para monitoreo y consulta del estado de pasos fronterizos chilenos con aduana, con agente IA y cálculo de rutas alternativas.

![Estado](https://img.shields.io/badge/estado-en%20desarrollo-yellow)
![Publico](https://img.shields.io/badge/visibilidad-publico-green)
![Stack](https://img.shields.io/badge/stack-Next.js%20%7C%20Strapi%20%7C%20n8n%20%7C%20Gemini-blue)
![Deploy](https://img.shields.io/badge/deploy-Docker%20Compose-2496ED?logo=docker)

---

## Descripción

FrontierAdvice Chile centraliza y normaliza el estado operativo de los pasos fronterizos chilenos integrando cuatro fuentes oficiales dispersas en una única interfaz web. El sistema automatiza la captura de datos cada dos horas, clasifica el riesgo de cierre por horizonte temporal y permite consultas en lenguaje natural con cálculo de rutas alternativas según tipo de vehículo.

**Proyecto de Título — Ingeniería Civil Informática, UCM**

- **FL** Francisco López — Fullstack, ingesta de datos y análisis
- **FI** Franco Ingravallo — Inteligencia y agente orquestador

---

## Decisiones de Arquitectura

El stack completo se gestiona mediante **Docker Compose**, ejecutándose de forma local y unificada. Esta decisión reemplaza el enfoque inicial basado en servicios cloud separados en favor de un entorno reproducible, portable y sin dependencias externas durante el desarrollo.

**Beneficios principales:**

- Un solo comando (`docker compose up -d`) levanta todo el stack
- Entorno idéntico entre ambos desarrolladores, sin configuración manual
- Red Docker interna compartida entre servicios
- Persistencia de datos mediante volúmenes Docker

---

## Stack Tecnológico

### Backend e Ingesta

| Tecnología                                    | Rol                                      |
| --------------------------------------------- | ---------------------------------------- |
| [Strapi](https://strapi.io) 5 + PostgreSQL 16 | CMS headless, modelo de datos y API REST |
| [n8n](https://n8n.io)                         | Orquestación del agente de scraping      |
| Gemini 2.5 Flash                              | Extracción, normalización y análisis IA  |
| Playwright MCP                                | Scraping de fuentes web dinámicas        |

### Agente Orquestador

| Tecnología                          | Rol                                            |
| ----------------------------------- | ---------------------------------------------- |
| Gemini 2.5 Flash (function calling) | Procesamiento de consultas en lenguaje natural |
| Google Maps Routes API              | Cálculo de rutas y waypoints                   |
| Google Maps JavaScript SDK          | Visualización de mapa con polilínea            |

### Frontend

| Tecnología  | Rol                              |
| ----------- | -------------------------------- |
| Next.js 15  | Framework React para el frontend |
| TailwindCSS | Estilos y diseño responsive      |

### Infraestructura

| Servicio   | Puerto | Descripción                        |
| ---------- | ------ | ---------------------------------- |
| Strapi     | `1337` | API REST y panel de administración |
| PostgreSQL | `5432` | Base de datos relacional de Strapi |
| n8n        | `5678` | Orquestación de workflows y agente |
| Next.js    | `3000` | Frontend de la plataforma          |

---

## Modelo de Datos

```text
PasoFronterizo
├── EstadoDiario
│   └── Restriccion
├── AlertaEvento
└── SenalPredictiva
```

| Entidad           | Descripción                                                    |
| ----------------- | -------------------------------------------------------------- |
| `PasoFronterizo`  | Registro base de cada complejo fronterizo activo               |
| `EstadoDiario`    | Estado operativo capturado por el scraper cada 2 horas         |
| `Restriccion`     | Restricciones activas asociadas a un estado diario             |
| `AlertaEvento`    | Eventos o alertas especiales por paso                          |
| `SenalPredictiva` | Clasificación de riesgo Alto/Medio/Bajo por horizonte temporal |

---

## Estructura del Proyecto

```text
FrontierAdvice/
├── frontend/                  # Next.js 15 + TailwindCSS [FL]
├── strapi/                    # CMS headless + API REST [FL]
├── n8n/                       # Orquestación y agente de scraping [FL/FI]
│   └── workflows/
├── docs/
│   ├── contrato-api.md
│   ├── modelo-datos.md
│   └── manual-despliegue.md
├── .gitignore
├── docker-compose.yml
└── README.md
```

---

## Instalación

### Prerrequisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo
- [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) instalado en el sistema
- API Keys: Gemini 2.5 Flash, Google Maps

### 1. Clonar el repositorio

```bash
git clone https://github.com/FrancisGLM/FrontierAdvice.git
cd FrontierAdvice
```

### 2. Configurar variables de entorno

Cada servicio incluye un archivo `.env.example`. Copia y completa cada uno:

```bash
cp strapi/.env.example strapi/.env
cp n8n/.env.example n8n/.env
cp frontend/.env.example frontend/.env.local
```

### 3. Levantar el stack

```bash
docker compose up -d --build
```

### 4. Acceder a los servicios

| Servicio     | Local                       | Remoto                                   |
| ------------ | --------------------------- | ---------------------------------------- |
| Frontend     | http://localhost:3000       | https://frontieradvice.tech              |
| Strapi Admin | http://localhost:1337/admin | https://strapi.frontieradvice.tech/admin |
| n8n          | http://localhost:5678       | https://n8n.frontieradvice.tech          |

> El acceso remoto requiere que el tunnel de Cloudflare esté activo. Ver `docs/manual-despliegue.md`.

### Comandos útiles

```bash
docker compose logs -f          # logs de todos los servicios
docker compose logs -f strapi   # logs de un servicio específico
docker compose down             # detener el stack
docker compose up -d --build    # rebuild y levantar
```

---

## Workflows de n8n

Los workflows se versionan como JSON en `n8n/workflows/`. Para importarlos:

1. Abrir n8n → **Workflows → Import from file**
2. Seleccionar los archivos `.json` desde `n8n/workflows/`

---

## Métricas Objetivo

| Métrica                                    | Valor objetivo |
| ------------------------------------------ | -------------- |
| Tasa de ejecución exitosa del scheduler    | ≥ 90%          |
| Precisión de extracción de estado por paso | ≥ 85%          |
| Latencia de respuesta del agente           | ≤ 20 s         |

---

## Fuentes de Datos Integradas

| Fuente                      | Formato               | Canal       |
| --------------------------- | --------------------- | ----------- |
| UPF Ministerio del Interior | Texto no estructurado | WhatsApp    |
| pasosfronterizos.gov.cl     | HTML                  | Web         |
| @UPFronterizos              | Lenguaje natural      | X (Twitter) |

---

## Licencia

Proyecto académico privado — Universidad Católica del Maule, 2026.  
Todos los derechos reservados.
