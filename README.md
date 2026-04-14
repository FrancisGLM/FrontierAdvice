# FrontierAdvice Chile

> Plataforma web para monitoreo y consulta del estado de pasos fronterizos chilenos con aduana, con agente IA y cálculo de rutas alternativas.

![Estado](https://img.shields.io/badge/estado-en%20desarrollo-yellow)
![Privado](https://img.shields.io/badge/visibilidad-privado-red)
![Stack](https://img.shields.io/badge/stack-Next.js%20%7C%20Strapi%20%7C%20n8n%20%7C%20Gemini-blue)

---

## Descripción

FrontierAdvice Chile centraliza y normaliza el estado operativo de los pasos fronterizos chilenos integrando cuatro fuentes oficiales dispersas en una única interfaz web. El sistema automatiza la captura de datos cada dos horas, clasifica el riesgo de cierre por horizonte temporal y permite consultas en lenguaje natural con cálculo de rutas alternativas según tipo de vehículo.

**Proyecto de Título — Ingeniería Civil Informática, UCM**
- **FL** Francisco López — Fullstack, ingesta de datos y análisis
- **FI** Franco Ingravallo — Inteligencia y agente orquestador

---

## Stack Tecnológico

### Backend e Ingesta
| Tecnología | Rol |
|---|---|
| [Strapi](https://strapi.io) + PostgreSQL | CMS headless, modelo de datos y API REST |
| [n8n](https://n8n.io) | Orquestación del agente de scraping |
| Gemini 2.5 Flash | Extracción, normalización y análisis IA |
| Playwright MCP | Scraping de fuentes web dinámicas |

### Agente Orquestador
| Tecnología | Rol |
|---|---|
| Gemini 2.5 Flash (function calling) | Procesamiento de consultas en lenguaje natural |
| Google Maps Routes API | Cálculo de rutas y waypoints |
| Google Maps JavaScript SDK | Visualización de mapa con polilínea |

### Frontend
| Tecnología | Rol |
|---|---|
| Next.js 14 | Framework React para el frontend |
| TailwindCSS | Estilos y diseño responsive |

### Infraestructura
| Servicio | Uso |
|---|---|
| Strapi Cloud (free tier) | Hosting del backend |
| Vercel (free tier) | Hosting del frontend |
| n8n Cloud (free tier) | Ejecución de workflows |

---

## Modelo de Datos

```
PasoFronterizo
├── EstadoDiario
├── Restriccion
├── AlertaEvento
└── SenalPredictiva
```

---

## Estructura del Proyecto

```
FrontierAdvice/
├── frontend/                  # Next.js + TailwindCSS [FL]
│   ├── app/
│   │   ├── page.tsx           # Vista principal de pasos
│   │   ├── historial/         # Vista de historial
│   │   ├── riesgo/            # Indicador de riesgo
│   │   └── mapa/              # Módulo de mapa interactivo
│   ├── components/
│   └── lib/
├── scraper/                   # Agente de scraping n8n + Playwright [FL]
│   ├── workflows/             # Workflows exportados de n8n
│   └── prompts/               # System prompts para Gemini
├── agente/                    # Agente orquestador Gemini [FI]
│   ├── functions/             # Function calling definitions
│   └── prompts/               # System prompts del agente
├── docs/                      # Documentación técnica
│   ├── contrato-api.md        # Contrato de interfaz entre áreas
│   ├── modelo-datos.md        # Esquema de entidades
│   └── manual-despliegue.md   # Guía de despliegue
└── README.md
```

---

## Instalación y Configuración

### Prerrequisitos

- Node.js >= 18
- PostgreSQL >= 14
- Cuenta en n8n Cloud (o instancia self-hosted)
- API Keys: Gemini 2.5 Flash, Google Maps

### 1. Clonar el repositorio

```bash
git clone https://github.com/FrancisGLM/FrontierAdvice.git
cd FrontierAdvice
```

### 2. Configurar el Backend (Strapi)

```bash
# Strapi se gestiona via Strapi Cloud
# Importar el schema desde docs/modelo-datos.md
# Configurar variables de entorno:
```

```env
DATABASE_URL=postgresql://user:password@host:5432/frontieradvice
APP_KEYS=your_app_keys
API_TOKEN_SALT=your_salt
ADMIN_JWT_SECRET=your_secret
JWT_SECRET=your_jwt_secret
```

### 3. Configurar el Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
```

```env
NEXT_PUBLIC_STRAPI_URL=https://your-strapi-instance.strapiapp.com
NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_google_maps_key
GEMINI_API_KEY=your_gemini_key
```

```bash
npm run dev
# Disponible en http://localhost:3000
```

### 4. Configurar el Scraper (n8n)

```bash
# Importar los workflows desde scraper/workflows/ en tu instancia n8n
# Configurar credenciales:
#   - Gemini API Key
#   - Strapi API Token
#   - Playwright (via MCP)
# El scheduler ejecuta cada 2 horas automáticamente
```

### 5. Configurar el Agente

```env
GEMINI_API_KEY=your_gemini_key
STRAPI_API_TOKEN=your_strapi_token
GOOGLE_MAPS_API_KEY=your_maps_key
```

---

## Planificación

| Hito | Fecha | Responsable | Descripción |
|---|---|---|---|
| H1: Contrato de interfaz | 26 abr | Ambos | Schema Strapi acordado |
| H2: API REST funcional | 10 may | FL | Endpoints listos para el agente |
| H3: Scraper en producción | 17 may | FL | Datos reales fluyendo a Strapi |
| H4: Agente completo | 24 may | FI | Agente con function calling operativo |
| H5: Integración end-to-end | 7 jun | Ambos | Flujo completo con datos reales |
| H6: Revisión intermedia | 18 jun | Ambos | Frontend completo, revisión tutores |
| H7: MVP en producción | 5 jul | Ambos | Sistema desplegado y listo |
| Fecha límite oficial | 6 jul | — | Entrega final |

---

## Métricas Objetivo

| Métrica | Valor objetivo |
|---|---|
| Uptime del scheduler | ≥ 95% |
| Precisión de extracción | ≥ 98% |
| Latencia de respuesta del agente | ≤ 20 s |

---

## Fuentes de Datos Integradas

| Fuente | Formato | Canal |
|---|---|---|
| UPF Ministerio del Interior | Texto no estructurado | WhatsApp |
| pasosfronterizos.gov.cl | HTML | Web |
| ChileAtiende | Fichas estáticas | Web |
| @UPFronterizos | Lenguaje natural | X (Twitter) |

---

## Licencia

Proyecto académico privado — Universidad Católica del Maule, 2026.
Todos los derechos reservados.
