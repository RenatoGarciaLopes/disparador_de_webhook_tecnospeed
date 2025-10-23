import { TestDataHelper } from "../helpers/test-data.helper";

export default async function globalTeardown() {
  console.log("\n");
  console.log("=".repeat(60));
  console.log("🧹 TEARDOWN DE TESTES DE INTEGRAÇÃO");
  console.log("=".repeat(60));
  console.log("");

  try {
    console.log("📦 Limpando dados de teste...");
    await TestDataHelper.cleanup();

    console.log("   ✅ Dados limpos com sucesso");

    console.log("");
    console.log("=".repeat(60));
    console.log("✅ TEARDOWN COMPLETO - Ambiente limpo!");
    console.log("=".repeat(60));
    console.log("");
  } catch (error) {
    console.error("\n❌ ERRO NO TEARDOWN:");
    console.error(error);
    console.error("");
  }
}
