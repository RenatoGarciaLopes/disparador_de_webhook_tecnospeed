"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("Convenio", [
      {
        numero_convenio: "CONV001",
        data_criacao: new Date(),
        conta_id: 1,
      },
      {
        numero_convenio: "CONV002",
        data_criacao: new Date(),
        conta_id: 1,
      },
      {
        numero_convenio: "CONV003",
        data_criacao: new Date(),
        conta_id: 2,
      },
      {
        numero_convenio: "CONV004",
        data_criacao: new Date(),
        conta_id: 2,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("Convenio", null, {});
  },
};
