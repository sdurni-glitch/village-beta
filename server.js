const express = require("express");
const http = require("http");
const { timingSafeEqual } = require("crypto");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "lantern-backend" });
});

// Configure a long, random LANTERN_SOCKET_TOKEN in the backend's secret store.
// Clients must send it in socket.auth.token. Never put this token in a public
// frontend bundle: this shared-token mode is only suitable for trusted clients.
io.use((socket, next) => {
  const expected = process.env.LANTERN_SOCKET_TOKEN;
  const provided = socket.handshake.auth?.token;
  if (typeof expected !== "string" || expected.length < 32 ||
      typeof provided !== "string") {
    return next(new Error("Unauthorized"));
  }
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return next(new Error("Unauthorized"));
  }
  next();
});

// Bound each authenticated socket to 10 messages per rolling second.
// This limits individual clients; distributed abuse still needs edge controls.
io.on("connection", (socket) => {
  console.log("Authenticated socket connected:", socket.id);
  const recentMessages = [];

  socket.on("sendMessage", (msg) => {
    if (typeof msg !== "string" || msg.length === 0 || msg.length > 4096) {
      return;
    }
    const now = Date.now();
    while (recentMessages.length && recentMessages[0] <= now - 1000) {
      recentMessages.shift();
    }
    if (recentMessages.length >= 10) return;
    recentMessages.push(now);
    io.emit("receiveMessage", msg);
  });
});

const port = Number(process.env.PORT) || 5000;
server.listen(port, () => {
  console.log(`Lantern backend running on port ${port}`);
});
