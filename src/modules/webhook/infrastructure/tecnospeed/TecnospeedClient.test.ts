import { ErrorResponse } from "@/shared/errors/ErrorResponse";
import axios, { AxiosError } from "axios";
import { BoletoPresenter } from "../../application/presenters/boleto";
import { PagamentoPresenter } from "../../application/presenters/pagamento";
import { PixPresenter } from "../../application/presenters/pix";
import { TecnospeedClient } from "./TecnospeedClient";

jest.mock("axios");

describe("[Tecnospeed] TecnospeedClient", () => {
  let client: TecnospeedClient;
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  beforeEach(() => {
    client = new TecnospeedClient();
    jest.clearAllMocks();
  });

  describe("reenviarWebhook()", () => {
    describe("Casos de sucesso", () => {
      it("deve enviar webhook com sucesso e retornar protocolo", async () => {
        const mockResponse = {
          data: { protocolo: "ABC123" },
        };

        mockedAxios.post.mockResolvedValue(mockResponse);

        const payload = {
          notifications: [
            {
              idIntegracao: "123",
              dataHoraSituacao: "2024-01-01T10:00:00",
              situacao: "pago",
            } as BoletoPresenter,
          ],
        };

        const result = await client.reenviarWebhook(payload);

        expect(result).toEqual({ protocolo: "ABC123" });
      });

      it("deve fazer POST para a URL correta", async () => {
        const mockResponse = {
          data: { protocolo: "XYZ789" },
        };

        mockedAxios.post.mockResolvedValue(mockResponse);

        const payload = {
          notifications: [],
        };

        await client.reenviarWebhook(payload);

        expect(mockedAxios.post).toHaveBeenCalledWith(
          "https://plug-retry.free.beeceptor.com/",
          payload,
        );
      });

      it("deve enviar payload com notifications de boleto", async () => {
        const mockResponse = {
          data: { protocolo: "BOLETO123" },
        };

        mockedAxios.post.mockResolvedValue(mockResponse);

        const payload = {
          notifications: [
            {
              idIntegracao: "B1",
              dataHoraSituacao: "2024-01-01T10:00:00",
              situacao: "pago",
            } as BoletoPresenter,
            {
              idIntegracao: "B2",
              dataHoraSituacao: "2024-01-02T10:00:00",
              situacao: "cancelado",
            } as BoletoPresenter,
          ],
        };

        const result = await client.reenviarWebhook(payload);

        expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.any(String),
          payload,
        );
        expect(result).toEqual({ protocolo: "BOLETO123" });
      });

      it("deve enviar payload com notifications de pagamento", async () => {
        const mockResponse = {
          data: { protocolo: "PAG123" },
        };

        mockedAxios.post.mockResolvedValue(mockResponse);

        const payload = {
          notifications: [
            {
              idIntegracao: "P1",
              dataHoraSituacao: "2024-01-01T10:00:00",
              situacao: "pago",
            } as PagamentoPresenter,
          ],
        };

        await client.reenviarWebhook(payload);

        expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.any(String),
          payload,
        );
      });

      it("deve enviar payload com notifications de pix", async () => {
        const mockResponse = {
          data: { protocolo: "PIX123" },
        };

        mockedAxios.post.mockResolvedValue(mockResponse);

        const payload = {
          notifications: [
            {
              idIntegracao: "PIX1",
              dataHoraSituacao: "2024-01-01T10:00:00",
              situacao: "disponivel",
            } as PixPresenter,
          ],
        };

        await client.reenviarWebhook(payload);

        expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.any(String),
          payload,
        );
      });

      it("deve enviar payload com múltiplas notifications mistas", async () => {
        const mockResponse = {
          data: { protocolo: "MIXED123" },
        };

        mockedAxios.post.mockResolvedValue(mockResponse);

        const payload = {
          notifications: [
            {
              idIntegracao: "B1",
              dataHoraSituacao: "2024-01-01T10:00:00",
              situacao: "pago",
            } as BoletoPresenter,
            {
              idIntegracao: "P1",
              dataHoraSituacao: "2024-01-02T10:00:00",
              situacao: "pago",
            } as PagamentoPresenter,
            {
              idIntegracao: "PIX1",
              dataHoraSituacao: "2024-01-03T10:00:00",
              situacao: "disponivel",
            } as PixPresenter,
          ],
        };

        const result = await client.reenviarWebhook(payload);

        expect(result).toEqual({ protocolo: "MIXED123" });
      });
    });

    describe("Tratamento de erro 400 (AxiosError)", () => {
      it("deve lançar ErrorResponse com mensagem específica para erro 400", async () => {
        mockedAxios.post.mockImplementation(() => {
          const error = new AxiosError(
            "Request failed with status code 400",
            "ERR_BAD_REQUEST",
          );
          error.response = {
            status: 400,
            statusText: "Bad Request",
            data: { detail: "Payload inválido" },
            headers: {},
            config: {} as any,
          };
          return Promise.reject(error);
        });

        const payload = {
          notifications: [],
        };

        try {
          await client.reenviarWebhook(payload);
        } catch (error) {
          expect(error).toBeInstanceOf(ErrorResponse);
          const errorResponse = error as ErrorResponse;
          expect(errorResponse.code).toBe("INTERNAL_SERVER_ERROR");
          expect(errorResponse.statusCode).toBe(500);
        }
      });
    });

    describe("Tratamento de outros erros AxiosError", () => {
      it("deve lançar ErrorResponse genérico para erro 500", async () => {
        const axiosError = new AxiosError(
          "Request failed with status code 500",
          "ERR_INTERNAL_SERVER_ERROR",
          undefined,
          undefined,
          {
            status: 500,
            statusText: "Internal Server Error",
            data: { error: "Internal Server Error" },
            headers: {},
            config: {} as any,
          },
        );

        mockedAxios.post.mockRejectedValue(axiosError);

        const payload = {
          notifications: [],
        };

        try {
          await client.reenviarWebhook(payload);
        } catch (error) {
          expect(error).toBeInstanceOf(ErrorResponse);
          const errorResponse = error as ErrorResponse;
          expect(errorResponse.code).toBe("INTERNAL_SERVER_ERROR");
          expect(errorResponse.statusCode).toBe(500);
          expect(errorResponse.error.errors).toContain(
            "Erro ao reenviar webhook",
          );
        }
      });

      it("deve lançar ErrorResponse genérico para erro 404", async () => {
        const axiosError = new AxiosError(
          "Request failed with status code 404",
          "ERR_NOT_FOUND",
          undefined,
          undefined,
          {
            status: 404,
            statusText: "Not Found",
            data: { error: "Not Found" },
            headers: {},
            config: {} as any,
          },
        );

        mockedAxios.post.mockRejectedValue(axiosError);

        const payload = {
          notifications: [],
        };

        try {
          await client.reenviarWebhook(payload);
        } catch (error) {
          expect(error).toBeInstanceOf(ErrorResponse);
          const errorResponse = error as ErrorResponse;
          expect(errorResponse.error.errors).toContain(
            "Erro ao reenviar webhook",
          );
        }
      });

      it("deve lançar ErrorResponse genérico para erro de rede sem response", async () => {
        const axiosError = new AxiosError("Network Error", "ERR_NETWORK");

        mockedAxios.post.mockRejectedValue(axiosError);

        const payload = {
          notifications: [],
        };

        try {
          await client.reenviarWebhook(payload);
        } catch (error) {
          expect(error).toBeInstanceOf(ErrorResponse);
          const errorResponse = error as ErrorResponse;
          expect(errorResponse.error.errors).toContain(
            "Erro ao reenviar webhook",
          );
        }
      });
    });

    describe("Tratamento de erros genéricos (não AxiosError)", () => {
      it("deve lançar ErrorResponse para erro genérico", async () => {
        const genericError = new Error("Unexpected error");

        mockedAxios.post.mockRejectedValue(genericError);

        const payload = {
          notifications: [],
        };

        try {
          await client.reenviarWebhook(payload);
        } catch (error) {
          expect(error).toBeInstanceOf(ErrorResponse);
          const errorResponse = error as ErrorResponse;
          expect(errorResponse.code).toBe("INTERNAL_SERVER_ERROR");
          expect(errorResponse.statusCode).toBe(500);
          expect(errorResponse.error.errors).toContain(
            "Erro ao reenviar webhook",
          );
        }
      });

      it("deve lançar ErrorResponse para TypeError", async () => {
        const typeError = new TypeError("Cannot read property");

        mockedAxios.post.mockRejectedValue(typeError);

        const payload = {
          notifications: [],
        };

        try {
          await client.reenviarWebhook(payload);
        } catch (error) {
          expect(error).toBeInstanceOf(ErrorResponse);
        }
      });
    });

    describe("Integração com axios", () => {
      it("deve usar axios.post", async () => {
        const mockResponse = {
          data: { protocolo: "TEST123" },
        };

        mockedAxios.post.mockResolvedValue(mockResponse);

        const payload = {
          notifications: [],
        };

        await client.reenviarWebhook(payload);

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      });
    });
  });
});
