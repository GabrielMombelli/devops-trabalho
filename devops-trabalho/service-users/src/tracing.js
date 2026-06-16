const logger = require("./logger");

function generateTraceId() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

function tracingMiddleware(req, res, next) {
  // Se o traceId veio do service-tasks, reutiliza — assim o trace é contínuo entre serviços
  const traceId = req.headers["x-trace-id"] || generateTraceId();
  req.traceId = traceId;
  res.setHeader("x-trace-id", traceId);

  const start = Date.now();

  logger.info(`Requisição recebida: ${req.method} ${req.path}`, { traceId });

  res.on("finish", () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? "warn" : "info";
    logger[level](`Resposta enviada: ${res.statusCode}`, { traceId, durationMs: duration });
  });

  next();
}

module.exports = { tracingMiddleware };
