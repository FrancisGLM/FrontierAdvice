# FrontierAdvice Chile

> Plataforma web para monitoreo y consulta del estado de pasos fronterizos chilenos con aduana, con agente IA y cálculo de rutas alternativas.

![Estado](https://img.shields.io/badge/estado-en%20desarrollo-yellow)
![Publico](https://img.shields.io/badge/visibilidad-publico-green)
![Stack](https://img.shields.io/badge/stack-Next.js%20%7C%20Strapi%20%7C%20n8n%20%7C%20Gemini-blue)
![Deploy](https://img.shields.io/badge/deploy-Docker%20Compose-2496ED?logo=docker)

---

## Descripción

FrontierAdvice Chile centraliza y normaliza el estado operativo de los pasos fronterizos chilenos integrando sus fuentes oficiales (WhatsApp y X) en una única interfaz web. El sistema automatiza la captura de datos, clasifica el riesgo de cierre por horizonte temporal mediante modelos predictivos y permite consultas en lenguaje natural con cálculo de rutas alternativas según tipo de vehículo.

**Proyecto de Título — Ingeniería Civil Informática, UCM**

- **FL** Francisco López — Fullstack, ingesta de datos y análisis
- **FI** Franco Ingravallo — Inteligencia y agente orquestador

### Características Principales

- **Extracción Inteligente:** Uso de IA (Gemini) en los flujos de n8n para analizar texto no estructurado desde WhatsApp y X, normalizando automáticamente el estado de los pasos.
- **Predicción de Cierre:** Cálculo de la probabilidad de cierre de un paso (riesgo Alto, Medio o Bajo) en diferentes horizontes de tiempo, considerando factores como el clima histórico y actual (Open-Meteo).
- **Mapas y Rutas:** Visualización interactiva con MapCN y cálculo de rutas alternativas usando OpenRouteService, tomando en cuenta el tipo de vehículo.

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
| Open-Meteo Archive API                        | Datos de clima histórico y actual        |

### Agente Orquestador & Mapas

| Tecnología                          | Rol                                            |
| ----------------------------------- | ---------------------------------------------- |
| Gemini 2.5 Flash (function calling) | Procesamiento de consultas en lenguaje natural |
| OpenRouteService (ORS API)          | Cálculo de rutas y perfiles de vehículo        |
| MapCN (React Map Components)        | Visualización de mapa interactivo con GeoJSON  |

### Frontend

| Tecnología  | Rol                              |
| ----------- | -------------------------------- |
| Next.js 15  | Framework React para el frontend |
| TailwindCSS | Estilos y diseño responsive      |
| next-pwa    | Soporte de Progressive Web App   |

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
├── ClimaActual
├── ReporteIncidente
└── SenalPredictiva
```

| Entidad            | Descripción                                                    |
| ------------------ | -------------------------------------------------------------- |
| `PasoFronterizo`   | Registro base de cada complejo fronterizo activo               |
| `EstadoDiario`     | Estado operativo unificado a partir de las fuentes oficiales   |
| `ClimaActual`      | Condiciones meteorológicas asociadas al paso fronterizo        |
| `ReporteIncidente` | Reportes de usuarios sobre el paso fronterizo                  |
| `SenalPredictiva`  | Clasificación de riesgo Alto/Medio/Bajo por horizonte temporal |
| `MensajeWAHA`      | Registro en crudo extraído desde el canal oficial de WhatsApp  |
| `tweet-x`          | Registro en crudo extraído desde la cuenta oficial de X        |
| `AdminLog`         | Auditoría de operaciones de administrador                      |

---

## Estructura del Proyecto

```text
FrontierAdvice/
├── frontend/                  # Next.js 15 + TailwindCSS [FL]
├── strapi/                    # CMS headless + API REST [FL]
├── n8n/                       # Orquestación, automatizaciones y agentes [FL/FI]
│   └── workflows/             # Diagramas JSON y scripts JS (predicción, scraping)
├── docs/                      # Documentación del proyecto
│   ├── config/
│   ├── frontend/
│   ├── planes_historicos/
│   ├── recursos/
│   ├── strapi/
│   └── workflows/
├── .gitignore
├── docker-compose.yml
└── README.md
```

---

## Instalación

### Prerrequisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo
- [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) instalado en el sistema
- API Keys: Gemini 2.5 Flash, OpenRouteService

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

> El acceso remoto requiere que el tunnel de Cloudflare esté activo. (Ver documentación respectiva).

### Comandos útiles

```bash
docker compose logs -f          # logs de todos los servicios
docker compose logs -f strapi   # logs de un servicio específico
docker compose down             # detener el stack
docker compose up -d --build    # rebuild y levantar
```

---

## Workflows de n8n

Los workflows y algoritmos se versionan en `n8n/workflows/`. Para importarlos:

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
| @UPFronterizos              | Lenguaje natural      | X (Twitter) |

---

## Licencia

Proyecto académico privado — Universidad Católica del Maule, 2026.
