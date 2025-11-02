import { existsSync } from "node:fs";
import path from "node:path";

import { config as loadEnv } from "dotenv";

const envCandidates = [".env.e2e", ".env.test"];

const resolvedEnvPath = envCandidates
  .map((file) => path.resolve(process.cwd(), file))
  .find((fullPath) => existsSync(fullPath));

if (!resolvedEnvPath) {
  console.warn(
    "⚠️  Nenhum arquivo de ambiente (.env.e2e ou .env.test) foi encontrado. Certifique-se de criar um antes de rodar os testes E2E.",
  );
} else {
  loadEnv({ path: resolvedEnvPath });
  console.log(`📄 Variáveis de ambiente carregadas de: ${resolvedEnvPath}`);
}

require("tsconfig-paths/register");

export default async function globalSetup() {
  console.log("\n");
  console.log("=".repeat(60));
  console.log("🚀 SETUP DE TESTES E2E");
  console.log("=".repeat(60));
  console.log("");

  console.log(
    "➡️  Certifique-se de que o ambiente de testes E2E foi iniciado pelo script scripts/test-e2e.sh",
  );
  console.log("");
}
