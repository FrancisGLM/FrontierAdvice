// ============================================================
// PARSER WAHA -> STRAPI (FrontierAdvice)
// Convierte los mensajes del canal UPF a estados estructurados
// ============================================================

const rawMessage = $("Webhook WAHA").item.json.payload?.body || "";
const pasosDB = $("GET Pasos DB").item.json.data || [];

if (!rawMessage) return [];

const lines = rawMessage.split('\n');
const results = [];

// Función para limpiar texto y facilitar comparación
function normalizeStr(s) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, '');
}

for (const line of lines) {
  if (!line.includes('🔹')) continue;
  
  // Limpiar el prefijo
  let cleanLine = line.replace('🔹', '').trim();
  
  // Extraer el nombre (todo antes del primer emoji o estado)
  const match = cleanLine.match(/^(.*?)(?:✅|⚠️|⛔️|⛔|⚠|\sHABILITADO|\sNO HABILITADO|\sCERRADO)/i);
  if (!match) continue;
  
  let rawName = match[1]
    .replace(/Complejo/ig, '')
    .replace(/Fronterizo/ig, '')
    .replace(/Integrado/ig, '')
    .trim();
    
  let rawState = "desconocido";
  let normState = "desconocido";
  
  if (cleanLine.match(/NO HABILITADO|CERRADO/i)) {
    rawState = cleanLine.match(/NO HABILITADO|CERRADO/i)[0].toUpperCase();
    normState = "cerrado";
  } else if (cleanLine.match(/HABILITADO/i)) {
    rawState = "HABILITADO";
    normState = "abierto";
  }
  
  // El resto de la línea son los detalles
  let details = cleanLine.substring(match[1].length).replace(/(✅|⚠️|⛔️|⛔|⚠)/g, '').trim();
  if (details.toUpperCase().startsWith(rawState)) {
    details = details.substring(rawState.length).trim();
  }
  details = details.replace(/^[-\|\.,\s]+/, ''); // Limpiar puntuación inicial
  
  // Buscar a qué paso de la base de datos corresponde (Fuzzy match simple)
  let pasoEncontrado = null;
  const searchName = normalizeStr(rawName);
  
  for (const p of pasosDB) {
    const dbName = normalizeStr(p.nombre_oficial);
    // Si el nombre de la DB contiene el nombre del WhatsApp o viceversa
    if (dbName.includes(searchName) || searchName.includes(dbName)) {
      pasoEncontrado = p;
      break;
    }
  }

  // Si encontramos correspondencia, lo agregamos a la lista
  if (pasoEncontrado) {
    results.push({
      json: {
        documentId: pasoEncontrado.documentId,
        nombre_oficial: pasoEncontrado.nombre_oficial,
        nombre_waha: rawName,
        estado_general: normState,
        estado_raw: rawState,
        mensaje_original: line.trim(),
        detalles: details || rawState,
        timestamp: $("Webhook WAHA").item.json.payload?.timestamp || Math.floor(Date.now() / 1000)
      }
    });
  }
}

return results;
