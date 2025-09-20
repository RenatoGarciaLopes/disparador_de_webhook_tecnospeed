"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("SoftwareHouse", [
      {
        cnpj: "61.199.921/0001-10",
        token: "7ReOxptmEzDGYynJomHXBm2s9rUdIYxuG5B9OvsHwByWhGzT",
        status: "active",
        data_criacao: new Date(),
      },
      {
        cnpj: "33.517.684/0001-52",
        token: "RrOpkXuO2fx6cMscFHE9n1qfzistSrSaLoYOTpU5IUf8XKsm",
        status: "active",
        data_criacao: new Date(),
      },
      {
        cnpj: "74.718.190/0001-13",
        token: "F3sxEVuwfuyFuXrd0BWm1uArTbqk4WgaJX8AyELWUU8DAmgd",
        status: "inactive",
        data_criacao: new Date(),
      },
      {
        cnpj: "96.270.053/0001-00",
        token: "Hzf6gqYZKQ5F0PALOsx7QnukjNmUf3Z8GF2RHVAeO1IGlL9X",
        status: "inactive",
        data_criacao: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("SoftwareHouse", null, {});
  },
};
