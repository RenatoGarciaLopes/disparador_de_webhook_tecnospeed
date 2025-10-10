"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("WebhookReprocessado", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      data: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      data_criacao: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      cedente_id: {
        type: Sequelize.INTEGER,
        foreignKey: true,
        references: {
          model: "Cedente",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      kind: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      servico_id: {
        type: Sequelize.TEXT,
        allowNull: false,
        get() {
          const value = this.getDataValue("servico_id");
          try {
            return JSON.parse(value);
          } catch {
            return [];
          }
        },
        set(value) {
          this.setDataValue("servico_id", JSON.stringify(value));
        },
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("WebhookReprocessado");
  },
};
