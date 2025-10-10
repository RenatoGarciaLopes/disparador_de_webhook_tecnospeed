"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("Conta", [
      {
        id: 1,
        data_criacao: new Date("2025-09-10"),
        produto: "pix",
        banco_codigo: "001",
        cedente_id: 1,
        status: "inactive",
        configuracao_notificacao: JSON.stringify({
          url: "https://webhook.site/8d0dbbe2-f74e-4271-91c0-765868dd27c9", //https://webhook.site/#!/view/8d0dbbe2-f74e-4271-91c0-765868dd27c9
          email: null,
          tipos: {},
          cancelado: false,
          pago: false,
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
        data_criacao: new Date("2025-09-09"),
        produto: "boleto",
        banco_codigo: "341",
        cedente_id: 2,
        status: "active",
        configuracao_notificacao: JSON.stringify({
          url: "https://webhook.site/6d1a99ca-0768-4a04-9c44-b1ef2c570378", //https://webhook.site/#!/view/6d1a99ca-0768-4a04-9c44-b1ef2c570378
          email: null,
          tipos: {},
          cancelado: false,
          pago: true,
          disponivel: false,
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
        id: 3,
        data_criacao: new Date("2025-09-08"),
        produto: "pagamento",
        banco_codigo: "001",
        cedente_id: 3,
        status: "inactive",
        configuracao_notificacao: JSON.stringify({
          url: "https://webhook.site/365f8f0f-bd65-4e4c-a5c5-6c62c7c0a082", //https://webhook.site/#!/view/365f8f0f-bd65-4e4c-a5c5-6c62c7c0a082
          email: null,
          tipos: {},
          cancelado: true,
          pago: false,
          disponivel: false,
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
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("Conta", null, {});
  },
};
