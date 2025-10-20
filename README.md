# Disparador de Webhook TecnSpeed

Sistema disparador de webhooks para TecnSpeed desenvolvido em TypeScript com Node.js.

## 🚀 Como Executar o Projeto

### Pré-requisitos

- Docker e Docker Compose instalados
- Node.js 22+ (para desenvolvimento local)
- npm

### 1. Configuração das Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com base no arquivo `.env.example`.

### 2. Execução com Docker Compose

#### Desenvolvimento

```bash
# Construir e iniciar todos os serviços
docker compose up --build

# Executar em background
docker compose up -d --build

# Parar os serviços
docker compose down
```

#### Produção

```bash
# Definir ambiente de produção
export NODE_ENV=production
# ou
export NODE_ENV=development
# ou configurar no arquivo .env

# Construir e iniciar
docker compose up --build
```

### 3. Desenvolvimento Local (sem Docker)

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Executar em modo produção
npm run build
npm start
```

## 📁 Estrutura do Projeto

Segue o padrão de pastas Clean Architecture (DDD).
Informe-se no arquivo `DEFINITIONS.md` e `FOLDERS.md` para mais detalhes.

## 🐳 Serviços Docker

O projeto utiliza os seguintes serviços:

- **app**: Aplicação Node.js/TypeScript
- **db**: PostgreSQL 17
- **redis**: Redis 7

### Portas Padrão

- **Aplicação**: 3000
- **PostgreSQL**: 5432
- **Redis**: 6379

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Executa em modo desenvolvimento com hot reload
npm run build        # Compila o TypeScript
npm run start        # Executa a aplicação compilada
npm run test         # Executa os testes
npm run lint         # Verifica o código com ESLint
npm run lint:fix     # Corrige problemas de linting
npm run format       # Formata o código com Prettier
```
