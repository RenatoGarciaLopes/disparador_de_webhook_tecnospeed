"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("SoftwareHouse", [
      // SH para BOLETO (ativo)
      {
        id: 1,
        cnpj: "61.199.921/0001-10",
        token: "AbC123defGHI456jklMNOpqrSTU789vwXYZ0abc4", // 40 chars, A-Z a-z 0-9
        status: "ativo",
        data_criacao: new Date(),
      },
      // SH para PIX (inativo)
      {
        id: 2,
        cnpj: "33.517.684/0001-52",
        token: "q1W2e3R4t5Y6u7I8o9P0a1S2d3F4g5H6j7K8l9M0", // 40 chars, A-Z a-z 0-9
        status: "inativo",
        data_criacao: new Date(),
      },
      // SH para PAGAMENTOS (inativo)
      {
        id: 3,
        cnpj: "74.718.190/0001-13",
        token: "Z9y8X7w6V5u4T3s2R1q0P9o8N7m6B5v4C3x2D1e0", // 40 chars, A-Z a-z 0-9
        status: "inativo",
        data_criacao: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("SoftwareHouse", null, {});
  },
};
