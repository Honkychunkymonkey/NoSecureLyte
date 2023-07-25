const express = require("express");
const http = require("http");
const Unblocker = require("unblocker");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const axios = require("axios");
const sanitizeHtml = require("sanitize-html");
const { storageFunction } = require("storage-function");
const { Worker, parentPort } = require("worker_threads");
const WebSocket = require("ws");
const hamsters = require("hamsters.js");
const { Transform } = require("stream");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

app.use(morgan("dev"));
app.use(compression());
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cookieParser());
app.use(express.static("public"));

hamsters.init({
	Worker: Worker,
	parentPort: parentPort,
});

const unblocker = new Unblocker({
    prefix: '/go/',
    responseMiddleware: [
        async function(data) {
            return new Promise((resolve, reject) => {
                if (data.contentType === 'text/html') {
                    let body = '';
                    data.stream.on('data', chunk => {
                        body += chunk;
                    });
                    data.stream.on('end', () => {
                        body = body.replace(
                            /https:\/\/www\.google\.com\/recaptcha\/api\.js/g,
                            '/go/https://www.google.com/recaptcha/api.js'
                        );
                        const modifiedStream = new Transform();
                        modifiedStream._transform = function(chunk, encoding, done) {
                            this.push(body);
                            done();
                        };
                        data.stream = modifiedStream;
                        resolve(data);
                    });
                    data.stream.on('error', reject);
                } else {
                    resolve(data);
                }
            });
        }
    ]
});

app.set("port", process.env.PORT || 4000);

server.on("upgrade", (request, socket, head) => {
	wss.handleUpgrade(request, socket, head, (ws) => {
		wss.emit("connection", ws, request);
	});
});

wss.on("connection", (ws, request) => {
	// Handle WebSocket messages
	ws.on("message", (message) => {
		// Process the message as needed
		console.log("Received message:", message);

		// Example: Broadcast the message to all connected clients
		wss.clients.forEach((client) => {
			if (client !== ws && client.readyState === WebSocket.OPEN) {
				client.send(message);
			}
		});
	});

	// Handle WebSocket close event
	ws.on("close", () => {
		console.log("WebSocket connection closed");
	});
});

// Sanitize HTML middleware
const sanitizeHtmlMiddleware = (req, res, next) => {
	const sendResponse = res.send;
	res.send = (body) => {
		const sanitizedBody = sanitizeHtml(body);
		sendResponse.call(res, sanitizedBody);
	};
	next();
};

app.use(unblocker);
app.use(sanitizeHtmlMiddleware);

app.get("/go/:url", (req, res) => {
	const url = decodeURIComponent(req.params.url);

	// Check if the request is a WebSocket upgrade request
	if (
		req.headers.upgrade &&
    req.headers.upgrade.toLowerCase() === "websocket"
	) {
		// Handle WebSocket upgrade request
		wss.handleUpgrade(req, req.socket, Buffer.alloc(0), (ws) => {
			wss.emit("connection", ws, req);
		});
	} else {
		// Create a new worker thread to handle the request
		const worker = new Worker("./worker.js", { workerData: { url } });

		// Listen for messages from the worker thread
		worker.on("message", (response) => {
			res.send(response);
		});

		// Listen for errors from the worker thread
		worker.on("error", (error) => {
			console.error(error);
			res.status(500).send("Error retrieving data");
		});
	}
});

app.get("/go", (req, res) => {
	const url = req.query.url;
	if (!url) {
		return res.status(400).send("Missing URL parameter");
	}
	const proxyUrl = `/go/${encodeURIComponent(url)}`;
	res.redirect(proxyUrl);
});

// Storage functions
app.get("/store/:key/:value", (req, res) => {
	const { key, value } = req.params;
	storageFunction.toLocalStorage(key, value);
	res.send("Stored successfully");
});

app.get("/retrieve/:key", (req, res) => {
	const { key } = req.params;
	const storedValue = storageFunction.fromLocalStorage(key);
	res.send(storedValue);
});

app.get("/remove/:key", (req, res) => {
	const { key } = req.params;
	storageFunction.removeFromLocalStorage(key);
	res.send("Removed successfully");
});

server.listen(app.get("port"), () => {
	console.log(`Server running on port ${app.get("port")}`);
});
