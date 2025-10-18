import axios from "axios";
import {
  TechnospeedClient,
  TechnospeedClientError,
  TechnospeedPayload,
} from "./TechnospeedClient";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("[Service] TechnospeedClient", () => {
  let client: TechnospeedClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    mockAxiosInstance = {
      post: jest.fn(),
    };
    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    client = new TechnospeedClient();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Construtor", () => {
    it("deve criar instância com baseURL padrão", () => {
      const newClient = new TechnospeedClient();
      expect(newClient).toBeInstanceOf(TechnospeedClient);
    });

    it("deve criar instância com baseURL customizada", () => {
      const customURL = "https://custom-api.example.com";
      const newClient = new TechnospeedClient(customURL);
      expect(newClient).toBeInstanceOf(TechnospeedClient);
    });

    it("deve criar instância com timeout customizado", () => {
      const newClient = new TechnospeedClient(
        "https://plug-retry.free.beeceptor.com",
        10000,
      );
      expect(newClient).toBeInstanceOf(TechnospeedClient);
    });

    it("deve configurar axios com headers corretos", () => {
      new TechnospeedClient();
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      );
    });
  });

  describe("sendWebhook", () => {
    const mockPayload: TechnospeedPayload = {
      kind: "webhook",
      method: "POST",
      url: "https://webhook.site/test",
      headers: { "Content-Type": "application/json" },
      body: {
        tipoWH: "",
        dataHoraEnvio: "01/01/2025 10:00:00",
        CpfCnpjCedente: "12345678000100",
      },
    };

    it("deve enviar payload via POST para API", async () => {
      const mockResponse = {
        data: { protocolo: "123e4567-e89b-12d3-a456-426614174000" },
        status: 200,
      };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      await client.sendWebhook(mockPayload);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith("/", mockPayload);
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
    });

    it("deve retornar protocolo UUID da resposta", async () => {
      const expectedProtocolo = "123e4567-e89b-12d3-a456-426614174000";
      const mockResponse = {
        data: { protocolo: expectedProtocolo },
        status: 200,
      };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await client.sendWebhook(mockPayload);

      expect(result).toBe(expectedProtocolo);
    });

    it("deve incluir headers do payload no request", async () => {
      const payloadWithHeaders: TechnospeedPayload = {
        ...mockPayload,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token123",
        },
      };
      const mockResponse = {
        data: { protocolo: "123e4567-e89b-12d3-a456-426614174000" },
        status: 200,
      };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      await client.sendWebhook(payloadWithHeaders);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/",
        payloadWithHeaders,
      );
    });

    it("deve lançar erro se API retornar 400 (Bad Request)", async () => {
      const error = {
        response: {
          status: 400,
          data: { message: "Bad Request" },
        },
        isAxiosError: true,
      };
      mockAxiosInstance.post.mockRejectedValue(error);

      await expect(client.sendWebhook(mockPayload)).rejects.toThrow(
        TechnospeedClientError,
      );
    });

    it("deve lançar erro se API retornar 401 (Unauthorized)", async () => {
      const error = {
        response: {
          status: 401,
          data: { message: "Unauthorized" },
        },
        isAxiosError: true,
      };
      mockAxiosInstance.post.mockRejectedValue(error);

      await expect(client.sendWebhook(mockPayload)).rejects.toThrow(
        TechnospeedClientError,
      );
    });

    it("deve lançar erro se API retornar 500 (Internal Server Error)", async () => {
      const error = {
        response: {
          status: 500,
          data: { message: "Internal Server Error" },
        },
        isAxiosError: true,
      };
      mockAxiosInstance.post.mockRejectedValue(error);

      await expect(client.sendWebhook(mockPayload)).rejects.toThrow(
        TechnospeedClientError,
      );
    });

    it("deve lançar erro se timeout ocorrer", async () => {
      const timeoutError = {
        code: "ECONNABORTED",
        message: "timeout of 5000ms exceeded",
        isAxiosError: true,
      };
      mockAxiosInstance.post.mockRejectedValue(timeoutError);

      await expect(client.sendWebhook(mockPayload)).rejects.toThrow(
        TechnospeedClientError,
      );
    });

    it("deve lançar erro se resposta não tiver campo protocolo", async () => {
      const mockResponse = {
        data: { invalidField: "value" },
        status: 200,
      };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      await expect(client.sendWebhook(mockPayload)).rejects.toThrow();
    });

    it("deve lançar erro se resposta for vazia", async () => {
      const mockResponse = {
        data: {},
        status: 200,
      };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      await expect(client.sendWebhook(mockPayload)).rejects.toThrow();
    });

    it("deve lançar erro se resposta for null", async () => {
      const mockResponse = {
        data: null,
        status: 200,
      };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      await expect(client.sendWebhook(mockPayload)).rejects.toThrow();
    });
  });

  describe("Tratamento de erros", () => {
    const mockPayload: TechnospeedPayload = {
      kind: "webhook",
      method: "POST",
      url: "https://webhook.site/test",
      headers: {},
      body: {},
    };

    it("deve incluir statusCode no erro para erros HTTP", async () => {
      const error = {
        response: {
          status: 404,
          data: { message: "Not Found" },
        },
        isAxiosError: true,
      };
      mockAxiosInstance.post.mockRejectedValue(error);

      try {
        await client.sendWebhook(mockPayload);
        fail("Deveria ter lançado erro");
      } catch (e) {
        expect(e).toBeInstanceOf(TechnospeedClientError);
        expect((e as TechnospeedClientError).statusCode).toBe(404);
      }
    });

    it("deve preservar erro original", async () => {
      const originalError = new Error("Network error");
      mockAxiosInstance.post.mockRejectedValue(originalError);

      try {
        await client.sendWebhook(mockPayload);
        fail("Deveria ter lançado erro");
      } catch (e) {
        expect(e).toBeInstanceOf(TechnospeedClientError);
        expect((e as TechnospeedClientError).originalError).toBeDefined();
      }
    });

    it("deve tratar erro de conexão (ECONNREFUSED)", async () => {
      const connectionError = {
        code: "ECONNREFUSED",
        message: "Connection refused",
        isAxiosError: true,
      };
      mockAxiosInstance.post.mockRejectedValue(connectionError);

      await expect(client.sendWebhook(mockPayload)).rejects.toThrow(
        TechnospeedClientError,
      );
    });

    it("deve tratar erro de DNS (ENOTFOUND)", async () => {
      const dnsError = {
        code: "ENOTFOUND",
        message: "DNS lookup failed",
        isAxiosError: true,
      };
      mockAxiosInstance.post.mockRejectedValue(dnsError);

      await expect(client.sendWebhook(mockPayload)).rejects.toThrow(
        TechnospeedClientError,
      );
    });
  });

  describe("Validação de protocolo UUID", () => {
    const mockPayload: TechnospeedPayload = {
      kind: "webhook",
      method: "POST",
      url: "https://webhook.site/test",
      headers: {},
      body: {},
    };

    it("deve aceitar protocolo UUID v4 válido", async () => {
      const validUUID = "550e8400-e29b-41d4-a716-446655440000";
      const mockResponse = {
        data: { protocolo: validUUID },
        status: 200,
      };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await client.sendWebhook(mockPayload);
      expect(result).toBe(validUUID);
    });

    it("deve aceitar diferentes formatos de UUID", async () => {
      const uuidFormats = [
        "123e4567-e89b-12d3-a456-426614174000",
        "550e8400-e29b-41d4-a716-446655440000",
        "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      ];

      for (const uuid of uuidFormats) {
        const mockResponse = {
          data: { protocolo: uuid },
          status: 200,
        };
        mockAxiosInstance.post.mockResolvedValue(mockResponse);

        const result = await client.sendWebhook(mockPayload);
        expect(result).toBe(uuid);
      }
    });
  });
});
