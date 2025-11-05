#!/bin/bash

# Script para executar testes de integração
# Este script garante que o ambiente de teste está rodando antes de executar os testes

set -e

echo "🧪 Preparando ambiente de testes de integração..."
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Verificar se docker está rodando
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}❌ Docker não está rodando${NC}"
  echo "Por favor, inicie o Docker e tente novamente"
  exit 1
fi

echo -e "${GREEN}✅ Docker está rodando${NC}"

# 1.1 Carregar variáveis do .env.test para interpolação do docker compose
if [ -f .env.test ]; then
  export $(grep -v '^#' .env.test | xargs)
else
  echo -e "${RED}❌ Arquivo .env.test não encontrado${NC}"
  exit 1
fi

# 2. Parar containers de teste anteriores (se existirem)
echo ""
echo "🛑 Parando containers de teste anteriores..."
docker compose --env-file .env.test -f docker-compose.test.yml down -v 2>/dev/null || true

# 3. Subir containers de teste
echo ""
echo "🚀 Subindo containers de teste (PostgreSQL e Redis)..."
docker compose --env-file .env.test -f docker-compose.test.yml up -d

# 4. Aguardar containers ficarem saudáveis (healthy)
echo ""
echo "⏳ Aguardando containers ficarem prontos..."

# Variáveis já carregadas acima

# Aguardar PostgreSQL
echo -n "   PostgreSQL: "
for i in $(seq 1 30); do
  if docker exec disparador-wh-db-test pg_isready -U "$DB_USERNAME" -d "$DB_DATABASE" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Pronto${NC}"
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "${RED}❌ Timeout${NC}"
    docker compose -f docker-compose.test.yml logs db-test
    docker compose -f docker-compose.test.yml down -v
    exit 1
  fi
  sleep 1
done

# Aguardar Redis
echo -n "   Redis: "
for i in $(seq 1 30); do
  if docker exec disparador-wh-redis-test redis-cli -a "$REDIS_PASSWORD" ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Pronto${NC}"
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "${RED}❌ Timeout${NC}"
    docker compose -f docker-compose.test.yml logs redis-test
    docker compose -f docker-compose.test.yml down -v
    exit 1
  fi
  sleep 1
done

# 5. Executar testes
echo ""
echo "🧪 Executando testes de integração..."
echo ""

# Exportar variáveis de ambiente de teste
export NODE_ENV=test

# Executar jest com arquivo de config de integração
npx cross-env NODE_ENV=test jest --config ./jest.integration.config.ts --runInBand --env-file=.env.test --detectOpenHandles "$@"

TEST_EXIT_CODE=$?

# 6. Parar containers de teste
echo ""
echo "🛑 Parando containers de teste..."
docker compose -f docker-compose.test.yml down -v

# 7. Resultado final
echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ Todos os testes de integração passaram!${NC}"
else
  echo -e "${RED}❌ Alguns testes falharam${NC}"
  exit $TEST_EXIT_CODE
fi

