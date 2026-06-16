// Microserviço de Tarefas
// Porta: 3001

const express = require("express");
const { tracingMiddleware } = require("./tracing");
const tasksController = require("./tasksController");
const logger = require("./logger");

const app = express();
const PORT = process.env.PORT || 3001;

// Marca o momento em que o serviço iniciou (usado no health check)
const startTime = Date.now();

// Middlewares
app.use(express.json());
app.use(tracingMiddleware); // injeta traceId em todas as requisições

// Health Check 
// Rota obrigatória em microserviços: permite que orquestradores (Kubernetes,
// Railway, etc.) saibam se o serviço está saudável
app.get("/health", (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  const health = {
    status: "ok",
    service: "service-tasks",
    uptime: `${uptimeSeconds}s`,
    timestamp: new Date().toISOString(),
  };

  logger.info("Health check realizado", { traceId: req.traceId, uptime: health.uptime });
  res.json(health);
});

// Rotas de Tarefas 
app.get("/tasks", tasksController.getAll);
app.get("/tasks/:id", tasksController.getById);
app.post("/tasks", tasksController.create);
app.put("/tasks/:id", tasksController.update);
app.delete("/tasks/:id", tasksController.remove);

// Rota não encontrada 
app.use((req, res) => {
  logger.warn("Rota não encontrada", { path: req.path, method: req.method });
  res.status(404).json({ error: "Rota não encontrada" });
});

// Tratamento global de erros 
app.use((err, req, res, next) => {
  logger.error("Erro não tratado", { error: err.message, stack: err.stack });
  res.status(500).json({ error: "Erro interno do servidor" });
});

// Inicialização 
app.listen(PORT, () => {
  logger.info(`service-tasks iniciado na porta ${PORT}`);
});

module.exports = app;
