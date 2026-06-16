// Mesmo padrão de logger do service-tasks
// Em produção, ambos enviariam logs para uma plataforma centralizada (ex: Datadog, Grafana)

const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const CURRENT_LEVEL = LOG_LEVELS.DEBUG;

function formatMessage(level, message, extra = {}) {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level}] [service-users] ${message}`;
  const hasExtra = Object.keys(extra).length > 0;
  return hasExtra ? `${base} | ${JSON.stringify(extra)}` : base;
}

const logger = {
  info(message, extra = {}) {
    if (CURRENT_LEVEL <= LOG_LEVELS.INFO) console.log(formatMessage("INFO", message, extra));
  },
  warn(message, extra = {}) {
    if (CURRENT_LEVEL <= LOG_LEVELS.WARN) console.warn(formatMessage("WARN", message, extra));
  },
  error(message, extra = {}) {
    if (CURRENT_LEVEL <= LOG_LEVELS.ERROR) console.error(formatMessage("ERROR", message, extra));
  },
  debug(message, extra = {}) {
    if (CURRENT_LEVEL <= LOG_LEVELS.DEBUG) console.log(formatMessage("DEBUG", message, extra));
  },
};

module.exports = logger;
