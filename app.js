const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { Server } = require("socket.io");
const { createServer } = require("node:http");
const { logger } = require("./src/middlewares");
const pinoHttp = require("pino-http")({ logger });
const { PORT } = require("./src/config");
const os = require("os");

const mainRouter = require("./src/main");

const app = express();

const server = createServer(app);

app.use(express.static("public"));

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(express.json());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "http://191.*"],
        "style-src": ["'self'", "http://191.*"],
        "connect-src": ["'self'", "http://191.*"],
        "object-src": ["'none'"],
        "upgrade-insecure-requests": [],
      },
    },
    dnsPrefetchControl: { allow: false },
    expectCt: { enforce: true },
    frameguard: { action: "deny" },
    hidePoweredBy: { setTo: "PHP 4.2.0" },
    hsts: { maxAge: 5184000, preload: true },
    ieNoOpen: false,
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
  })
);

app.use(cors());
app.use(pinoHttp);
app.use("/api", mainRouter);

app.use("/", (req, res) => {
  res.redirect("/api");
});

io.on("connection", (socket) => {
  logger.info(`Socket connected: ${socket?.id}`);
  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket?.id}`);
  });
});

exports.io = io;


function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const alias of iface) {
      if (alias.family === "IPv4" && !alias.internal) {
        return alias.address;
      }
    }
  }
  return "localhost";
}

const hostFlag = process.argv.includes("--host");
const host = hostFlag ? getLocalIP() : "localhost";

server.listen(PORT, () => {
  logger.info(`Server online: http://${host}:${PORT}`);
});
