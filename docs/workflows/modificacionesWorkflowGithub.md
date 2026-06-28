# Guía de Modificación: n8n GitHub Sync Dashboard Multi-Usuario

## Objetivo

Modificar el workflow base "GitHub Sync Dashboard" para soportar múltiples desarrolladores. El sistema requerirá que el usuario se identifique temporalmente al abrir el panel interactivo, asociando sus acciones en la interfaz a su propia cuenta y credenciales de GitHub durante esa sesión.

## Fase 1: Modificación del Frontend (El Panel HTML)

Actualmente, el workflow renderiza el panel descargando una plantilla externa mediante el nodo `Get Dashboard Source` (`https://parsedventures.com/n8n-dashboard-v2.html`). Para poder inyectar nuestra lógica de control de sesiones, debemos internalizar este código.

### Pasos de implementación:

1. **Eliminar la dependencia externa:** Borrar el nodo `Get Dashboard Source`.
2. **Crear un nodo HTML local:** Insertar un nodo `HTML` (o `Code` configurado para retornar HTML) que contenga una plantilla HTML local que será la base para posteriormente incorporar los cambios solicitados.
3. **Inyectar la lógica de Sesión (`sessionStorage`):**
   Añadir el siguiente bloque de JavaScript y HTML para manejar la identidad del usuario activo:

   ```html
   <div
     id="user-info"
     style="display: none; padding: 10px; background: #f0f0f0; border-radius: 5px; margin-bottom: 15px;"
   >
     <strong id="current-user-display"></strong>
     <button
       onclick="cerrarSesion()"
       style="margin-left: 10px; padding: 5px 10px; cursor: pointer;"
     >
       Cerrar Sesión
     </button>
   </div>

   <script>
     // Lógica de Autenticación Efímera
     function verificarSesion() {
       let usuarioActual = sessionStorage.getItem("n8n_user");
       if (!usuarioActual) {
         usuarioActual = prompt(
           "Identifícate para los commits en GitHub (Ej: Fran, Líder de Proyecto):",
         );
         if (!usuarioActual || usuarioActual.trim() === "") {
           usuarioActual = "Dev_Anonimo"; // Fallback por defecto
         }
         sessionStorage.setItem("n8n_user", usuarioActual);
       }
       document.getElementById("current-user-display").innerText =
         "👤 Sesión activa: " + usuarioActual;
       document.getElementById("user-info").style.display = "block";
     }

     function cerrarSesion() {
       sessionStorage.removeItem("n8n_user");
       window.location.reload();
     }

     // Ejecución automática al cargar la vista
     verificarSesion();
   </script>
   ```

4. Modificar los Webhooks salientes:
   Localizar las funciones JS que hacen peticiones (fetch) hacia el Webhook-actions de n8n (ej. cuando se presiona "Sync"). Modificar el payload para que incluya al usuario en curso:

   ```javascript
   const payload = {
     action: "syncWorkflow", // o la acción correspondiente
     workflowId: id,
     user: sessionStorage.getItem("n8n_user"), // <- Nueva línea
   };
   ```

Fase 2: Modificación del Backend (El Enrutador en n8n)
El webhook Webhook-actions ahora recibirá un nuevo parámetro: user. Debemos usar este parámetro para decidir qué credenciales de GitHub utilizar.

Pasos de implementación:
Captura del Usuario: Validar que el parámetro {{ $json.query.user }} (o body.user, dependiendo de cómo envíes el POST) esté llegando correctamente al nodo Webhook-actions.

Crear el Enrutador de Autores: Justo antes de los nodos de escritura en GitHub (específicamente antes de GH | Edit existing file y GH | Create new file), insertar un nodo Switch llamado Seleccionar Autor.

Configurar el Switch:

Regla 1: Si user es igual a Fran -> Enrutar a Salida 1.

Regla 2: Si user es igual a Compañero -> Enrutar a Salida 2.

Bifurcación de Credenciales:

Duplicar los nodos de acción de GitHub (Create new file, Edit existing file).

Rama 1: Conectar a los nodos configurados con la credencial de GitHub del Desarrollador 1.

Rama 2: Conectar a los nodos configurados con la credencial de GitHub del Desarrollador 2.

(Opcional) Ajuste del Mensaje de Commit: Modificar el parámetro commitMessage en los nodos de GitHub para que incluya automáticamente el nombre del autor, por ejemplo: [n8n Sync] Actualizado por {{$json.query.user}}.
