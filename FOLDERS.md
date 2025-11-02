project-root/
├── sequelize/ # Configuração do ORM Sequelize
│ ├── config.ts
│ ├── models/ # Models do Sequelize
│ │ ├── cedente.model.ts
│ │ ├── conta.model.ts
│ │ ├── convenio.model.ts
│ │ ├── servico.model.ts
│ │ ├── software-house.model.ts
│ │ └── webhookreprocessado.model.ts
│ ├── migrations/
│ ├── seeders/
│ └── index.ts
│── src/
│ ├── modules/
│ │ ├── auth/ # Módulo de autenticação
│ │ │ ├── domain/
│ │ │ ├── application/
│ │ │ ├── infrastructure/
│ │ │ └── interfaces/
│ │ │
│ │ ├── protocolo/ # Módulo de consulta de protocolos
│ │ │ ├── domain/
│ │ │ ├── application/
│ │ │ ├── infrastructure/
│ │ │ └── interfaces/
│ │ │
│ │ └── webhook/ # Módulo de reenvio de webhooks
│ │   ├── domain/ # Entidade WebhookReprocessado
│ │   ├── application/
│ │   │ └── use-cases/ # ReenvioWebhook, ConsultaProtocolos
│ │   ├── infrastructure/
│ │   └── interfaces/
│ │
│ ├── shared/ # Código comum a todos os módulos
│ │ ├── core/ # Implementações core (ex: RouterImplementation)
│ │ ├── errors/ # Erros customizados
│ │ ├── interfaces/ # Interfaces compartilhadas
│ │ └── utils/ # Helpers
│ │
│ ├── infrastructure/ # Serviços técnicos globais
│ │ ├── cache/ # Config Redis
│ │ ├── config/ # dotenv e variáveis de ambiente
│ │ ├── database/ # Config global do Sequelize
│ │ ├── docs/ # Documentação OpenAPI
│ │ ├── http/ # Serviços HTTP (ex: circuit-breaker)
│ │ ├── logger/ # Logger (Pino)
│ │ └── tecnospeed/ # Cliente HTTP para API Tecnospeed
│ │
│ └── app.ts # Entry point Express
│ └── server.ts # Servidor Node.js
│
├── docker-compose.yml
├── Dockerfile.development
├── Dockerfile.production
