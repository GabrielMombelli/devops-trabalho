# DevOps na Prática — Sistema de Tarefas

Projeto desenvolvido para a disciplina de Análise e Desenvolvimento de Sistemas (TADS).  
Demonstra os conceitos de DevOps vistos em aula aplicados em uma aplicação real.

---

## Arquitetura

```
┌─────────────────────┐        HTTP + TraceID        ┌─────────────────────┐
│   service-tasks     │ ─────────────────────────── ▶│   service-users     │
│   (porta 3001)      │                               │   (porta 3002)      │
│                     │                               │                     │
│  GET  /tasks        │                               │  GET  /users        │
│  GET  /tasks/:id    │                               │  GET  /users/:id    │
│  POST /tasks        │                               │  POST /users        │
│  PUT  /tasks/:id    │                               │  DEL  /users/:id    │
│  DEL  /tasks/:id    │                               │  GET  /health       │
│  GET  /health       │                               └─────────────────────┘
└─────────────────────┘
```

---

## Conceitos de DevOps aplicados

### 1. CI/CD e Pipelines
- **Pipeline** definida em `.github/workflows/ci.yml`
- A cada `push` na branch `main`, a pipeline executa automaticamente:
  1. Instala dependências dos dois serviços
  2. Verifica a estrutura do projeto
  3. Sobe os serviços e testa o `/health`
  4. Faz o deploy (simulado)

### 2. Microserviços
- Dois serviços independentes: `service-tasks` e `service-users`
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
- Usada pela pipeline de CI para verificar se o serviço subiu corretamente

### 5. Observabilidade — Tracing Distribuído
- Cada requisição recebe um `traceId` único
- O `traceId` é propagado entre serviços via header `x-trace-id`
- Isso permite rastrear o caminho completo de uma requisição mesmo atravessando vários serviços
- O `traceId` aparece em todos os logs e nas respostas da API

---

## Como rodar localmente

### Pré-requisitos
- Node.js 18+

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/devops-trabalho.git
cd devops-trabalho

# 2. Instale as dependências de cada serviço
cd service-users && npm install && cd ..
cd service-tasks && npm install && cd ..

# 3. Suba os serviços (em terminais separados)
cd service-users && npm start
cd service-tasks && npm start
```

### Testando a API

```bash
# Health checks
curl http://localhost:3001/health
curl http://localhost:3002/health

# Listar tarefas
curl http://localhost:3001/tasks

# Criar tarefa (valida se o userId existe no service-users)
curl -X POST http://localhost:3001/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Nova tarefa", "userId": 1}'

# Listar usuários
curl http://localhost:3002/users

# Criar usuário
curl -X POST http://localhost:3002/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Maria", "email": "maria@email.com"}'
```

---

## Estrutura de arquivos

```
devops-trabalho/
├── .github/
│   └── workflows/
│       └── ci.yml              # Pipeline de CI/CD
│
├── service-tasks/              # Microserviço de Tarefas (porta 3001)
│   ├── src/
│   │   ├── index.js            # Entrada da aplicação, rotas, health check
│   │   ├── logger.js           # Logs com níveis de severidade
│   │   ├── tracing.js          # Middleware de tracing distribuído
│   │   ├── database.js         # Banco de dados em memória
│   │   └── tasksController.js  # Lógica de negócio + comunicação com service-users
│   └── package.json
│
└── service-users/              # Microserviço de Usuários (porta 3002)
    ├── src/
    │   ├── index.js            # Entrada da aplicação, rotas, health check
    │   ├── logger.js           # Logs com níveis de severidade
    │   ├── tracing.js          # Middleware de tracing distribuído
    │   └── usersController.js  # Lógica de negócio
    └── package.json
```
