"use strict";

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert("Servico", [
      // Servico para BOLETO (inativo) - convenio_id: 1
      {
        id: 1,
        produto: "BOLETO",
        data_criacao: new Date(),
        convenio_id: 1,
        status: "inativo",
        situacao: "disponivel",
      },
      // Servico para PIX (ativo) - convenio_id: 2
      {
        id: 2,
        produto: "PIX",
        data_criacao: new Date(),
        convenio_id: 2,
        status: "ativo",
        situacao: "disponivel",
      },
      // Servico para PAGAMENTO (inativo) - convenio_id: 3
      {
        id: 3,
        produto: "PAGAMENTO",
        data_criacao: new Date(),
        convenio_id: 3,
        status: "inativo",
        situacao: "disponivel",
      },
      // Novos serviços para fluxo BOLETO
      // Servico 4 → conta 1 (convenio 1)
      {
        id: 4,
        produto: "BOLETO",
        data_criacao: new Date(),
        convenio_id: 1,
        status: "ativo",
        situacao: "disponivel",
      },
      // Servico 5 → conta 4 (convenio 4)
      {
        id: 5,
        produto: "BOLETO",
        data_criacao: new Date(),
        convenio_id: 4,
        status: "ativo",
        situacao: "disponivel",
      },
      // Servico 6 → conta 4 (convenio 4)
      {
        id: 6,
        produto: "BOLETO",
        data_criacao: new Date(),
        convenio_id: 4,
        status: "ativo",
        situacao: "disponivel",
      },
      // Servico 7 → conta 2 (convenio 2)
      {
        id: 7,
        produto: "BOLETO",
        data_criacao: new Date(),
        convenio_id: 2,
        status: "ativo",
        situacao: "disponivel",
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete("Servico", null, {});
  },
};
