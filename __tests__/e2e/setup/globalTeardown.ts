export default async function globalTeardown() {
  console.log("\n");
  console.log("=".repeat(60));
  console.log("🧹 TEARDOWN DE TESTES E2E");
  console.log("=".repeat(60));
  console.log("");

  console.log("✅ Nenhuma ação de teardown adicional foi definida.");
  console.log(
    "   Garanta que os containers foram finalizados pelo script scripts/test-e2e.sh.",
  );
  console.log("");
}
