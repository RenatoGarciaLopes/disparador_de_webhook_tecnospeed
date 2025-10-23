"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("WebhookReprocessado", "protocolo", {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("WebhookReprocessado", "protocolo");
  },
};
