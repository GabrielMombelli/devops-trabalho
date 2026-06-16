// Utilitário de logs com níveis de severidade (INFO, WARN, ERROR, DEBUG)
// Conceito de Monitoramento e Logs abordado em aula

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const CURRENT_LEVEL = LOG_LEVELS.DEBUG;

function formatMessage(level, message, extra = {}) {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level}] [service-tasks] ${message}`;
  const hasExtra = Object.keys(extra).length > 0;
  return hasExtra ? `${base} | ${JSON.stringify(extra)}` : base;
}

const logger = {
  // INFO: eventos normais, fluxo esperado
  info(message, extra = {}) {
    if (CURRENT_LEVEL <= LOG_LEVELS.INFO) {
      console.log(formatMessage("INFO", message, extra));
    }
  },

  // WARN: algo inesperado, mas a aplicação ainda funciona
  warn(message, extra = {}) {
    if (CURRENT_LEVEL <= LOG_LEVELS.WARN) {
      console.warn(formatMessage("WARN", message, extra));
    }
  },

  // ERROR: falha real, precisa ser investigada
  error(message, extra = {}) {
    if (CURRENT_LEVEL <= LOG_LEVELS.ERROR) {
      console.error(formatMessage("ERROR", message, extra));
    }
  },

  // DEBUG: detalhes internos, usado durante desenvolvimento
  debug(message, extra = {}) {
    if (CURRENT_LEVEL <= LOG_LEVELS.DEBUG) {
      console.log(formatMessage("DEBUG", message, extra));
    }
  },
};

module.exports = logger;
