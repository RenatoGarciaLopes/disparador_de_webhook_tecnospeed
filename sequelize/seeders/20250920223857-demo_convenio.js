"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("Convenio", [
      // Convenio para BOLETO (conta_id: 1)
      {
        id: 1,
        numero_convenio: "102938",
        data_criacao: new Date(),
        conta_id: 1,
      },
      // Convenio para PIX (conta_id: 2)
      {
        id: 2,
        numero_convenio: "564738",
        data_criacao: new Date(),
        conta_id: 2,
      },
      // Convenio para PAGAMENTOS (conta_id: 3)
      {
        id: 3,
        numero_convenio: "918273",
        data_criacao: new Date(),
        conta_id: 3,
      },
      // Convenio extra para BOLETO (conta_id: 4)
      {
        id: 4,
        numero_convenio: "4455667",
        data_criacao: new Date(),
        conta_id: 4,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("Convenio", null, {});
  },
};
