// 1. INICIALIZACIÓN
// Conectamos el cliente al túnel de WebSockets.
// Al no pasarle URL, asume automáticamente el mismo dominio y puerto del servidor web.


const socket = io("http://localhost:3000");

// 2. CAPTURA DEL DOM (Document Object Model)
// Buena Práctica: Capturar todos los elementos al principio del archivo.
// Hacer document.getElementById repetidas veces dentro de funciones consume más memoria.
const formulario = document.getElementById("formulario-chat");
const inputNombre = document.getElementById("input-nombre");
const inputTexto = document.getElementById("input-texto");
const listaMensajes = document.getElementById("lista-mensajes");

// ==========================================
// 3. ENVÍO DE DATOS AL SERVIDOR
// ==========================================
formulario.addEventListener("submit", (e) => {
  // e.preventDefault() evita que la página haga un refresh completo (comportamiento por defecto de HTML)
  e.preventDefault();

  const nombre = inputNombre.value.trim();
  const texto = inputTexto.value.trim();

  // Validación: Solo enviamos si hay contenido real
  if (nombre && texto) {
    // Emitimos el evento "mensaje" por el túnel hacia el Backend
    socket.emit("mensaje", { nombre, texto });

    // UX (Experiencia de Usuario): Limpiamos el input y devolvemos el foco para seguir escribiendo
    inputTexto.value = "";
    inputTexto.focus();
  }
});

// ==========================================
// 4. RECEPCIÓN DE DATOS DESDE EL SERVIDOR
// ==========================================

// A) Escuchar mensajes normales completos (de usuarios humanos o errores del sistema)
socket.on("mensaje", (data) => {
  crearMensajeEnDOM(data.nombre, data.texto);
});

// B) Escuchar cuando la IA VA A EMPEZAR a hablar
socket.on("ia-inicio", (data) => {
  // Creamos el contenedor (li) para la IA, pero le asignamos el ID único que nos dio el Backend
  const li = document.createElement("li");
  li.id = data.id;

  const strong = document.createElement("strong");
  strong.textContent = `${data.nombre}`;

  // Creamos un span especial donde irán cayendo las letras de la IA
  const spanTexto = document.createElement("span");
  spanTexto.className = "texto-ia";

  li.appendChild(strong);
  li.appendChild(spanTexto);
  listaMensajes.appendChild(li);

  hacerScrollAbajo();
});

// C) Escuchar los "pedacitos" (chunks) de texto de la IA
socket.on("ia-chunk", (data) => {
    console.log(data)
  // Buscamos el contenedor exacto usando el ID
  const mensajeIA = document.getElementById(data.id);

  if (mensajeIA) {
    const spanTexto = mensajeIA.querySelector(".texto-ia");

    // Buena Práctica de Seguridad (Prevención XSS):
    // Usamos createTextNode en lugar de innerHTML. Si la IA escupe código HTML o JS raro,
    // el navegador lo tratará como texto plano y no lo ejecutará.

    spanTexto.appendChild(document.createTextNode(data.texto));
  }
});

// ==========================================
// 5. FUNCIONES AUXILIARES (Principio DRY - Don't Repeat Yourself)
// ==========================================

function crearMensajeEnDOM(nombre, texto) {
  const li = document.createElement("li");

  const strong = document.createElement("strong");
  strong.textContent = `${nombre}: `;

  li.appendChild(strong);
  li.appendChild(document.createTextNode(texto));

  listaMensajes.appendChild(li);
  hacerScrollAbajo();
}

function hacerScrollAbajo(){
    // Mueve la barra de desplazamiento visualmente hacia el último mensaje
    listaMensajes.scrollTop = listaMensajes.scrollHeight
}