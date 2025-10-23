import { config as configEnv } from "dotenv";
configEnv({ path: ".env.test" });

require("tsconfig-paths/register");

import { TestDataHelper } from "../helpers/test-data.helper";

export default async function globalSetup() {
  console.log("\n");
  console.log("=".repeat(60));
  console.log("🧪 SETUP DE TESTES DE INTEGRAÇÃO");
  console.log("=".repeat(60));
  console.log("");

  try {
    console.log("📦 Inicializando helper de dados de teste...");
    await TestDataHelper.initialize();

    console.log("   ✅ Helper inicializado com sucesso");

    console.log("");
    console.log("=".repeat(60));
    console.log("✅ SETUP COMPLETO - Ambiente de teste pronto!");
    console.log("=".repeat(60));
    console.log("");
  } catch (error) {
    console.error("\n❌ ERRO NO SETUP:");
    console.error(error);
    console.error("\n⚠️  Verifique:");
    console.error("   1. Docker está rodando?");
    console.error(
      "   2. Containers de teste estão rodando? (docker-compose.test.yml)",
    );
    console.error("   3. Arquivo .env.test existe e está configurado?");
    console.error("");
    throw error;
  }
}
