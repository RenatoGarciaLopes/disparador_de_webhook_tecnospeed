# 🧪 COMO EXECUTAR TESTES DE INTEGRAÇÃO

## ⚡ Método Rápido (3 comandos)

```bash
# 1. Criar .env.test
cat > .env.test << 'ENVEOF'
NODE_ENV=test
PORT=3001

DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=test_disparador_wh
DB_PASSWORD=test_disparador_wh
DB_DATABASE=disparador_wh_test

REDIS_HOST=localhost
REDIS_PORT=6380
REDIS_PASSWORD=test_disparador_wh

TECNOSPEED_BASE_URL=https://tecno.free.beeceptor.com
ENVEOF

# 2. Instalar dependências (se ainda não fez)
npm install

# 3. Executar testes!
./scripts/test-integration.sh
```

---

## 📊 Resultado Esperado

```text
🧪 Executando testes de integração...

 PASS  __tests__/integration/database/connection.test.ts
 PASS  __tests__/integration/cache/connection.test.ts
 PASS  __tests__/integration/auth/auth-dto.test.ts
 ...

Test Suites: 17 passed, 17 total
Tests:       65 passed, 65 total
Time:        8.532s

✅ Todos os testes de integração passaram!
```

---

## 📝 Outros Comandos

```bash
# Apenas unitários
npm run test:unit

# Apenas integração
npm run test:integration

# Apenas E2E
npm run test:e2e
```
