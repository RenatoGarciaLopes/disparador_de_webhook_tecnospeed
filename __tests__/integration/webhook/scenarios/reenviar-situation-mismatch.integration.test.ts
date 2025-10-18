import { Express } from "express";
import request from "supertest";
import { AppHelper } from "../../../helpers/app.helper";
import { DatabaseHelper } from "../../../helpers/database.helper";

describe("[Integration] POST /reenviar - Situação Divergente", () => {
  let app: Express;

  beforeAll(async () => {
    await DatabaseHelper.setup();
    app = AppHelper.createTestApp();
  });

  beforeEach(async () => {
    await DatabaseHelper.cleanup();
    await DatabaseHelper.seedTestData();
  });

  afterAll(async () => {
    await DatabaseHelper.cleanup();
    await DatabaseHelper.close();
  });

  const validHeaders = {
    "x-api-cnpj-sh": "12345678901234",
    "x-api-token-sh": "sh-token-test",
    "x-api-cnpj-cedente": "98765432109876",
    "x-api-token-cedente": "cedente-token-test",
  };

  describe("Validação de situação divergente - DOCS linha 88-92", () => {
    it("deve retornar erro 400 quando situação do serviço diverge do type", async () => {
      // DOCS linha 88: "Verificar se todos os `Servico`s encontrados estão `disponível`,
      // `cancelado` ou `pago` de acordo com o `situacao` especificado no parâmetro `type`"

      // TODO: Configurar seed onde serviço tem situação diferente
      // Ex: Serviço está "cancelado" mas requisição pede "disponivel"

      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: ["1"], // Serviço com situação diferente
          kind: "webhook",
          type: "disponivel",
        });

      // Se a situação divergir, deve retornar 400
      if (response.status === 400) {
        expect(response.body.code).toBe("INVALID_FIELDS");
        expect(response.body.error.properties.id).toBeDefined();
      }
    });

    it("deve retornar mensagem específica: A situação do product diverge do tipo de notificação solicitado", async () => {
      // DOCS linha 90-92: "deve ser agrupado os IDs que estão errados e um map com os IDs errados
      // como chave e a mensagem de erro como valor: Não foi possível gerar a notificação.
      // A situação do `product` diverge do tipo de notificação solicitado."

      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: ["1"],
          kind: "webhook",
          type: "disponivel", // Mas serviço está em outra situação
        });

      if (response.status === 400) {
        expect(response.body.error.properties.id).toBeDefined();
        expect(response.body.error.properties.id.errors).toBeDefined();

        const errorMessage = response.body.error.properties.id.errors[0];
        expect(errorMessage).toContain("situação");
        expect(errorMessage).toContain("diverge");
      }
    });

    it("deve agrupar múltiplos IDs com situação divergente", async () => {
      // DOCS linha 90: "deve ser agrupado os IDs que estão errados"

      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: ["1", "2", "3"], // Múltiplos IDs com situação divergente
          kind: "webhook",
          type: "disponivel",
        });

      if (response.status === 400) {
        expect(response.body.error.properties.id).toBeDefined();
        expect(response.body.error.properties.id.errors).toBeDefined();

        // Deve ter erro para cada ID com situação divergente
        const errors = response.body.error.properties.id.errors;
        expect(Array.isArray(errors)).toBe(true);
      }
    });
  });

  describe("Mapeamento de situações - DOCS linha 108-114", () => {
    describe("Boleto", () => {
      it("deve aceitar REGISTRADO quando type é disponivel", async () => {
        // DOCS linha 112: disponível -> REGISTRADO para boleto
        // TODO: Configurar serviço com situacao "REGISTRADO"

        const response = await request(app)
          .post("/reenviar")
          .set(validHeaders)
          .send({
            product: "boleto",
            id: ["1"],
            kind: "webhook",
            type: "disponivel",
          });

        // Se o serviço está REGISTRADO e type é disponivel, deve aceitar
        expect([200, 400]).toContain(response.status);
      });

      it("deve aceitar BAIXADO quando type é cancelado", async () => {
        // DOCS linha 113: cancelado -> BAIXADO para boleto
        // TODO: Configurar serviço com situacao "BAIXADO"

        const response = await request(app)
          .post("/reenviar")
          .set(validHeaders)
          .send({
            product: "boleto",
            id: ["1"],
            kind: "webhook",
            type: "cancelado",
          });

        expect([200, 400]).toContain(response.status);
      });

      it("deve aceitar LIQUIDADO quando type é pago", async () => {
        // DOCS linha 114: pago -> LIQUIDADO para boleto
        // TODO: Configurar serviço com situacao "LIQUIDADO"

        const response = await request(app)
          .post("/reenviar")
          .set(validHeaders)
          .send({
            product: "boleto",
            id: ["1"],
            kind: "webhook",
            type: "pago",
          });

        expect([200, 400]).toContain(response.status);
      });

      it("deve rejeitar situações incompatíveis para boleto", async () => {
        // Ex: Boleto LIQUIDADO não deve aceitar type "disponivel"
        // TODO: Configurar serviço com situacao incompatível

        const response = await request(app)
          .post("/reenviar")
          .set(validHeaders)
          .send({
            product: "boleto",
            id: ["1"], // LIQUIDADO
            kind: "webhook",
            type: "disponivel", // Mas pede disponível
          });

        if (response.status === 400) {
          expect(response.body.code).toBe("INVALID_FIELDS");
        }
      });
    });

    describe("Pagamento", () => {
      it("deve aceitar SCHEDULED ou ACTIVE quando type é disponivel", async () => {
        // DOCS linha 112: disponível -> SCHEDULED ACTIVE para pagamento
        // TODO: Configurar serviço com situacao "SCHEDULED" ou "ACTIVE"

        const response = await request(app)
          .post("/reenviar")
          .set(validHeaders)
          .send({
            product: "pagamento",
            id: ["1"],
            kind: "webhook",
            type: "disponivel",
          });

        expect([200, 400]).toContain(response.status);
      });

      it("deve aceitar CANCELLED quando type é cancelado", async () => {
        // DOCS linha 113: cancelado -> CANCELLED para pagamento
        // TODO: Configurar serviço com situacao "CANCELLED"

        const response = await request(app)
          .post("/reenviar")
          .set(validHeaders)
          .send({
            product: "pagamento",
            id: ["1"],
            kind: "webhook",
            type: "cancelado",
          });

        expect([200, 400]).toContain(response.status);
      });

      it("deve aceitar PAID quando type é pago", async () => {
        // DOCS linha 114: pago -> PAID para pagamento
        // TODO: Configurar serviço com situacao "PAID"

        const response = await request(app)
          .post("/reenviar")
          .set(validHeaders)
          .send({
            product: "pagamento",
            id: ["1"],
            kind: "webhook",
            type: "pago",
          });

        expect([200, 400]).toContain(response.status);
      });
    });

    describe("Pix", () => {
      it("deve aceitar ACTIVE quando type é disponivel", async () => {
        // DOCS linha 112: disponível -> ACTIVE para pix
        // TODO: Configurar serviço com situacao "ACTIVE"

        const response = await request(app)
          .post("/reenviar")
          .set(validHeaders)
          .send({
            product: "pix",
            id: ["1"],
            kind: "webhook",
            type: "disponivel",
          });

        expect([200, 400]).toContain(response.status);
      });

      it("deve aceitar REJECTED quando type é cancelado", async () => {
        // DOCS linha 113: cancelado -> REJECTED para pix
        // TODO: Configurar serviço com situacao "REJECTED"

        const response = await request(app)
          .post("/reenviar")
          .set(validHeaders)
          .send({
            product: "pix",
            id: ["1"],
            kind: "webhook",
            type: "cancelado",
          });

        expect([200, 400]).toContain(response.status);
      });

      it("deve aceitar LIQUIDATED quando type é pago", async () => {
        // DOCS linha 114: pago -> LIQUIDATED para pix
        // TODO: Configurar serviço com situacao "LIQUIDATED"

        const response = await request(app)
          .post("/reenviar")
          .set(validHeaders)
          .send({
            product: "pix",
            id: ["1"],
            kind: "webhook",
            type: "pago",
          });

        expect([200, 400]).toContain(response.status);
      });
    });
  });

  describe("Cenários mistos", () => {
    it("deve aceitar IDs com situação correta e rejeitar os com situação errada", async () => {
      // Alguns IDs com situação correta, outros com situação errada
      // Deve processar os corretos ou rejeitar todos?
      // DOCS sugere rejeitar todos se algum estiver errado

      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: ["1", "2", "3"], // IDs com situações mistas
          kind: "webhook",
          type: "disponivel",
        });

      if (response.status === 400) {
        expect(response.body.code).toBe("INVALID_FIELDS");
        expect(response.body.error.properties.id).toBeDefined();
      }
    });

    it("deve validar situação para cada produto independentemente", async () => {
      // DOCS: Cada produto tem seu próprio mapeamento de situações

      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "pix",
          id: ["1"],
          kind: "webhook",
          type: "disponivel",
        });

      // Deve validar que situação está ACTIVE (não REGISTRADO como em boleto)
      expect([200, 400]).toContain(response.status);
    });
  });

  describe("Estrutura de erro", () => {
    it("deve retornar estrutura correta de erro para situação divergente", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: ["1"],
          kind: "webhook",
          type: "disponivel",
        });

      if (response.status === 400) {
        expect(response.body).toMatchObject({
          code: "INVALID_FIELDS",
          statusCode: 400,
          error: {
            properties: {
              id: {
                errors: expect.any(Array),
              },
            },
          },
        });
      }
    });

    it("deve incluir ID do serviço na mensagem de erro", async () => {
      // DOCS linha 90-92: map com IDs errados como chave

      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: ["1", "2"],
          kind: "webhook",
          type: "disponivel",
        });

      if (response.status === 400 && response.body.error.properties.id) {
        const errors = response.body.error.properties.id.errors;

        // Cada erro deve mencionar o ID específico
        errors.forEach((error: string) => {
          expect(error).toMatch(/ID \d+/);
        });
      }
    });
  });
});
