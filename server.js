import express from "express";
import http from "http";
import { Server } from "socket.io";
import "dotenv/config";
import { Ollama } from "ollama";

// ==========================================
// 1. CONFIGURACIÓN DEL SERVIDOR
// ==========================================

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

// Le decimos a Express que nuestra carpeta "public" es pública.
// Cuando el usuario entre a localhost:3000, Express buscará automáticamente el index.html ahí.

app.use(express.static("public"));

// ==========================================
// 2. CONFIGURACIÓN DE LA IA
// ==========================================

const ollama = new Ollama({
  host: "https://ollama.com",
  headers: { Authorization: `Bearer ${process.env.OLLAMA_API_KEY}` },
});

// ==========================================
// 3. LÓGICA DE WEBSOCKETS (El Túnel)
// ==========================================

io.on("connection", (socket) => {
  console.log(`🟢 Cliente conectado con éxito. ID de sesión: ${socket.id}`);

  // Aquí escucharemos el evento "mensaje" que venga del frontend
  socket.on("mensaje", async (data) => {
    // Reenviamos el mensaje a todos los usuarios conectados (incluyendo al que lo envió)
    io.emit("mensaje", data);

    if (data.nombre === "🤖 IA") return;

    try {
      // Preparamos la identidad única de este mensaje
      const idMensajeIA = `ia-${Date.now}`;
      // Avisamos al frontend que prepare la interfaz para un nuevo mensaje de IA
      io.emit("ia-inicio", { id: idMensajeIA, nombre: "🤖 IA" });

      // Pedimos a Ollama que inicie la generación del texto
      const response = await ollama.chat({
        model: "gpt-oss:120b",
        messages: [{ role: "user", content: data.texto }],
        stream: true,
      });

      // Iteramos sobre el flujo de datos y enviamos cada sílaba por el túnel
      for await (const part of response) {
        if (part.message.content) {
          (io.emit("ia-chunk"),
            { id: idMensajeIA, texto: part.message.content });
        }
      }
    } catch (error) {
      console.error("❌ Error con Ollama:", error);
      io.emit("mensaje", {
        nombre: "⚠️ Sistema",
        texto: "La IA no pudo procesar tu mensaje.",
      });
    }
  });

  // Escuchamos si el usuario cierra la pestaña del navegador
  socket.on("disconnect", () => {
    console.log(`🔴 Cliente desconectado. ID: ${socket.id}`);
  });
});

// ==========================================
// 4. ARRANQUE
// ==========================================

server.listen(PORT, () => {
  console.log(`🚀 Servidor backend operando en http://localhost:${PORT}`);
});
