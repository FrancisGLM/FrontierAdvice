const fs = require("fs");

// 1. Leer el archivo de texto de WhatsApp
console.log("⏳ Leyendo el archivo canalUPFmensajes.txt...");
const rawText = fs.readFileSync("canalUPFmensajes.txt", "utf8");

// 2. Palabras clave
const KEYWORDS = [
  "complejo",
  "fronterizo",
  "frontera",
  "habilitado",
  "cerrado",
  "abierto",
  "suspendido",
  "precaución",
  "precaucion",
  "habilitada",
  "cerrada",
  "horario",
  "ingreso",
  "salida",
  "vehículo",
  "vehiculo",
  "paso",
  "hrs",
  "hora",
  "a.m.",
  "p.m.",
  "nevada",
  "nieve",
  "tormenta",
  "temporal",
  "viento",
  "lluvia",
  "congelamiento",
  "deslizamiento",
  "alud",
  "ruta",
  "los libertadores",
  "cardenal",
  "pehuenche",
  "pircas negras",
  "jama",
  "colchane",
  "agua negra",
  "vergara",
  "pichachén",
  "pichachen",
  "hua hum",
  "samoré",
  "samore",
  "san francisco",
  "dorotea",
  "casas viejas",
  "san sebastián",
  "san sebastian",
  "bellavista",
  "integración austral",
  "don guillermo",
  "pino hachado",
  "chungará",
  "chungara",
  "chacalluta",
  "ollague",
  "collahuasi",
  "portillo",
  "río blanco",
  "atacama",
  "coquimbo",
  "valparaíso",
  "valparaiso",
  "maule",
  "biobío",
  "biobio",
  "araucanía",
  "araucania",
  "aysén",
  "aysen",
  "magallanes",
  "antofagasta",
  "tarapacá",
  "tarapaca",
];

function hasKeyword(text) {
  const lower = text.toLowerCase();
  return KEYWORDS.some((kw) => lower.includes(kw));
}

// 3. Extraer y estructurar los datos
const regex = /\[(.*?)\] (.*?): ([\s\S]*?)(?=\n\[|$)/g;
let match;
let msgs = [];
let counter = 1;

while ((match = regex.exec(rawText)) !== null) {
  const timeStr = match[1];
  const body = match[3].trim();

  if (body.length > 10 && hasKeyword(body)) {
    const dateMatch = timeStr.match(
      /(\d{1,2}):(\d{2}), (\d{1,2})\/(\d{1,2})\/(\d{4})/,
    );
    let isoDate = new Date().toISOString();
    let timestamp = Math.floor(Date.now() / 1000);

    if (dateMatch) {
      const hour = dateMatch[1].padStart(2, "0");
      const minute = dateMatch[2].padStart(2, "0");
      const day = dateMatch[3].padStart(2, "0");
      const month = dateMatch[4].padStart(2, "0");
      const year = dateMatch[5];

      isoDate = `${year}-${month}-${day}T${hour}:${minute}:00.000-04:00`;
      timestamp = Math.floor(new Date(isoDate).getTime() / 1000);
    }

    msgs.push({
      msg_id: `manual_${timestamp}_${counter}`,
      msg_body: body,
      msg_timestamp: timestamp,
      msg_fecha_iso: isoDate,
      msg_row_id: null,
      msg_server_id: null,
      source_id: "whatsapp_upf_manual",
      source_name: "Canal WhatsApp UPF (Manual)",
      captured_at: new Date().toISOString(),
      strapi_url: "http://strapi:1337",
      gemini_delay: 3000,
    });
    counter++;
  }
}

// Invertimos para procesar del más antiguo al más reciente
msgs.reverse();

// 4. Guardar el JSON limpio
const outputObj = { data: msgs };
fs.writeFileSync(
  "mensajes_limpios.json",
  JSON.stringify(outputObj, null, 2),
  "utf8",
);

console.log(`✅ ¡Éxito! Se filtraron y transformaron ${msgs.length} mensajes.`);
console.log(`✅ Archivo 'mensajes_limpios.json' creado y listo para n8n.`);
