const fs = require("fs");

// Configuración (Ajusta la URL y tu Token si es necesario)
// Nota: Strapi suele nombrar los endpoints en plural. Asegúrate de que este sea tu endpoint correcto.
const STRAPI_URL = "http://localhost:1337/api/paso-fronterizos";
// Si configuraste permisos privados, pon tu token aquí. Si el endpoint es público para crear, déjalo vacío.
const STRAPI_TOKEN = "";

const CSV_PATH = "./pasos_fronterizos_completo.csv";

async function main() {
  console.log("Iniciando lectura del CSV...");
  const csvData = fs.readFileSync(CSV_PATH, "utf-8");

  // Dividimos por líneas
  const lines = csvData.trim().split("\n");
  const headers = lines[0].split(",");

  let exitos = 0;
  let errores = 0;

  // Saltamos la primera línea (cabeceras)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    try {
      // Esta expresión regular permite hacer split por comas ignorando las comas dentro de las comillas dobles
      const values = line
        .match(/(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|([^,]+))/g)
        .map((v) => v.replace(/^"|"$/g, "").replace(/""/g, '"').trim());

      // Construimos el objeto a insertar en Strapi
      const payload = {
        data: {
          nombre_oficial: values[0],
          region: values[1],
          // Parseamos el JSON que viene en el CSV (ej: ["vehículos menores", "buses"])
          habilitado_para:
            values[2] && values[2] !== "[]" ? JSON.parse(values[2]) : [],
          codigo_fuente: values[3],
          latitud: parseFloat(values[4]),
          longitud: parseFloat(values[5]),
          // Convertimos "True"/"False" de texto a booleano real
          activo: values[6].toLowerCase() === "true",
        },
      };

      // Hacemos el POST a Strapi
      const response = await fetch(STRAPI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log(`✅ Creado: ${payload.data.nombre_oficial}`);
        exitos++;
      } else {
        const errorData = await response.json();
        console.error(
          `❌ Error en ${payload.data.nombre_oficial}:`,
          JSON.stringify(errorData.error),
        );
        errores++;
      }
    } catch (err) {
      console.error(`❌ Error parseando la línea ${i}:`, err.message);
      errores++;
    }
  }

  console.log(
    `\n🎉 Proceso terminado. Éxitos: ${exitos} | Errores: ${errores}`,
  );
}

main();
