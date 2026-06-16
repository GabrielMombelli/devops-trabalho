// frontend/app.js
// Lógica da aplicação: manipulação do DOM, eventos e estado

// Estado da aplicação 
let users = [];
let tasks = [];
let selectedUserId = null;

// Utilitários de UI
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast toast--${type} toast--visible`;
  setTimeout(() => toast.classList.remove("toast--visible"), 3000);
}

function setLoading(buttonId, loading) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;
  btn.disabled = loading;
  btn.dataset.original = btn.dataset.original || btn.textContent;
  btn.textContent = loading ? "Aguarde..." : btn.dataset.original;
}

function formatStatus(status) {
  const map = {
    pendente: "🔵 Pendente",
    "em andamento": "🟡 Em andamento",
    concluída: "🟢 Concluída",
  };
  return map[status] || status;
}

// Health Check
async function checkHealth() {
  const usersEl = document.getElementById("health-users");
  const tasksEl = document.getElementById("health-tasks");

  usersEl.textContent = "verificando...";
  tasksEl.textContent = "verificando...";

  try {
    const data = await usersAPI.health();
    usersEl.textContent = `online — uptime ${data.uptime}`;
    usersEl.className = "health__value health__value--ok";
  } catch {
    usersEl.textContent = "offline";
    usersEl.className = "health__value health__value--error";
  }

  try {
    const data = await tasksAPI.health();
    tasksEl.textContent = `online — uptime ${data.uptime}`;
    tasksEl.className = "health__value health__value--ok";
  } catch {
    tasksEl.textContent = "offline";
    tasksEl.className = "health__value health__value--error";
  }
}

// Usuários
async function loadUsers() {
  try {
    const res = await usersAPI.getAll();
    users = res.data;
    renderUsers();
    renderUserSelect();
  } catch (err) {
    showToast("Erro ao carregar usuários: " + err.message, "error");
  }
}

function renderUsers() {
  const list = document.getElementById("users-list");

  if (users.length === 0) {
    list.innerHTML = `<p class="empty">Nenhum usuário cadastrado.</p>`;
    return;
  }

  list.innerHTML = users
    .map(
      (u) => `
    <div class="card">
      <div class="card__info">
        <span class="card__title">${u.name}</span>
        <span class="card__subtitle">${u.email}</span>
      </div>
      <button class="btn btn--danger btn--sm" onclick="removeUser(${u.id})">Remover</button>
    </div>
  `
    )
    .join("");
}

function renderUserSelect() {
  const select = document.getElementById("task-user");
  select.innerHTML = `<option value="">Selecione um usuário</option>`;
  users.forEach((u) => {
    select.innerHTML += `<option value="${u.id}">${u.name}</option>`;
  });
}

async function createUser() {
  const name = document.getElementById("user-name").value.trim();
  const email = document.getElementById("user-email").value.trim();

  if (!name || !email) {
    showToast("Preencha nome e email", "error");
    return;
  }

  setLoading("btn-create-user", true);
  try {
    await usersAPI.create(name, email);
    document.getElementById("user-name").value = "";
    document.getElementById("user-email").value = "";
    showToast("Usuário criado com sucesso!");
    await loadUsers();
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    setLoading("btn-create-user", false);
  }
}

async function removeUser(id) {
  if (!confirm("Remover este usuário?")) return;
  try {
    await usersAPI.remove(id);
    showToast("Usuário removido");
    await loadUsers();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// Tarefas
async function loadTasks() {
  try {
    const res = await tasksAPI.getAll();
    tasks = res.data;
    renderTasks();
  } catch (err) {
    showToast("Erro ao carregar tarefas: " + err.message, "error");
  }
}

function renderTasks() {
  const list = document.getElementById("tasks-list");

  if (tasks.length === 0) {
    list.innerHTML = `<p class="empty">Nenhuma tarefa cadastrada.</p>`;
    return;
  }

  list.innerHTML = tasks
    .map((t) => {
      const user = users.find((u) => u.id === t.userId);
      return `
      <div class="card">
        <div class="card__info">
          <span class="card__title">${t.title}</span>
          <span class="card__subtitle">
            ${formatStatus(t.status)} · ${user ? user.name : "Usuário #" + t.userId}
          </span>
        </div>
        <div class="card__actions">
          <select class="select--sm" onchange="updateTaskStatus(${t.id}, this.value)">
            <option value="pendente" ${t.status === "pendente" ? "selected" : ""}>Pendente</option>
            <option value="em andamento" ${t.status === "em andamento" ? "selected" : ""}>Em andamento</option>
            <option value="concluída" ${t.status === "concluída" ? "selected" : ""}>Concluída</option>
          </select>
          <button class="btn btn--danger btn--sm" onclick="removeTask(${t.id})">Remover</button>
        </div>
      </div>
    `;
    })
    .join("");
}

async function createTask() {
  const title = document.getElementById("task-title").value.trim();
  const userId = document.getElementById("task-user").value;

  if (!title || !userId) {
    showToast("Preencha o título e selecione um usuário", "error");
    return;
  }

  setLoading("btn-create-task", true);
  try {
    await tasksAPI.create(title, userId);
    document.getElementById("task-title").value = "";
    document.getElementById("task-user").value = "";
    showToast("Tarefa criada com sucesso!");
    await loadTasks();
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    setLoading("btn-create-task", false);
  }
}

async function updateTaskStatus(id, status) {
  try {
    await tasksAPI.update(id, { status });
    showToast("Status atualizado");
    await loadTasks();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function removeTask(id) {
  if (!confirm("Remover esta tarefa?")) return;
  try {
    await tasksAPI.remove(id);
    showToast("Tarefa removida");
    await loadTasks();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// Inicialização
async function init() {
  await checkHealth();
  await loadUsers();
  await loadTasks();
}

init();
