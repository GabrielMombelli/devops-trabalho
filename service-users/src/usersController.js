const logger = require("./logger");

// Banco de dados em memória
let users = [
  { id: 1, name: "Gabriel", email: "gabriel@email.com", createdAt: new Date().toISOString() },
  { id: 2, name: "João", email: "joao@email.com", createdAt: new Date().toISOString() },
];
let nextId = 3;

const usersController = {
  // GET /users
  getAll(req, res) {
    logger.info("Usuários listados", { traceId: req.traceId, count: users.length });
    res.json({ traceId: req.traceId, data: users });
  },

  // GET /users/:id
  getById(req, res) {
    const user = users.find((u) => u.id === Number(req.params.id));

    if (!user) {
      logger.warn("Usuário não encontrado", { traceId: req.traceId, id: req.params.id });
      return res.status(404).json({ traceId: req.traceId, error: "Usuário não encontrado" });
    }

    logger.info("Usuário encontrado", { traceId: req.traceId, id: user.id });
    res.json({ traceId: req.traceId, data: user });
  },

  // POST /users
  create(req, res) {
    const { name, email } = req.body;

    if (!name || !email) {
      logger.warn("Dados inválidos para criar usuário", { traceId: req.traceId });
      return res.status(400).json({ traceId: req.traceId, error: "name e email são obrigatórios" });
    }

    const emailExistente = users.find((u) => u.email === email);
    if (emailExistente) {
      logger.warn("Email já cadastrado", { traceId: req.traceId, email });
      return res.status(409).json({ traceId: req.traceId, error: "Email já cadastrado" });
    }

    const user = { id: nextId++, name, email, createdAt: new Date().toISOString() };
    users.push(user);

    logger.info("Usuário criado", { traceId: req.traceId, userId: user.id });
    res.status(201).json({ traceId: req.traceId, data: user });
  },

  // DELETE /users/:id
  remove(req, res) {
    const index = users.findIndex((u) => u.id === Number(req.params.id));

    if (index === -1) {
      logger.warn("Usuário não encontrado para remoção", { traceId: req.traceId, id: req.params.id });
      return res.status(404).json({ traceId: req.traceId, error: "Usuário não encontrado" });
    }

    users.splice(index, 1);
    logger.info("Usuário removido", { traceId: req.traceId, id: req.params.id });
    res.json({ traceId: req.traceId, message: "Usuário removido com sucesso" });
  },
};

module.exports = usersController;
