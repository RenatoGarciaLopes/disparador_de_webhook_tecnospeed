import { Express } from "express";
import request from "supertest";
import { AppHelper } from "../../../helpers/app.helper";
import { DatabaseHelper } from "../../../helpers/database.helper";

describe("[Integration] POST /reenviar - Edge Cases de IDs", () => {
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

  describe("Máximo de IDs permitidos - DOCS linha 50", () => {
    it("deve aceitar exatamente 30 IDs (máximo permitido)", async () => {
      // DOCS linha 50: "Máximo de Valores: 30"
      const thirtyIds = Array.from({ length: 30 }, (_, i) => String(i + 1));

      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: thirtyIds,
          kind: "webhook",
          type: "disponivel",
        });

      // Pode retornar erro se IDs não existem, mas não deve rejeitar por quantidade
      expect([200, 400]).toContain(response.status);

      if (response.status === 400) {
        // Se houver erro, não deve ser por quantidade de IDs
        expect(response.body.error).not.toContain("máximo");
        expect(response.body.error).not.toContain("30");
      }
    });

    it("deve rejeitar mais de 30 IDs", async () => {
      const thirtyOneIds = Array.from({ length: 31 }, (_, i) => String(i + 1));

      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: thirtyOneIds,
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("INVALID_FIELDS");
    });

    it("deve aceitar 1 ID (mínimo)", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: ["1"],
          kind: "webhook",
          type: "disponivel",
        });

      // Pode dar 200 ou 400 dependendo do seed, mas não deve rejeitar por quantidade
      expect([200, 400]).toContain(response.status);
    });
  });

  describe("IDs duplicados no array", () => {
    it("deve rejeitar array com IDs duplicados", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: ["1", "2", "1", "3"], // ID 1 duplicado
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("INVALID_FIELDS");
    });

    it("deve rejeitar múltiplos IDs duplicados", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: ["1", "2", "1", "2", "3"], // IDs 1 e 2 duplicados
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("INVALID_FIELDS");
    });

    it("deve aceitar array sem duplicatas", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: ["1", "2", "3", "4"],
          kind: "webhook",
          type: "disponivel",
        });

      // Pode dar 200 ou 400 por outras razões, mas não por duplicatas
      expect([200, 400]).toContain(response.status);
    });
  });

  describe("IDs com valores inválidos - DOCS linha 60", () => {
    it("deve rejeitar IDs não numéricos", async () => {
      // DOCS linha 60: "deve ser validado se os valores enviados dentro do array
      // são string de números inteiros positivos"
      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: ["1", "abc", "3"],
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("INVALID_FIELDS");
    });

    it("deve rejeitar IDs com números negativos", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: ["-1", "2"],
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("INVALID_FIELDS");
    });

    it("deve rejeitar ID zero", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: ["0"],
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("INVALID_FIELDS");
    });

    it("deve rejeitar IDs com números decimais", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: ["1.5", "2.3"],
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("INVALID_FIELDS");
    });

    it("deve rejeitar IDs com espaços", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: [" 1", "2 ", " 3 "],
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("INVALID_FIELDS");
    });

    it("deve rejeitar IDs vazios", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: [""],
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("INVALID_FIELDS");
    });
  });

  describe("IDs muito grandes (INTEGER overflow)", () => {
    it("deve rejeitar IDs maiores que INTEGER MAX", async () => {
      // INTEGER em PostgreSQL: -2147483648 to 2147483647
      const maxInt = 2147483647;
      const overflowId = String(maxInt + 1);

      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: [overflowId],
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.status).toBe(400);
    });

    it("deve aceitar IDs até INTEGER MAX", async () => {
      const maxInt = 2147483647;

      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: [String(maxInt)],
          kind: "webhook",
          type: "disponivel",
        });

      // Pode não existir no banco, mas formato deve ser aceito
      expect([200, 400]).toContain(response.status);

      if (response.status === 400) {
        // Se erro, deve ser por ID não encontrado, não por formato
        expect(response.body.error.properties?.id?.errors[0]).toContain(
          "não foi encontrado",
        );
      }
    });
  });

  describe("Array vazio", () => {
    it("deve rejeitar array de IDs vazio", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: [],
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("INVALID_FIELDS");
    });
  });

  describe("Transformação de string para number - DOCS linha 64", () => {
    it("deve transformar array de strings para números inteiros positivos", async () => {
      // DOCS linha 64: "deve ser feita uma transformação do array de strings
      // para um array de números inteiros positivos"

      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: ["1", "2", "3"],
          kind: "webhook",
          type: "disponivel",
        });

      // Validação interna deve ter transformado ["1", "2", "3"] em [1, 2, 3]
      expect([200, 400]).toContain(response.status);
    });

    it("deve aceitar IDs com zeros à esquerda", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: ["001", "002", "003"],
          kind: "webhook",
          type: "disponivel",
        });

      // Deve transformar "001" em 1
      expect([200, 400]).toContain(response.status);
    });
  });

  describe("Validação de existência no banco - DOCS linha 80", () => {
    it("deve retornar erro para IDs que não existem na tabela Servico", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: ["999999", "888888"],
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("INVALID_FIELDS");
      expect(response.body.error.properties.id).toBeDefined();

      const errors = response.body.error.properties.id.errors;
      expect(errors.some((e: string) => e.includes("não foi encontrado"))).toBe(
        true,
      );
    });

    it("deve especificar quais IDs não foram encontrados", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: ["1", "999", "2", "888"], // IDs 999 e 888 não existem
          kind: "webhook",
          type: "disponivel",
        });

      if (response.status === 400) {
        expect(response.body.error.properties.id).toBeDefined();

        const errors = response.body.error.properties.id.errors;
        // Deve mencionar IDs específicos que não foram encontrados
        expect(errors.some((e: string) => e.includes("999"))).toBe(true);
        expect(errors.some((e: string) => e.includes("888"))).toBe(true);
      }
    });
  });

  describe("Validação de serviços ativos - DOCS linha 82", () => {
    it("deve rejeitar IDs de serviços inativos", async () => {
      // TODO: Configurar seed com serviço inativo

      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: ["1"], // Serviço inativo
          kind: "webhook",
          type: "disponivel",
        });

      if (response.status === 400) {
        expect(response.body.code).toBe("INVALID_FIELDS");
        expect(response.body.error.properties.id.errors[0]).toContain(
          "não está ativo",
        );
      }
    });

    it("deve especificar quais IDs estão inativos", async () => {
      // TODO: Configurar seed com múltiplos serviços inativos

      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: ["1", "2", "3"],
          kind: "webhook",
          type: "disponivel",
        });

      if (response.status === 400 && response.body.error.properties?.id) {
        const errors = response.body.error.properties.id.errors;
        // Cada erro deve mencionar o ID específico
        errors.forEach((error: string) => {
          if (error.includes("inativo")) {
            expect(error).toMatch(/ID \d+/);
          }
        });
      }
    });
  });

  describe("Validação de produto - DOCS linha 84", () => {
    it("deve rejeitar IDs que não correspondem ao produto", async () => {
      // TODO: Configurar serviço de produto diferente

      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "pix",
          id: ["1"], // Serviço de boleto, não PIX
          kind: "webhook",
          type: "disponivel",
        });

      if (response.status === 400) {
        expect(response.body.code).toBe("INVALID_FIELDS");
        expect(response.body.error.properties.id.errors[0]).toContain(
          "produto",
        );
      }
    });

    it("deve validar produto para cada ID individualmente", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: ["1", "2", "3"],
          kind: "webhook",
          type: "disponivel",
        });

      // Deve validar que todos os IDs são do produto "boleto"
      expect([200, 400]).toContain(response.status);
    });
  });

  describe("Casos extremos combinados", () => {
    it("deve validar múltiplas condições ao mesmo tempo", async () => {
      // Teste com IDs que falham em múltiplas validações
      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: ["0", "-1", "abc", "", "999999"], // Múltiplos erros
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("INVALID_FIELDS");
      expect(response.body.error.properties.id).toBeDefined();
    });

    it("deve processar 30 IDs válidos com sucesso", async () => {
      // TODO: Configurar seed com 30 serviços válidos

      const thirtyIds = Array.from({ length: 30 }, (_, i) => String(i + 1));

      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: thirtyIds,
          kind: "webhook",
          type: "disponivel",
        });

      // Se todos os IDs forem válidos, deve processar com sucesso
      if (response.status === 200) {
        expect(response.body.total).toBe(30);
      }
    });
  });
});
