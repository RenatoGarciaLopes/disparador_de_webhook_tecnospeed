"use strict";

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert(
      "Cedente",
      [
        {
          id: 1,
          data_criacao: new Date(),
          cnpj: "45723174000110",
          token: "A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0",
          softwarehouse_id: 1,
          status: "ativo",
          configuracao_notificacao: JSON.stringify({
            url: "https://webhook.site/15bfbb63-2ee1-449d-8d6f-56204678ca95",
            email: null,
            tipos: {},
            cancelado: true,
            pago: true,
            disponivel: true,
            header: false,
            ativado: true,
            header_campo: "",
            header_valor: "",
            headers_adicionais: [
              {
                "content-type": "application/json",
              },
            ],
          }),
        },
        {
          id: 2,
          data_criacao: new Date(),
          cnpj: "33198567000125",
          token: "Q1w2E3r4T5y6U7i8O9p0A1s2D3f4G5h6J7k8L9m0",
          softwarehouse_id: 2,
          status: "inativo",
          configuracao_notificacao: null,
        },
        {
          id: 3,
          data_criacao: new Date(),
          cnpj: "74910332000104",
          token: "N1m2B3v4C5x6Z7a8S9d0F1g2H3j4K5l6P7o8I9u0",
          softwarehouse_id: 3,
          status: "inativo",
          configuracao_notificacao: null,
        },
      ],
      {},
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("Cedente", null, {});
  },
};
