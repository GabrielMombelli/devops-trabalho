# DevOps na Prática — Sistema de Tarefas

Projeto desenvolvido para a disciplina de Análise e Desenvolvimento de Sistemas (TADS) — UNIPAR.
Demonstra os conceitos de DevOps vistos em aula aplicados em uma aplicação real, com deploy público.

---

## Acesse o sistema no ar

- **Frontend:** https://devops-trabalho-tan.vercel.app
- **service-tasks:** https://service-tasks.onrender.com
- **service-users:** https://service-users-u6i9.onrender.com

> Os serviços no Render usam o plano free, então podem demorar ~30s para "acordar" na primeira requisição após um período de inatividade.

---

## Arquitetura

```
┌─────────────────────┐        HTTP + TraceID        ┌─────────────────────┐
│   service-tasks     │ ─────────────────────────── ▶│   service-users     │
│   (Render)           │                               │   (Render)           │
│                     │                               │                     │
│  GET  /tasks        │                               │  GET  /users        │
│  GET  /tasks/:id    │                               │  GET  /users/:id    │
│  POST /tasks        │                               │  POST /users        │
│  PUT  /tasks/:id    │                               │  DEL  /users/:id    │
│  DEL  /tasks/:id    │                               │  GET  /health       │
│  GET  /health       │                               └─────────────────────┘
└─────────────────────┘
          ▲
          │ HTTP
          │
┌─────────────────────┐
│      frontend        │
│   (Vercel - estático) │
│  HTML / CSS / JS puro │
└─────────────────────┘
```

---

## Conceitos de DevOps aplicados

### 1. CI/CD e Pipelines
- **Pipeline** definida em `.github/workflows/ci.yml`
- A cada `push` na branch `master`, o GitHub Actions executa automaticamente:
  1. Instala dependências dos dois serviços
  2. Verifica a estrutura do projeto (backend e frontend)
  3. Sobe os serviços e testa o `/health`
  4. Simula o deploy
- O **deploy real** acontece via integração contínua do Render e Vercel: qualquer push na branch principal já dispara um novo deploy automaticamente nos dois.

### 2. Microserviços
- Dois serviços de backend independentes: `service-tasks` e `service-users`
- Cada serviço tem sua própria base de código, dependências e porta
- Comunicam-se via HTTP com payload JSON
- `service-tasks` consulta `service-users` para validar o usuário antes de criar uma tarefa
- Resiliência: se `service-users` estiver fora, `service-tasks` continua funcionando

### 3. Logs com níveis de severidade
Todos os eventos são registrados com nível de severidade:

| Nível   | Quando usar                                           |
|---------|-------------------------------------------------------|
| `DEBUG` | Detalhes internos, consultas ao banco, payloads       |
| `INFO`  | Fluxo normal: serviço iniciado, tarefa criada         |
| `WARN`  | Algo inesperado, mas não crítico: usuário não achado  |
| `ERROR` | Falha real: erro ao salvar, serviço indisponível      |

### 4. Monitoramento — Health Check
- Rota `GET /health` em cada serviço
- Retorna: status, nome do serviço, uptime e timestamp
- Usada pela pipeline de CI e exibida em tempo real no frontend

### 5. Observabilidade — Tracing Distribuído
- Cada requisição recebe um `traceId` único, gerado já no frontend
- O `traceId` é propagado entre todos os serviços via header `x-trace-id`
- Isso permite rastrear o caminho completo de uma requisição mesmo atravessando vários serviços
- O `traceId` aparece em todos os logs e nas respostas da API

### 6. Deploy em nuvem (CD na prática)
- **Render** hospeda os dois microserviços backend (Web Services gratuitos)
- **Vercel** hospeda o frontend estático
- **CORS** configurado nos dois backends para aceitar requisições do domínio do Vercel
- Variável de ambiente `USERS_SERVICE_URL` configurada no Render para o `service-tasks` encontrar o `service-users`

---

## Como rodar localmente

### Pré-requisitos
- Node.js 18+

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/GabrielMombelli/devops-trabalho.git
cd devops-trabalho

# 2. Instale as dependências de cada serviço
cd service-users && npm install && cd ..
cd service-tasks && npm install && cd ..

# 3. Suba os serviços (em terminais separados)
cd service-users && npm start
cd service-tasks && npm start

# 4. Abra o frontend
# Basta abrir frontend/index.html no navegador,
# ou rodar um servidor estático simples:
cd frontend && npx serve .
```

> Para testar localmente, lembre de apontar `frontend/config.js` para `http://localhost:3001` e `http://localhost:3002`.

### Testando a API diretamente

```bash
# Health checks
curl https://service-tasks.onrender.com/health
curl https://service-users-u6i9.onrender.com/health

# Listar tarefas
curl https://service-tasks.onrender.com/tasks

# Criar tarefa (valida se o userId existe no service-users)
curl -X POST https://service-tasks.onrender.com/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Nova tarefa", "userId": 1}'

# Criar usuário
curl -X POST https://service-users-u6i9.onrender.com/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Maria", "email": "maria@email.com"}'
```

---

## Estrutura de arquivos

```
devops-trabalho/
├── .github/
│   └── workflows/
│       └── ci.yml              # Pipeline de CI/CD (GitHub Actions)
│
├── render.yaml                  # Configuração de deploy dos backends no Render
├── vercel.json                  # Configuração de deploy do frontend no Vercel
│
├── service-tasks/                # Microserviço de Tarefas
│   ├── src/
│   │   ├── index.js              # Entrada da aplicação, rotas, health check, CORS
│   │   ├── logger.js              # Logs com níveis de severidade
│   │   ├── tracing.js             # Middleware de tracing distribuído
│   │   ├── database.js            # Banco de dados em memória
│   │   └── tasksController.js     # Lógica de negócio + comunicação com service-users
│   └── package.json
│
├── service-users/                # Microserviço de Usuários
│   ├── src/
│   │   ├── index.js              # Entrada da aplicação, rotas, health check, CORS
│   │   ├── logger.js              # Logs com níveis de severidade
│   │   ├── tracing.js             # Middleware de tracing distribuído
│   │   └── usersController.js     # Lógica de negócio
│   └── package.json
│
└── frontend/                     # Interface web (deploy no Vercel)
    ├── index.html                 # Estrutura e estilos da página
    ├── config.js                  # URLs dos microserviços
    ├── api.js                     # Camada de comunicação HTTP com os serviços
    └── app.js                     # Lógica da interface (DOM, eventos, estado)
```

---

## Stack utilizada

| Camada           | Tecnologia                          |
|------------------|--------------------------------------|
| Backend          | Node.js 18 + Express                  |
| Frontend         | HTML, CSS e JavaScript puro (sem framework) |
| Comunicação      | HTTP + JSON, com header `x-trace-id`   |
| CI/CD            | GitHub Actions (`.github/workflows/ci.yml`) |
| Deploy backend   | Render (Web Service, plano free)       |
| Deploy frontend  | Vercel (Static Site)                   |
| Versionamento    | Git + GitHub                           |
