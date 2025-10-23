import { sequelize } from "@/sequelize";
/**
 * Helper executado antes de cada teste
 * Limpa todas as tabelas para garantir isolamento
 */
beforeEach(async () => {
  await sequelize.truncate({
    cascade: true,
    restartIdentity: true,
  });
});
