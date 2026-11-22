const test = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { io } = require("socket.io-client");

const token = "test-only-secret-value-at-least-32-characters";
const port = 5057;
const url = `http://127.0.0.1:${port}`;

function connect(auth) {
  return new Promise((resolve, reject) => {
    const socket = io(url, {
      transports: ["websocket"],
      reconnection: false,
      timeout: 2000,
      auth
    });
    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error("Socket authentication timed out"));
    }, 3000);
    socket.once("connect", () => {
      clearTimeout(timeout);
      socket.disconnect();
      resolve("connected");
    });
    socket.once("connect_error", error => {
      clearTimeout(timeout);
      socket.disconnect();
      resolve(error.message);
    });
  });
}

test("Socket.IO rejects missing and invalid tokens, accepts valid token", async () => {
  const child = spawn(process.execPath, ["server.js"], {
    env: { ...process.env, PORT: String(port), LANTERN_SOCKET_TOKEN: token },
    stdio: ["ignore", "pipe", "pipe"]
  });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 40; attempt++) {
      if (child.exitCode !== null) throw new Error("Server exited before startup");
      try {
        const response = await fetch(`${url}/health`);
        if (response.ok) { ready = true; break; }
      } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.ok(ready, "Server did not become healthy");
    assert.equal(await connect({}), "Unauthorized");
    assert.equal(await connect({ token: "incorrect-token" }), "Unauthorized");
    assert.equal(await connect({ token }), "connected");
  } finally {
    child.kill();
  }
});
