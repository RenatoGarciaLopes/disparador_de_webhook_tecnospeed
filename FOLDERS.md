project-root/
├── sequelize/
│ ├── config.ts
│ ├── models/
│ ├── migrations/
│ ├── seeders/
│ └── index.ts
│── src/
│ ├── modules/
│ │ ├── software-house/
│ │ │ ├── domain/
│ │ │ │ ├── entities/ # Entidade SoftwareHouse
│ │ │ │ └── repositories/ # Contratos de repositório
│ │ │ ├── application/
│ │ │ │ └── use-cases/ # Regras de negócio (ex: validar SH)
│ │ │ ├── infrastructure/
│ │ │ │ └── database/ # Model Sequelize, migrations
│ │ │ └── interfaces/
│ │ │ └── http/ # Controller + rotas
│ │ │
│ │ ├── cedente/
│ │ │ ├── domain/
│ │ │ ├── application/
│ │ │ ├── infrastructure/
│ │ │ └── interfaces/
│ │ │
│ │ ├── conta/
│ │ │ ├── domain/
│ │ │ ├── application/
│ │ │ ├── infrastructure/
│ │ │ └── interfaces/
│ │ │
│ │ ├── convenio/
│ │ │ ├── domain/
│ │ │ ├── application/
│ │ │ ├── infrastructure/
│ │ │ └── interfaces/
│ │ │
│ │ ├── servico/
│ │ │ ├── domain/
│ │ │ ├── application/
│ │ │ ├── infrastructure/
│ │ │ └── interfaces/
│ │ │
│ │ ├── webhook/
│ │ │ ├── domain/ # Entidade WebhookReprocessado
│ │ │ ├── application/
│ │ │ │ └── use-cases/ # ReenvioWebhook, ConsultaProtocolos
│ │ │ ├── infrastructure/
│ │ │ └── interfaces/
│ │ │
│ │ └── shared/ # Código comum a todos os módulos
│ │ ├── errors/ # Erros customizados
│ │ ├── utils/ # Helpers
│ │ └── types/ # Tipos globais
│ │
│ ├── infrastructure/ # Serviços técnicos globais
│ │ ├── database/ # Config global do Sequelize
│ │ ├── cache/ # Config Redis
│ │ └── config/ # dotenv e variáveis de ambiente
│ │
│ └── main.ts # Entry point Express
│
├── test/ # Testes unitários e integração
│
├── docker-compose.yml
├── Dockerfile
├── .eslintrc.json
├── .prettierrc
├── jest.config.js
├── tsconfig.json
├── package.json
├── .env.example
└── README.md
