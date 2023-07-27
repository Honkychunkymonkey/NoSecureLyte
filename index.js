// Import required libraries and modules
const express = require("express");
const http = require("http");
const Unblocker = require("unblocker");
const compression = require("compression");
const axios = require("axios");
const { Worker, parentPort } = require("worker_threads");
const WebSocket = require("ws");
const hamsters = require("hamsters.js");
const { Transform } = require("stream");
// Importing our custom modules for storage, configuration and WebSocket handling
const storageRoutes = require("./storageRoutes");
const config = require("./config");
const wss = require("./wsHandler");

// Import utility libraries for request logging, cookie parsing, security, and HTML sanitization
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const sanitizeHtml = require("sanitize-html");
const { storageFunction } = require("storage-function");

// Initialize express and http server
const app = express();
const server = http.createServer(app);

// Endpoint to get the prefix value from the config
app.get("/prefix", (req, res) => {
  res.send({ prefix: config.PREFIX });
});

// Function to check config and log errors
function checkConfig() {
  if (!config.PREFIX) {
    console.error("Configuration error: PREFIX is not set.");
  }

  if (!config.PORT || config.PORT === 0) {
    // Generate a random port number between 3000 and 9999 if port is 0 or not set
    config.PORT = Math.floor(Math.random() * (9999 - 3000 + 1) + 3000);
    console.log(
      `Port is not set or 0, random port ${config.PORT} has been generated.`
    );
  } else if (config.PORT.toString().length < 3) {
    console.error("Configuration error: PORT should be at least 3 digits.");
  } else if (config.PORT.toString().length > 4) {
    console.error("Configuration error: PORT should be at most 4 digits.");
  }
}

// Run the config check function
checkConfig();

// Use imported storage routes on "/storage" path
app.use("/storage", storageRoutes);
// Use middleware for logging, compression, security, cookie parsing, and serving static files
app.use(morgan("dev"));
app.use(compression());
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(cookieParser());
app.use(express.static("public"));

// Initialize hamsters.js for multithreading
hamsters.init({
  Worker: Worker,
  parentPort: parentPort,
});

// Initialize Unblocker middleware for proxy functionality, including URL prefix and response middleware
const unblocker = new Unblocker({
  prefix: config.PREFIX,
  responseMiddleware: [
    async function (data) {
      // This function handles HTML response modifications before it reaches the client
    },
  ],
});

// Set port from configuration
app.set("port", config.PORT);

// Handle WebSocket upgrade requests
server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

// Middleware to sanitize HTML in responses
const sanitizeHtmlMiddleware = (req, res, next) => {
  const sendResponse = res.send;
  res.send = (body) => {
    const sanitizedBody = sanitizeHtml(body);
    sendResponse.call(res, sanitizedBody);
  };
  next();
};

// Use Unblocker and sanitize HTML middleware
app.use(unblocker);
app.use(sanitizeHtmlMiddleware);

// Handle "/go/:url" path for proxying or WebSockets
app.get("/go/:url", (req, res) => {
  // Implementation of proxy and WebSocket handling
});

// Redirect to "/go/:url" path when "/go" path is accessed with a URL parameter
app.get("/go", (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).send("Missing URL parameter");
  }
  const proxyUrl = `/go/${encodeURIComponent(url)}`;
  res.redirect(proxyUrl);
});

// Start server listening on the specified port
server.listen(app.get("port"), () => {
  console.log(`Server running on port ${app.get("port")}`);
});
