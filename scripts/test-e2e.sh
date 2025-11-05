#!/bin/bash

# Script para executar testes end-to-end (E2E)
# Ele garante que o ambiente de dependências esteja pronto antes de rodar os testes

set -e

echo "🧪 Preparando ambiente de testes E2E..."
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

ENV_FILE=".env.test"
COMPOSE_FILE="docker-compose.test.yml"
POSTGRES_CONTAINER="disparador-wh-db-test"
REDIS_CONTAINER="disparador-wh-redis-test"
POSTGRES_SERVICE="db-test"
REDIS_SERVICE="redis-test"

# 1. Verificar se docker está rodando
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}❌ Docker não está rodando${NC}"
  echo "Por favor, inicie o Docker e tente novamente"
  exit 1
fi

echo -e "${GREEN}✅ Docker está rodando${NC}"

# 1.1 Validar arquivo de variáveis de ambiente
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}❌ Arquivo $ENV_FILE não encontrado${NC}"
  echo "Crie o arquivo $ENV_FILE com as variáveis necessárias para o ambiente E2E"
  exit 1
fi

# 1.2 Carregar variáveis de ambiente
export $(grep -v '^#' "$ENV_FILE" | xargs)

# 2. Parar containers E2E anteriores (se existirem)
echo ""
echo "🛑 Parando containers E2E anteriores..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down -v 2>/dev/null || true

# 3. Subir containers necessários
echo ""
echo "🚀 Subindo containers E2E (PostgreSQL e Redis)..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d

# 4. Aguardar containers ficarem saudáveis
echo ""
echo "⏳ Aguardando containers ficarem prontos..."

# Aguardar PostgreSQL
echo -n "   PostgreSQL: "
for i in $(seq 1 45); do
  if docker exec "$POSTGRES_CONTAINER" pg_isready -U "$DB_USERNAME" -d "$DB_DATABASE" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Pronto${NC}"
    break
  fi
  if [ $i -eq 45 ]; then
    echo -e "${RED}❌ Timeout${NC}"
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs "$POSTGRES_SERVICE"
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down -v
    exit 1
  fi
  sleep 1
done

# Aguardar Redis
echo -n "   Redis: "
for i in $(seq 1 45); do
  if docker exec "$REDIS_CONTAINER" redis-cli -a "$REDIS_PASSWORD" ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Pronto${NC}"
    break
  fi
  if [ $i -eq 45 ]; then
    echo -e "${RED}❌ Timeout${NC}"
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs "$REDIS_SERVICE"
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down -v
    exit 1
  fi
  sleep 1
done

echo ""
echo "ℹ️  Inicie o servidor da aplicação apontando para o ambiente E2E, se necessário."
echo "   (Este script não sobe o servidor Node.js automaticamente.)"

# 5. Executar testes
echo ""
echo "🧪 Executando testes E2E..."
echo ""

export NODE_ENV=test

npx cross-env NODE_ENV=test jest --config ./jest.e2e.config.ts --runInBand --env-file="$ENV_FILE" --detectOpenHandles "$@"

TEST_EXIT_CODE=$?

# 6. Parar containers E2E
echo ""
echo "🛑 Parando containers E2E..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down -v

# 7. Resultado final
echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ Todos os testes E2E passaram!${NC}"
else
  echo -e "${RED}❌ Alguns testes E2E falharam${NC}"
  exit $TEST_EXIT_CODE
fi

