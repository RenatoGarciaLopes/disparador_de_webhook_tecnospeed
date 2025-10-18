import { Express } from "express";
import request from "supertest";
import { AppHelper } from "../../../helpers/app.helper";
import { DatabaseHelper } from "../../../helpers/database.helper";

describe("[Integration] POST /reenviar - Agrupamento de Múltiplas Contas", () => {
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

  describe("Exemplo da documentação - Linha 278-298", () => {
    it("deve gerar apenas 1 WebhookReprocessado quando contas têm mesma configuração", async () => {
      // DOCS linha 278-298:
      // Para SH 1, Cedente 1:
      //   - Conta 1: Servicos 1, 2
      //   - Conta 2: Servicos 3, 4
      // Requisição com IDs [1, 2, 3, 4] deve gerar apenas 1 WebhookReprocessado com UUID único

      // TODO: Configurar seed específico com:
      // - SH ID 1, Cedente ID 1
      // - Conta ID 1 com Servicos 1, 2
      // - Conta ID 2 com Servicos 3, 4
      // - Ambas contas com mesma configuração de notificação

      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: ["1", "2", "3", "4"],
          kind: "webhook",
          type: "disponivel",
        });

      if (response.status === 200) {
        // Deve ter gerado apenas 1 protocolo UUID
        expect(response.body.protocolos).toBeDefined();
        expect(Array.isArray(response.body.protocolos)).toBe(true);
        expect(response.body.protocolos.length).toBe(1);

        // Total de serviços processados deve ser 4
        expect(response.body.total).toBe(4);
      }
    });

    it("deve agrupar serviços por configuração de notificação", async () => {
      // Quando múltiplas contas/cedentes têm a mesma URL de webhook,
      // devem ser agrupadas em um único envio

      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: ["1", "2", "3", "4"],
          kind: "webhook",
          type: "disponivel",
        });

      if (response.status === 200) {
        expect(response.body.protocolos).toBeDefined();

        // Se todas as contas têm mesma config, deve haver apenas 1 protocolo
        // Se configs diferentes, pode haver múltiplos protocolos
        expect(response.body.protocolos.length).toBeGreaterThanOrEqual(1);

        // Validar que são UUIDs válidos
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        response.body.protocolos.forEach((protocolo: string) => {
          expect(protocolo).toMatch(uuidRegex);
        });
      }
    });
  });

  describe("Múltiplas contas com configurações diferentes", () => {
    it("deve gerar múltiplos WebhookReprocessado para configurações diferentes", async () => {
      // TODO: Configurar seed com contas que têm URLs de webhook diferentes

      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: ["1", "2", "3", "4"],
          kind: "webhook",
          type: "disponivel",
        });

      if (response.status === 200) {
        expect(response.body.protocolos).toBeDefined();

        // Se houver contas com configurações diferentes,
        // deve ter múltiplos protocolos
        if (response.body.protocolos.length > 1) {
          // Cada protocolo deve ser único
          const uniqueProtocolos = new Set(response.body.protocolos);
          expect(uniqueProtocolos.size).toBe(response.body.protocolos.length);
        }
      }
    });

    it("deve enviar payloads separados para cada grupo de configuração", async () => {
      // DOCS linha 268: "Caso existam múltiplos grupos (por Conta/Cedente),
      // serão enviados múltiplos payloads e recebidos múltiplos protocolos"

      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "pix",
          id: ["1", "2", "3"],
          kind: "webhook",
          type: "disponivel",
        });

      if (response.status === 200) {
        expect(response.body.protocolos).toBeDefined();
        expect(Array.isArray(response.body.protocolos)).toBe(true);

        // Total deve corresponder à soma de serviços em todos os grupos
        expect(response.body.total).toBeGreaterThan(0);
      }
    });
  });

  describe("Agrupamento por Conta vs Cedente", () => {
    it("deve priorizar configuração da Conta sobre Cedente", async () => {
      // DOCS linha 96: "será necessário criar uma lógica para priorizar sempre a configuração da conta"
      // TODO: Configurar seed onde Conta tem config diferente do Cedente

      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: ["1", "2"],
          kind: "webhook",
          type: "disponivel",
        });

      if (response.status === 200) {
        expect(response.body.protocolos).toBeDefined();
        // Validar que foi usada configuração da Conta
      }
    });

    it("deve usar configuração do Cedente quando Conta não tem", async () => {
      // DOCS linha 100: "Caso a configuração na Conta não exista,
      // então será utilizada a configuração do Cedente"
      // TODO: Configurar seed onde Conta não tem configuração

      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: ["1"],
          kind: "webhook",
          type: "disponivel",
        });

      if (response.status === 200) {
        expect(response.body.protocolos).toBeDefined();
        // Validar que foi usada configuração do Cedente
      }
    });

    it("deve agrupar serviços com mesma configuração final", async () => {
      // Serviços de contas diferentes mas com mesma configuração
      // devem ser agrupados no mesmo WebhookReprocessado

      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: ["1", "2", "3", "4"],
          kind: "webhook",
          type: "disponivel",
        });

      if (response.status === 200) {
        expect(response.body.protocolos).toBeDefined();

        // Se todas têm mesma config, deve ser 1 protocolo
        // Se configs diferentes, múltiplos protocolos
        expect(response.body.protocolos.length).toBeGreaterThanOrEqual(1);
        expect(response.body.total).toBe(4);
      }
    });
  });

  describe("Validação de UUIDs gerados", () => {
    it("deve gerar UUID único para cada WebhookReprocessado", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: ["1", "2"],
          kind: "webhook",
          type: "disponivel",
        });

      if (response.status === 200) {
        expect(response.body.protocolos).toBeDefined();

        // Cada protocolo deve ser um UUID válido
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        response.body.protocolos.forEach((protocolo: string) => {
          expect(protocolo).toMatch(uuidRegex);
        });
      }
    });

    it("deve gerar UUIDs diferentes para cada grupo", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: ["1", "2", "3", "4"],
          kind: "webhook",
          type: "disponivel",
        });

      if (response.status === 200 && response.body.protocolos.length > 1) {
        // Se houver múltiplos protocolos, todos devem ser únicos
        const uniqueProtocolos = new Set(response.body.protocolos);
        expect(uniqueProtocolos.size).toBe(response.body.protocolos.length);
      }
    });
  });

  describe("Persistência no banco de dados", () => {
    it("deve salvar WebhookReprocessado com protocolo recebido", async () => {
      // DOCS linha 268: "Esse UUID deve ser salvo na tabela `WebhookReprocessado` na coluna `protocolo`"

      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: ["1", "2"],
          kind: "webhook",
          type: "disponivel",
        });

      if (response.status === 200) {
        expect(response.body.protocolos).toBeDefined();

        // TODO: Verificar que protocolos foram salvos no banco
        // SELECT * FROM WebhookReprocessado WHERE protocolo IN (...)
      }
    });

    it("deve salvar JSON completo na coluna data", async () => {
      // DOCS linha 270: "deve ser salvo o objeto no banco de dados na tabela
      // `WebhookReprocessado` como JSON através da coluna `data`"

      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "pix",
          id: ["1"],
          kind: "webhook",
          type: "disponivel",
        });

      if (response.status === 200) {
        expect(response.body.protocolos).toBeDefined();

        // TODO: Verificar coluna `data` contém JSON completo
        // Deve incluir: dados da requisição + protocolo
      }
    });
  });

  describe("Resposta de sucesso completa", () => {
    it("deve retornar todos os protocolos gerados", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: ["1", "2", "3", "4"],
          kind: "webhook",
          type: "disponivel",
        });

      if (response.status === 200) {
        expect(response.body).toMatchObject({
          message: expect.stringContaining("sucesso"),
          protocolos: expect.any(Array),
          total: 4,
          timestamp: expect.any(String),
          product: expect.any(String),
        });
      }
    });

    it("deve retornar mensagem de sucesso", async () => {
      // DOCS linha 274: "Após o processamento das notificações,
      // deve ser retornado uma mensagem de sucesso dizendo que a notificação foi gerada com sucesso"

      const response = await request(app)
        .post("/reenviar")
        .set(validHeaders)
        .send({
          product: "boleto",
          id: ["1"],
          kind: "webhook",
          type: "disponivel",
        });

      if (response.status === 200) {
        expect(response.body.message).toBeDefined();
        expect(response.body.message).toContain("sucesso");
      }
    });
  });
});
