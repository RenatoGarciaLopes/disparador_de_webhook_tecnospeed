#!/usr/bin/env sh
set -e

echo "📦 Rodando migrations..."
npx sequelize-cli db:migrate

echo "🌱 Verificando seeds pendentes..."
PENDING_SEEDS=$(npx sequelize-cli db:seed:status | grep "down" | wc -l)

if [ "$PENDING_SEEDS" -gt 0 ]; then
  echo "⚡ Encontrados $PENDING_SEEDS seeds pendentes. Aplicando..."
  npx sequelize-cli db:seed:all
else
  echo "✅ Nenhum seed novo encontrado, pulando etapa de seeds."
fi

echo "🚀 Iniciando aplicação..."
npm run dev
