"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Servico", "produto", {
      type: Sequelize.ENUM("BOLETO", "PAGAMENTO", "PIX"),
      allowNull: false,
    });

    await queryInterface.addColumn("Servico", "situacao", {
      type: Sequelize.ENUM("disponivel", "cancelado", "pago"),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove columns first, then drop enum types for Postgres
    await queryInterface.removeColumn("Servico", "situacao");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Servico_situacao";',
    );

    await queryInterface.removeColumn("Servico", "produto");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Servico_produto";',
    );
  },
};
