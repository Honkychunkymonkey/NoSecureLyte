const WebSocket = require("ws");
const wss = new WebSocket.Server({ noServer: true });

wss.on("connection", (ws, request) => {
  // Handle WebSocket messages
  ws.on("message", (message) => {
    broadcastMessage(message, ws);
  });

  // Handle WebSocket close event
  ws.on("close", () => {
    console.log("WebSocket connection closed");
  });
});

function broadcastMessage(message, ws) {
  // Broadcast the message to all connected clients
  wss.clients.forEach((client) => {
    if (client !== ws && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

module.exports = wss;
