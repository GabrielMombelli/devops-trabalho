// Camada de comunicação com os microserviços
// Todas as chamadas HTTP ficam aqui, separadas da lógica de UI

// Gera um traceId no frontend para rastrear a requisição de ponta a ponta
function generateTraceId() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// Função base de fetch com traceId e tratamento de erro centralizado
async function request(url, options = {}) {
  const traceId = generateTraceId();

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-trace-id": traceId, // propaga o trace do frontend até os serviços
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Erro ${response.status}`);
  }

  return data;
}

// API de Usuários
const usersAPI = {
  getAll() {
    return request(`${CONFIG.USERS_SERVICE_URL}/users`);
  },
  create(name, email) {
    return request(`${CONFIG.USERS_SERVICE_URL}/users`, {
      method: "POST",
      body: JSON.stringify({ name, email }),
    });
  },
  remove(id) {
    return request(`${CONFIG.USERS_SERVICE_URL}/users/${id}`, {
      method: "DELETE",
    });
  },
  health() {
    return request(`${CONFIG.USERS_SERVICE_URL}/health`);
  },
};

// API de Tarefas
const tasksAPI = {
  getAll() {
    return request(`${CONFIG.TASKS_SERVICE_URL}/tasks`);
  },
  create(title, userId) {
    return request(`${CONFIG.TASKS_SERVICE_URL}/tasks`, {
      method: "POST",
      body: JSON.stringify({ title, userId }),
    });
  },
  update(id, data) {
    return request(`${CONFIG.TASKS_SERVICE_URL}/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  remove(id) {
    return request(`${CONFIG.TASKS_SERVICE_URL}/tasks/${id}`, {
      method: "DELETE",
    });
  },
  health() {
    return request(`${CONFIG.TASKS_SERVICE_URL}/health`);
  },
};
