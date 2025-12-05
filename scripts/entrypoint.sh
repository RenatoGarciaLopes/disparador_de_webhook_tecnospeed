#!/usr/bin/env sh
set -e

echo "📦 Rodando migrations..."
npx sequelize-cli db:migrate

echo "🚀 Iniciando aplicação..."
npm run dev
