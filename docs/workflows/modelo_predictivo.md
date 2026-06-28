# Modelo Predictivo y Workflow de Predicción — FrontierAdvice

Este documento detalla el funcionamiento del motor de predicción de estados de pasos fronterizos de FrontierAdvice. El sistema se apoya en un flujo automatizado en n8n y un modelo matemático híbrido implementado en JavaScript (`predicv6_historico.js`).

## 1. Arquitectura del Workflow (n8n)

El archivo `Prediccion-Pasos-Fronterizos.json` define el flujo de automatización (Workflow) encargado de ejecutar las predicciones periódicamente.

### Flujo de Ejecución:
1. **Obtención de Pasos Activos:** El nodo inicial consulta a Strapi (`GET /api/paso-fronterizos`) para obtener la lista de todos los complejos fronterizos activos.
2. **Preparación y Bucle:** Los datos se estructuran y entran a un nodo `Split In Batches` (Loop) que procesa cada paso fronterizo individualmente.
3. **Recolección de Datos (Contexto):** Para cada paso, el workflow realiza llamadas paralelas a distintas fuentes para construir el contexto:
   - **Clima Actual y Pronóstico:** Obtiene el estado meteorológico actual y el pronóstico a 3 días.
   - **Estados Recientes:** Obtiene el registro de los últimos reportes diarios del paso para evaluar su tendencia operativa.
   - **Alertas Vigentes:** Consulta si existen incidentes o alertas reportadas activas en ese momento.
   - **Clima Histórico (Open-Meteo Archive API):** Extrae el clima de los últimos años para esa misma fecha del calendario, permitiendo establecer una "línea base" estacional.
4. **Motor de Predicción (Code Node):** Todos los datos convergen en un nodo de código que ejecuta la lógica de `predicv6_historico.js`. Este script calcula la probabilidad de cierre para horizontes de 24, 48 y 72 horas.
5. **Guardado en Base de Datos:** Finalmente, los resultados generados por el modelo se envían a Strapi, creando nuevos registros en la colección `senal-predictivas` que luego son consumidos por el frontend.

---

## 2. Lógica del Modelo Predictivo (v6 Híbrido)

El modelo predictivo está programado en `predicv6_historico.js`. Se trata de un modelo **Heurístico-Estadístico (Híbrido)** que combina reglas meteorológicas duras con análisis de anomalías estadísticas basadas en datos históricos.

### Factores de Ponderación (Score Ponderado)

El algoritmo evalúa el riesgo calculando un puntaje base de 0 a 100, dividido en 5 dimensiones ponderadas:

#### A. Score Meteorológico (40% de impacto)
Evalúa las condiciones extremas del clima basándose en umbrales de seguridad:
- **Códigos WMO:** Asigna puntaje negativo a condiciones severas (tormentas, lluvia engelante, nevadas intensas).
- **Viento:** Penaliza rachas de viento en rangos (moderado, fuerte, muy fuerte, y extremo >100km/h).
- **Precipitación:** Evalúa los milímetros de agua/nieve caídos.
- **Frío:** Penaliza temperaturas bajo cero, llegando a riesgo extremo con temperaturas <-10°C.
- *Amplificación de Altitud:* Si el paso está a más de 2500 m.s.n.m, el riesgo meteorológico se multiplica por 1.15.

#### B. Historial Operativo (25% de impacto)
El modelo asume que si un paso cerró recientemente, es altamente probable que vuelva a cerrar o se mantenga inestable.
- Busca cierres en las últimas 24 horas, 3 días y 7 días.
- Detecta si el último estado conocido fue "Cerrado" o "Precaución".

#### C. Anomalía Climática Histórica (20% de impacto)
Es la característica central de la v6. Compara el pronóstico actual con el promedio histórico (últimos años) para los mismos días del mes.
- Utiliza **Desviaciones Estándar (σ / Sigmas)** para encontrar anomalías.
- Si la temperatura es $> 2\sigma$ más fría de lo normal, o si la precipitación es anormalmente alta, suma puntos críticos.
- **Riesgo Estacional:** Calcula el % de días históricos en esa semana del año que presentaron códigos WMO peligrosos.

#### D. Alertas Vigentes (10% de impacto)
Suma riesgo directo si el sistema tiene registradas alertas o incidentes vigentes para ese complejo fronterizo, diferenciando si es una alerta normal o crítica.

#### E. Contexto Geográfico (5% de impacto)
Añade un riesgo base constante dependiendo de la altitud estructural del paso (Media montaña > 1500m, Alta montaña > 2500m, Sobre 3000m).

---

### Transformación de Probabilidad y "Hard Signals"

Una vez obtenido el **Score Ponderado (0-100)**:

1. **Ajuste por Horizonte Temporal:** El score se reduce levemente a medida que la predicción se aleja en el tiempo (el pronóstico a 24h pesa 1.00, a 48h pesa 0.85, a 72h pesa 0.72) debido a la incertidumbre meteorológica.
2. **Función Sigmoide:** El score se pasa por una función sigmoide `1 / (1 + exp(-x))` ajustada para generar una curva de probabilidad suave, forzando los valores a estar entre **5% y 95%** (nunca 0 ni 100).
3. **Hard Signals (Señales Críticas):** Ciertas condiciones extremas (Viento > 100km/h, Anomalías climáticas de más de 2 desviaciones estándar, Códigos WMO de tormentas severas, o Alertas críticas) suman *Hard Signals*. 
   - Si el modelo detecta **2 o más Hard Signals**, fuerza el estado a **"Cerrado"** independiente de lo que dicte la función matemática de probabilidad.

### Salida del Modelo

Para cada horizonte temporal (24, 48, 72 horas), el script genera un objeto JSON que contiene:
- `probabilidad`: Porcentaje de riesgo calculado.
- `nivel_riesgo`: Bajo, Medio, Alto.
- `estado_predicho`: Abierto, Precaución, o Cerrado.
- `motivo_resumen`: Los principales factores que gatillaron la predicción (ej: "frío extremo, viento fuerte").
- `confianza`: Alta, Media o Baja, dependiendo de la cantidad de datos históricos e información recolectada para alimentar el cálculo.
- `score_desglose`: Los puntajes en crudo de las 5 métricas para trazabilidad en el panel de administrador.
