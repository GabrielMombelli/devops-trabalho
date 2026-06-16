// src/index.js - service-users
// Microserviço de Usuários
// Porta: 3002

const express = require("express");
const { tracingMiddleware } = require("./tracing");
const usersController = require("./usersController");
const logger = require("./logger");

const app = express();
const PORT = process.env.PORT || 3002;
const startTime = Date.now();

app.use(express.json());
app.use(tracingMiddleware);

// Health Check
app.get("/health", (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  const health = {
    status: "ok",
    service: "service-users",
    uptime: `${uptimeSeconds}s`,
    timestamp: new Date().toISOString(),
  };

  logger.info("Health check realizado", { traceId: req.traceId, uptime: health.uptime });
  res.json(health);
});

// Rotas de Usuários
app.get("/users", usersController.getAll);
app.get("/users/:id", usersController.getById);
app.post("/users", usersController.create);
app.delete("/users/:id", usersController.remove);

// 404
app.use((req, res) => {
  logger.warn("Rota não encontrada", { path: req.path });
  res.status(404).json({ error: "Rota não encontrada" });
});

// Erro global
app.use((err, req, res, next) => {
  logger.error("Erro não tratado", { error: err.message });
  res.status(500).json({ error: "Erro interno do servidor" });
});

app.listen(PORT, () => {
  logger.info(`service-users iniciado na porta ${PORT}`);
});

module.exports = app;
