"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Convenio", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      cnpj: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      token: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      configuracao_notificacao: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("SoftwareHouse");
  },
};
