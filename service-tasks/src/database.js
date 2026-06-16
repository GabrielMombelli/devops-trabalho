// Simulação de banco de dados em memória
// Em produção, seria substituído por PostgreSQL, MongoDB, etc.

const logger = require("./logger");

let tasks = [
  { id: 1, title: "Estudar DevOps", userId: 1, status: "pendente", createdAt: new Date().toISOString() },
  { id: 2, title: "Fazer o trabalho", userId: 1, status: "em andamento", createdAt: new Date().toISOString() },
  { id: 3, title: "Entregar o projeto", userId: 2, status: "pendente", createdAt: new Date().toISOString() },
];

let nextId = 4;

const db = {
  findAll() {
    logger.debug("DB: buscando todas as tarefas", { count: tasks.length });
    return tasks;
  },

  findById(id) {
    logger.debug("DB: buscando tarefa por id", { id });
    return tasks.find((t) => t.id === Number(id)) || null;
  },

  findByUserId(userId) {
    logger.debug("DB: buscando tarefas por userId", { userId });
    return tasks.filter((t) => t.userId === Number(userId));
  },

  create(data) {
    const task = {
      id: nextId++,
      ...data,
      createdAt: new Date().toISOString(),
    };
    tasks.push(task);
    logger.debug("DB: tarefa criada", { task });
    return task;
  },

  update(id, data) {
    const index = tasks.findIndex((t) => t.id === Number(id));
    if (index === -1) return null;
    tasks[index] = { ...tasks[index], ...data };
    logger.debug("DB: tarefa atualizada", { id, data });
    return tasks[index];
  },

  delete(id) {
    const index = tasks.findIndex((t) => t.id === Number(id));
    if (index === -1) return false;
    tasks.splice(index, 1);
    logger.debug("DB: tarefa removida", { id });
    return true;
  },
};

module.exports = db;
