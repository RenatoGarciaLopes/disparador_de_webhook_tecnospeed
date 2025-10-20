import { WebhookReprocessado } from "@/sequelize/models/webhookreprocessado.model";
import { WebhookReprocessadoRepository } from "./WebhookReprocessadoRepository";

jest.mock("@/sequelize/models/webhookreprocessado.model");

describe("[WEBHOOK] WebhookReprocessadoRepository", () => {
  let repository: WebhookReprocessadoRepository;

  beforeEach(() => {
    repository = new WebhookReprocessadoRepository();
    jest.clearAllMocks();
  });

  describe("create()", () => {
    describe("Casos de sucesso", () => {
      it("deve criar webhook reprocessado e retornar JSON", async () => {
        const webhookData = {
          data: { test: "data" },
          cedente_id: 1,
          kind: "webhook",
          type: "pago",
          servico_id: ["1", "2", "3"],
          product: "BOLETO",
          protocolo: "ABC123",
        };

        const mockCreated = {
          id: "uuid-123",
          ...webhookData,
          data_criacao: new Date(),
          toJSON: jest.fn().mockReturnValue({
            id: "uuid-123",
            ...webhookData,
            data_criacao: expect.any(Date),
          }),
        };

        (WebhookReprocessado.create as jest.Mock).mockResolvedValue(
          mockCreated,
        );

        const result = await repository.create(webhookData);

        expect(result).toHaveProperty("id");
        expect(result.cedente_id).toBe(1);
      });

      it("deve chamar create com os parâmetros corretos", async () => {
        const webhookData = {
          data: { payload: "test" },
          cedente_id: 5,
          kind: "webhook",
          type: "cancelado",
          servico_id: ["10"],
          product: "PIX",
          protocolo: "XYZ789",
        };

        const mockCreated = {
          id: "uuid-456",
          ...webhookData,
          toJSON: jest.fn().mockReturnValue(webhookData),
        };

        (WebhookReprocessado.create as jest.Mock).mockResolvedValue(
          mockCreated,
        );

        await repository.create(webhookData);

        expect(WebhookReprocessado.create).toHaveBeenCalledWith(webhookData);
      });

      it("deve retornar toJSON do modelo criado", async () => {
        const webhookData = {
          data: { info: "test" },
          cedente_id: 1,
          kind: "webhook",
          type: "pago",
          servico_id: ["1"],
          product: "BOLETO",
          protocolo: "PROTO123",
        };

        const mockJSON = {
          id: "uuid-789",
          ...webhookData,
          data_criacao: new Date(),
        };

        const mockCreated = {
          toJSON: jest.fn().mockReturnValue(mockJSON),
        };

        (WebhookReprocessado.create as jest.Mock).mockResolvedValue(
          mockCreated,
        );

        const result = await repository.create(webhookData);

        expect(mockCreated.toJSON).toHaveBeenCalled();
        expect(result).toEqual(mockJSON);
      });

      it("deve criar com diferentes produtos", async () => {
        const produtos = ["BOLETO", "PAGAMENTO", "PIX"];

        for (const product of produtos) {
          jest.clearAllMocks();

          const webhookData = {
            data: {},
            cedente_id: 1,
            kind: "webhook",
            type: "pago",
            servico_id: ["1"],
            product,
            protocolo: `PROTO-${product}`,
          };

          const mockCreated = {
            toJSON: jest.fn().mockReturnValue(webhookData),
          };

          (WebhookReprocessado.create as jest.Mock).mockResolvedValue(
            mockCreated,
          );

          await repository.create(webhookData);

          expect(WebhookReprocessado.create).toHaveBeenCalledWith(
            expect.objectContaining({ product }),
          );
        }
      });

      it("deve criar com diferentes types", async () => {
        const types = ["pago", "cancelado", "disponivel"];

        for (const type of types) {
          jest.clearAllMocks();

          const webhookData = {
            data: {},
            cedente_id: 1,
            kind: "webhook",
            type,
            servico_id: ["1"],
            product: "BOLETO",
            protocolo: `PROTO-${type}`,
          };

          const mockCreated = {
            toJSON: jest.fn().mockReturnValue(webhookData),
          };

          (WebhookReprocessado.create as jest.Mock).mockResolvedValue(
            mockCreated,
          );

          await repository.create(webhookData);

          expect(WebhookReprocessado.create).toHaveBeenCalledWith(
            expect.objectContaining({ type }),
          );
        }
      });

      it("deve criar com múltiplos servico_id", async () => {
        const webhookData = {
          data: {},
          cedente_id: 1,
          kind: "webhook",
          type: "pago",
          servico_id: ["1", "2", "3", "4", "5"],
          product: "BOLETO",
          protocolo: "MULTI123",
        };

        const mockCreated = {
          toJSON: jest.fn().mockReturnValue(webhookData),
        };

        (WebhookReprocessado.create as jest.Mock).mockResolvedValue(
          mockCreated,
        );

        const result = await repository.create(webhookData);

        expect(result.servico_id).toHaveLength(5);
      });

      it("deve criar com data complexa no campo data", async () => {
        const webhookData = {
          data: {
            notifications: [
              { id: 1, status: "pago" },
              { id: 2, status: "cancelado" },
            ],
            metadata: {
              timestamp: "2024-01-01",
              source: "api",
            },
          },
          cedente_id: 1,
          kind: "webhook",
          type: "pago",
          servico_id: ["1"],
          product: "BOLETO",
          protocolo: "COMPLEX123",
        };

        const mockCreated = {
          toJSON: jest.fn().mockReturnValue(webhookData),
        };

        (WebhookReprocessado.create as jest.Mock).mockResolvedValue(
          mockCreated,
        );

        const result = await repository.create(webhookData);

        expect(result.data).toEqual(webhookData.data);
      });
    });

    describe("Tratamento de erros", () => {
      it("deve propagar erro do Sequelize", async () => {
        const dbError = new Error("Database connection error");
        (WebhookReprocessado.create as jest.Mock).mockRejectedValue(dbError);

        const webhookData = {
          data: {},
          cedente_id: 1,
          kind: "webhook",
          type: "pago",
          servico_id: ["1"],
          product: "BOLETO",
          protocolo: "ERROR123",
        };

        await expect(repository.create(webhookData)).rejects.toThrow(
          "Database connection error",
        );
      });
    });
  });
});
