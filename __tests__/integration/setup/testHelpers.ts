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

/**
 * Helper para criar dados de teste comuns
 * Pode ser usado nos testes quando necessário
 */
export const createTestData = async () => {
  // Função auxiliar para criar estrutura básica de dados
  // Pode ser expandida conforme necessário
};
