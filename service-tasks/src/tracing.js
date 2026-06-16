// Tracing Distribuído: gera e propaga um ID único por requisição
// Permite rastrear o caminho completo de uma requisição entre microserviços
// Conceito abordado em aula: Microserviços e Tracing Distribuído

const { v4: uuidv4 } = require("crypto");
const logger = require("./logger");

function generateTraceId() {
  // Gera um ID único para cada requisição
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

function tracingMiddleware(req, res, next) {
  // Reutiliza o traceId se veio de outro serviço, ou cria um novo
  const traceId = req.headers["x-trace-id"] || generateTraceId();

  // Injeta o traceId no objeto da requisição para uso nos controllers
  req.traceId = traceId;

  // Propaga o traceId no header de resposta para o cliente ver
  res.setHeader("x-trace-id", traceId);

  const start = Date.now();

  logger.info(`Requisição recebida: ${req.method} ${req.path}`, {
    traceId,
    method: req.method,
    path: req.path,
  });

  // Quando a resposta terminar, loga o tempo de resposta (monitoramento)
  res.on("finish", () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? "warn" : "info";

    logger[level](`Resposta enviada: ${res.statusCode}`, {
      traceId,
      statusCode: res.statusCode,
      durationMs: duration,
    });
  });

  next();
}

module.exports = { tracingMiddleware, generateTraceId };
