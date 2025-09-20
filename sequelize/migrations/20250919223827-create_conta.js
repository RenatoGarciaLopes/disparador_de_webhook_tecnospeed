"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Conta", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      data_criacao: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      produto: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      banco_codigo: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      cedente_id: {
        type: Sequelize.INTEGER,
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
    await queryInterface.dropTable("Conta");
  },
};
