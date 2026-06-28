# Workflow de Extracción: Twitter (X) — @UPFronterizos

Este documento detalla el funcionamiento del workflow en n8n encargado de extraer, filtrar y procesar los reportes oficiales publicados en la cuenta de X (Twitter) de la Unidad de Pasos Fronterizos (@UPFronterizos).

## 1. Arquitectura del Workflow (n8n)

El archivo `Twitter EX.json` define un flujo automatizado programado (polling) que interactúa con la API oficial de X y utiliza IA para interpretar el estado de los complejos.

### Flujo de Ejecución:

1. **Schedule Trigger (Disparador Programado):**
   - El workflow se ejecuta automáticamente cada **4 horas**.

2. **Set Config:**
   - Define las variables de entorno para el flujo: el `user_id` de @UPFronterizos (250110721), la cantidad máxima de tweets a traer (20), y los identificadores de la fuente para trazabilidad en Strapi.

3. **Obtener Tweets X (HTTP Request):**
   - Realiza una llamada a la API oficial de Twitter (`api.twitter.com/2/users/{id}/tweets`) usando un Bearer Token.
   - Excluye retweets y respuestas (`exclude=retweets,replies`) para traer únicamente anuncios oficiales originales.

4. **Filtro de Relevancia (Code Node):**
   - Recibe la lista de tweets y aplica un filtro inicial basado en palabras clave (keywords) geográficas y operativas (ej: "complejo", "cerrado", "habilitado", "nieve", nombres de pasos como "los libertadores", "pehuenche", etc.).
   - Si no hay tweets relevantes, el flujo se detiene (Log Sin Relevantes).
   - Los tweets que pasan el filtro son transformados en una lista de objetos estandarizados.

5. **Split In Batches (Loop):**
   - Itera uno a uno sobre los tweets relevantes.

6. **Verificación de Duplicados en Strapi:**
   - Para cada tweet, consulta a Strapi (`/api/tweet-xes`) buscando si el `tweet_id` ya fue procesado anteriormente.
   - Si el tweet ya existe en la base de datos, lo ignora para evitar registros duplicados.

7. **Extracción y Clasificación:**
   - (A través de un nodo de IA/OpenAI en el flujo completo), el texto del tweet nuevo se analiza para determinar:
     - De qué paso fronterizo está hablando.
     - Cuál es el nuevo estado operativo (Abierto, Cerrado, Precaución).
     - Motivo del estado o contexto meteorológico.

8. **Inserción en Base de Datos:**
   - **Guarda el Tweet:** Registra el texto original y la URL del tweet en la colección correspondiente en Strapi.
   - **Guarda el Estado Diario:** Registra la actualización de estado del complejo fronterizo en la colección `estado-diarios`, marcando como fuente "Twitter".

---

## 2. Puntos Clave de la Implementación

- **Eficiencia y Costos:** Al aplicar un filtro de expresiones regulares (Regex) de palabras clave *antes* de enviar los textos a OpenAI o la base de datos, el sistema ahorra recursos significativos descartando publicidad o anuncios no relacionados.
- **Idempotencia:** La validación contra la base de datos (`tweet_id`) asegura que el sistema nunca registre el mismo reporte operativo dos veces, manteniendo la integridad del historial.
