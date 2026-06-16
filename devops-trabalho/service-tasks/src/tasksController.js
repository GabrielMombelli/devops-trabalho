// Controller de Tarefas
// Demonstra comunicação entre microserviços: tasks consulta o service-users
// para validar se o usuário existe antes de criar uma tarefa

const axios = require("axios");
const db = require("./database");
const logger = require("./logger");

// URL do serviço de usuários (microserviço independente)
const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || "http://localhost:3002";

// Consulta o service-users para validar se o usuário existe
// Propagamos o traceId para rastrear a requisição entre serviços
async function fetchUser(userId, traceId) {
  try {
    logger.info("Consultando service-users", { userId, traceId });

    const response = await axios.get(`${USERS_SERVICE_URL}/users/${userId}`, {
      headers: { "x-trace-id": traceId }, // propagação do trace
      timeout: 3000,
    });

    return response.data;
  } catch (err) {
    if (err.response?.status === 404) {
      logger.warn("Usuário não encontrado no service-users", { userId, traceId });
      return null;
    }
    // Erro de comunicação entre serviços
    logger.error("Falha ao comunicar com service-users", {
      userId,
      traceId,
      error: err.message,
    });
    throw new Error("service-users indisponível");
  }
}

const tasksController = {
  // GET /tasks - lista todas as tarefas
  async getAll(req, res) {
    try {
      const tasks = db.findAll();
      logger.info("Tarefas listadas com sucesso", { traceId: req.traceId, count: tasks.length });
      res.json({ traceId: req.traceId, data: tasks });
    } catch (err) {
      logger.error("Erro ao listar tarefas", { traceId: req.traceId, error: err.message });
      res.status(500).json({ traceId: req.traceId, error: "Erro interno" });
    }
  },

  // GET /tasks/:id - busca tarefa por id
  async getById(req, res) {
    try {
      const task = db.findById(req.params.id);

      if (!task) {
        logger.warn("Tarefa não encontrada", { traceId: req.traceId, id: req.params.id });
        return res.status(404).json({ traceId: req.traceId, error: "Tarefa não encontrada" });
      }

      logger.info("Tarefa encontrada", { traceId: req.traceId, id: task.id });
      res.json({ traceId: req.traceId, data: task });
    } catch (err) {
      logger.error("Erro ao buscar tarefa", { traceId: req.traceId, error: err.message });
      res.status(500).json({ traceId: req.traceId, error: "Erro interno" });
    }
  },

  // POST /tasks - cria nova tarefa
  async create(req, res) {
    try {
      const { title, userId, status } = req.body;

      // Validação básica
      if (!title || !userId) {
        logger.warn("Dados inválidos para criar tarefa", { traceId: req.traceId, body: req.body });
        return res.status(400).json({ traceId: req.traceId, error: "title e userId são obrigatórios" });
      }

      // Comunicação entre microserviços: valida se o usuário existe
      let user;
      try {
        user = await fetchUser(userId, req.traceId);
      } catch (err) {
        // Circuit breaker simples: se o service-users estiver fora,
        // permitimos criar a tarefa mesmo assim (resiliência)
        logger.warn("Criando tarefa sem validação de usuário (service-users indisponível)", {
          traceId: req.traceId,
          userId,
        });
        user = { id: userId };
      }

      if (!user) {
        return res.status(404).json({ traceId: req.traceId, error: "Usuário não encontrado" });
      }

      const task = db.create({
        title,
        userId: Number(userId),
        status: status || "pendente",
      });

      logger.info("Tarefa criada com sucesso", { traceId: req.traceId, taskId: task.id });
      res.status(201).json({ traceId: req.traceId, data: task });
    } catch (err) {
      logger.error("Erro ao criar tarefa", { traceId: req.traceId, error: err.message });
      res.status(500).json({ traceId: req.traceId, error: "Erro interno" });
    }
  },

  // PUT /tasks/:id - atualiza tarefa
  async update(req, res) {
    try {
      const task = db.update(req.params.id, req.body);

      if (!task) {
        logger.warn("Tarefa não encontrada para atualização", { traceId: req.traceId, id: req.params.id });
        return res.status(404).json({ traceId: req.traceId, error: "Tarefa não encontrada" });
      }

      logger.info("Tarefa atualizada", { traceId: req.traceId, id: task.id });
      res.json({ traceId: req.traceId, data: task });
    } catch (err) {
      logger.error("Erro ao atualizar tarefa", { traceId: req.traceId, error: err.message });
      res.status(500).json({ traceId: req.traceId, error: "Erro interno" });
    }
  },

  // DELETE /tasks/:id - remove tarefa
  async remove(req, res) {
    try {
      const deleted = db.delete(req.params.id);

      if (!deleted) {
        logger.warn("Tarefa não encontrada para remoção", { traceId: req.traceId, id: req.params.id });
        return res.status(404).json({ traceId: req.traceId, error: "Tarefa não encontrada" });
      }

      logger.info("Tarefa removida", { traceId: req.traceId, id: req.params.id });
      res.json({ traceId: req.traceId, message: "Tarefa removida com sucesso" });
    } catch (err) {
      logger.error("Erro ao remover tarefa", { traceId: req.traceId, error: err.message });
      res.status(500).json({ traceId: req.traceId, error: "Erro interno" });
    }
  },
};

module.exports = tasksController;
