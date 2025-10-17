"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("WebhookReprocessado", "product", {
      type: Sequelize.ENUM("BOLETO", "PAGAMENTO", "PIX"),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("WebhookReprocessado", "product");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_WebhookReprocessado_product";',
    );
  },
};
