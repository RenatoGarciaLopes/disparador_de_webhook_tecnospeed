"use strict";

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert(
      "Cedente",
      [
        {
          data_criacao: new Date(),
          cnpj: "12345678000199",
          token: "token-exemplo-123",
          softwarehouse_id: 1,
          status: "ativo",
          configuracao_notificacao: JSON.stringify({
            url: "https://webhook.site/15bfbb63-2ee1-449d-8d6f-56204678ca95", //https://webhook.site/#!/view/15bfbb63-2ee1-449d-8d6f-56204678ca95
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
          data_criacao: new Date(),
          cnpj: "98765432000100",
          token: "token-exemplo-456",
          softwarehouse_id: 2,
          status: "inativo",
          configuracao_notificacao: null,
        },
        {
          data_criacao: new Date(),
          cnpj: "11223344000155",
          token: "token-exemplo-789",
          softwarehouse_id: 3,
          status: "ativo",
          configuracao_notificacao: JSON.stringify({
            url: "https://webhook.site/e425877c-b95a-41ca-8d91-695e928da4c6", // https://webhook.site/#!/view/e425877c-b95a-41ca-8d91-695e928da4c6
            email: "notifica@empresa3.com",
            tipos: {
              alerta: true,
              erro: false,
            },
            cancelado: false,
            pago: true,
            disponivel: true,
            header: true,
            header_campo: "Authorization",
            header_valor: "Bearer xyz123",
            headers_adicionais: [],
          }),
        },
        {
          data_criacao: new Date(),
          cnpj: "22334455000166",
          token: "token-exemplo-101",
          softwarehouse_id: 4,
          status: "ativo",
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
