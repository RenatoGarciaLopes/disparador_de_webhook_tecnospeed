import { WebhookReprocessado } from "@/sequelize/models/webhookreprocessado.model";
import {
  CreateWebhookReprocessadoDTO,
  WebhookReprocessadoRepository,
} from "./WebhookReprocessadoRepository";

jest.mock("@/sequelize/models/webhookreprocessado.model");

describe("[Repository] WebhookReprocessadoRepository", () => {
  let repository: WebhookReprocessadoRepository;

  beforeEach(() => {
    repository = new WebhookReprocessadoRepository();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("create", () => {
    it("deve criar registro com todos campos do DTO", async () => {
      // DOCS linhas 270, 301-303: "deve ser salvo o objeto no banco de dados na tabela `WebhookReprocessado` como JSON através da coluna `data`"
      const mockDTO: CreateWebhookReprocessadoDTO = {
        data: {
          kind: "webhook",
          method: "POST",
          url: "https://webhook.site/test",
          headers: { "Content-Type": "application/json" },
          body: {
            tipoWH: "",
            dataHoraEnvio: "01/01/2025 10:00:00",
            CpfCnpjCedente: "12345678000100",
            titulo: {
              situacao: "REGISTRADO",
              idintegracao: "uuid-123",
              TituloNossoNumero: "",
              TituloMovimentos: {},
            },
          },
        },
        cedente_id: 1,
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: ["1", "2", "3"],
        product: "BOLETO",
      };

      const mockWebhookReprocessado = {
        dataValues: {
          id: 1,
          ...mockDTO,
        },
      } as unknown as WebhookReprocessado;

      jest
        .spyOn(WebhookReprocessado, "create")
        .mockResolvedValue(mockWebhookReprocessado);

      const result = await repository.create(mockDTO);

      expect(WebhookReprocessado.create).toHaveBeenCalledWith(mockDTO);
      expect(result).toBe(mockWebhookReprocessado);
    });

    it("deve salvar data como JSON contendo o payload", async () => {
      // DOCS linha 270: "Então deve ser salvo o objeto no banco de dados na tabela `WebhookReprocessado` como JSON através da coluna `data`"
      const mockDTO: CreateWebhookReprocessadoDTO = {
        data: {
          kind: "webhook",
          method: "POST",
          url: "https://webhook.site/pix",
          headers: {},
          body: {
            type: "",
            companyId: "1",
            event: "ACTIVE",
            transactionId: "uuid-pix-123",
            tags: ["1", "pix", "2025"],
            id: { pixId: "10" },
          },
        },
        cedente_id: 5,
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: ["10"],
        product: "PIX",
      };

      const mockResult = {
        dataValues: mockDTO,
      } as unknown as WebhookReprocessado;

      jest.spyOn(WebhookReprocessado, "create").mockResolvedValue(mockResult);

      await repository.create(mockDTO);

      expect(WebhookReprocessado.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            kind: "webhook",
            method: "POST",
            url: expect.any(String),
            headers: expect.any(Object),
            body: expect.any(Object),
          }),
        }),
      );
    });

    it("deve salvar cedente_id, kind, type, servico_id array, product", async () => {
      const mockDTO: CreateWebhookReprocessadoDTO = {
        data: {
          kind: "webhook",
          method: "POST",
          url: "",
          headers: {},
          body: {},
        },
        cedente_id: 42,
        kind: "webhook",
        type: "CANCELADO",
        servico_id: ["5", "6", "7"],
        product: "PAGAMENTO",
      };

      const mockResult = {
        dataValues: mockDTO,
      } as unknown as WebhookReprocessado;

      jest.spyOn(WebhookReprocessado, "create").mockResolvedValue(mockResult);

      await repository.create(mockDTO);

      expect(WebhookReprocessado.create).toHaveBeenCalledWith({
        data: expect.any(Object),
        cedente_id: 42,
        kind: "webhook",
        type: "CANCELADO",
        servico_id: ["5", "6", "7"],
        product: "PAGAMENTO",
      });
    });

    it("deve chamar WebhookReprocessado.create", async () => {
      const mockDTO: CreateWebhookReprocessadoDTO = {
        data: {
          kind: "webhook",
          method: "POST",
          url: "",
          headers: {},
          body: {},
        },
        cedente_id: 1,
        kind: "webhook",
        type: "PAGO",
        servico_id: ["1"],
        product: "BOLETO",
      };

      const mockResult = {} as WebhookReprocessado;

      const createSpy = jest
        .spyOn(WebhookReprocessado, "create")
        .mockResolvedValue(mockResult);

      await repository.create(mockDTO);

      expect(createSpy).toHaveBeenCalledWith(mockDTO);
      expect(createSpy).toHaveBeenCalledTimes(1);
    });

    it("deve retornar registro criado", async () => {
      const mockDTO: CreateWebhookReprocessadoDTO = {
        data: {
          kind: "webhook",
          method: "POST",
          url: "",
          headers: {},
          body: {},
        },
        cedente_id: 1,
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: ["1"],
        product: "BOLETO",
      };

      const mockCreatedRecord = {
        dataValues: {
          id: 999,
          ...mockDTO,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      } as unknown as WebhookReprocessado;

      jest
        .spyOn(WebhookReprocessado, "create")
        .mockResolvedValue(mockCreatedRecord);

      const result = await repository.create(mockDTO);

      expect(result).toBe(mockCreatedRecord);
      expect(result.dataValues.id).toBe(999);
    });

    it("deve validar DTO completo para BOLETO", async () => {
      const mockDTO: CreateWebhookReprocessadoDTO = {
        data: {
          kind: "webhook",
          method: "POST",
          url: "https://webhook.site/boleto",
          headers: { "Content-Type": "application/json" },
          body: {
            tipoWH: "",
            dataHoraEnvio: "01/01/2025 10:00:00",
            CpfCnpjCedente: "12345678000100",
            titulo: {
              situacao: "REGISTRADO",
              idintegracao: "uuid-boleto",
              TituloNossoNumero: "",
              TituloMovimentos: {},
            },
          },
        },
        cedente_id: 1,
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: ["1", "2"],
        product: "BOLETO",
      };

      const mockResult = {
        dataValues: mockDTO,
      } as unknown as WebhookReprocessado;

      jest.spyOn(WebhookReprocessado, "create").mockResolvedValue(mockResult);

      const result = await repository.create(mockDTO);

      expect(result.dataValues).toMatchObject(mockDTO);
    });

    it("deve validar DTO completo para PIX", async () => {
      const mockDTO: CreateWebhookReprocessadoDTO = {
        data: {
          kind: "webhook",
          method: "POST",
          url: "https://webhook.site/pix",
          headers: { Authorization: "Bearer token" },
          body: {
            type: "",
            companyId: "1",
            event: "ACTIVE",
            transactionId: "uuid-pix",
            tags: ["1", "pix", "2025"],
            id: { pixId: "5" },
          },
        },
        cedente_id: 1,
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: ["5"],
        product: "PIX",
      };

      const mockResult = {
        dataValues: mockDTO,
      } as unknown as WebhookReprocessado;

      jest.spyOn(WebhookReprocessado, "create").mockResolvedValue(mockResult);

      const result = await repository.create(mockDTO);

      expect(result.dataValues).toMatchObject(mockDTO);
    });

    it("deve validar DTO completo para PAGAMENTOS", async () => {
      const mockDTO: CreateWebhookReprocessadoDTO = {
        data: {
          kind: "webhook",
          method: "POST",
          url: "https://webhook.site/pagamentos",
          headers: {},
          body: {
            status: "SCHEDULED ACTIVE",
            uniqueid: "uuid-pagamento",
            createdAt: "2025-01-01T10:00:00Z",
            ocurrences: [],
            accountHash: "1",
            occurrences: [],
          },
        },
        cedente_id: 1,
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: ["7", "8"],
        product: "PAGAMENTOS",
      };

      const mockResult = {
        dataValues: mockDTO,
      } as unknown as WebhookReprocessado;

      jest.spyOn(WebhookReprocessado, "create").mockResolvedValue(mockResult);

      const result = await repository.create(mockDTO);

      expect(result.dataValues).toMatchObject(mockDTO);
    });

    it("deve criar com múltiplos servico_id", async () => {
      // DOCS linha 297: exemplo com múltiplos serviços
      const mockDTO: CreateWebhookReprocessadoDTO = {
        data: {
          kind: "webhook",
          method: "POST",
          url: "",
          headers: {},
          body: {},
        },
        cedente_id: 1,
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: ["1", "2", "3", "4"], // Múltiplos serviços
        product: "BOLETO",
      };

      const mockResult = {
        dataValues: mockDTO,
      } as unknown as WebhookReprocessado;

      jest.spyOn(WebhookReprocessado, "create").mockResolvedValue(mockResult);

      const result = await repository.create(mockDTO);

      expect(result.dataValues.servico_id).toEqual(["1", "2", "3", "4"]);
    });

    it("deve criar com diferentes tipos (type)", async () => {
      const types = ["DISPONIVEL", "CANCELADO", "PAGO"];

      for (const type of types) {
        const mockDTO: CreateWebhookReprocessadoDTO = {
          data: {
            kind: "webhook",
            method: "POST",
            url: "",
            headers: {},
            body: {},
          },
          cedente_id: 1,
          kind: "webhook",
          type: type as "DISPONIVEL" | "CANCELADO" | "PAGO",
          servico_id: ["1"],
          product: "BOLETO",
        };

        const mockResult = {
          dataValues: mockDTO,
        } as unknown as WebhookReprocessado;

        jest.spyOn(WebhookReprocessado, "create").mockResolvedValue(mockResult);

        const result = await repository.create(mockDTO);

        expect(result.dataValues.type).toBe(type);
      }
    });

    it("deve criar com diferentes produtos", async () => {
      const products = ["BOLETO", "PIX", "PAGAMENTOS"];

      for (const product of products) {
        const mockDTO: CreateWebhookReprocessadoDTO = {
          data: {
            kind: "webhook",
            method: "POST",
            url: "",
            headers: {},
            body: {},
          },
          cedente_id: 1,
          kind: "webhook",
          type: "DISPONIVEL",
          servico_id: ["1"],
          product: product as "BOLETO" | "PIX" | "PAGAMENTOS",
        };

        const mockResult = {
          dataValues: mockDTO,
        } as unknown as WebhookReprocessado;

        jest.spyOn(WebhookReprocessado, "create").mockResolvedValue(mockResult);

        const result = await repository.create(mockDTO);

        expect(result.dataValues.product).toBe(product);
      }
    });
  });

  describe("Edge cases", () => {
    it("deve lidar com erro do banco de dados", async () => {
      const mockDTO: CreateWebhookReprocessadoDTO = {
        data: {
          kind: "webhook",
          method: "POST",
          url: "",
          headers: {},
          body: {},
        },
        cedente_id: 1,
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: ["1"],
        product: "BOLETO",
      };

      jest
        .spyOn(WebhookReprocessado, "create")
        .mockRejectedValue(new Error("Database constraint violation"));

      await expect(repository.create(mockDTO)).rejects.toThrow(
        "Database constraint violation",
      );
    });

    it("deve lidar com data vazio", async () => {
      const mockDTO: CreateWebhookReprocessadoDTO = {
        data: {},
        cedente_id: 1,
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: ["1"],
        product: "BOLETO",
      };

      const mockResult = {
        dataValues: mockDTO,
      } as unknown as WebhookReprocessado;

      jest.spyOn(WebhookReprocessado, "create").mockResolvedValue(mockResult);

      const result = await repository.create(mockDTO);

      expect(result.dataValues.data).toEqual({});
    });

    it("deve lidar com array vazio de servico_id", async () => {
      const mockDTO: CreateWebhookReprocessadoDTO = {
        data: {
          kind: "webhook",
          method: "POST",
          url: "",
          headers: {},
          body: {},
        },
        cedente_id: 1,
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: [],
        product: "BOLETO",
      };

      const mockResult = {
        dataValues: mockDTO,
      } as unknown as WebhookReprocessado;

      jest.spyOn(WebhookReprocessado, "create").mockResolvedValue(mockResult);

      const result = await repository.create(mockDTO);

      expect(result.dataValues.servico_id).toEqual([]);
    });
  });
});
