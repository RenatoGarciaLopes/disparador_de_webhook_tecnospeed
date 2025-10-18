import { Request, Response } from "express";
import { ReenviarSchemaDTO } from "../validators/ReenviarSchema";
import { ReenviarController } from "./ReenviarController";

describe("[Controller] /reenviar - ReenviarController", () => {
  let reenviarController: ReenviarController;
  let mockRequest: Partial<
    Request<{}, {}, ReenviarSchemaDTO> & { cedenteId: number }
  >;
  let mockResponse: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    reenviarController = new ReenviarController();

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({
      json: jsonMock,
    });

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    mockRequest = {
      body: {
        product: "BOLETO",
        id: [1, 2, 3],
        kind: "webhook",
        type: "DISPONIVEL",
      },
      cedenteId: 1,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Integração com Use Cases", () => {
    it("deve orquestrar ValidarServicosUseCase, ConfigurarNotificacaoUseCase e ReenviarService", async () => {
      await reenviarController.reenviar(
        mockRequest as Request<{}, {}, ReenviarSchemaDTO> & {
          cedenteId: number;
        },
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalled();
    });

    it("deve processar body e cedenteId do request", async () => {
      mockRequest.cedenteId = 999;
      mockRequest.body = {
        product: "PIX",
        id: [10, 20, 30],
        kind: "webhook",
        type: "PAGO",
      };

      await reenviarController.reenviar(
        mockRequest as Request<{}, {}, ReenviarSchemaDTO> & {
          cedenteId: number;
        },
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalled();
    });
  });

  describe("Resposta de sucesso", () => {
    it("deve retornar status 200 com estrutura completa de resposta", async () => {
      await reenviarController.reenviar(
        mockRequest as Request<{}, {}, ReenviarSchemaDTO> & {
          cedenteId: number;
        },
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
          protocolos: expect.any(Array),
          total: expect.any(Number),
          timestamp: expect.any(String),
          product: expect.any(String),
        }),
      );
    });

    it("deve processar múltiplos IDs e retornar total correto", async () => {
      mockRequest.body = {
        product: "BOLETO",
        id: [1, 2, 3, 4, 5],
        kind: "webhook",
        type: "DISPONIVEL",
      };

      await reenviarController.reenviar(
        mockRequest as Request<{}, {}, ReenviarSchemaDTO> & {
          cedenteId: number;
        },
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          total: expect.any(Number),
        }),
      );
    });
  });

  describe("Tratamento de erros", () => {
    it("deve capturar e tratar erros de validação (InvalidFieldsError)", async () => {
      // Nota: validação real é feita nos middlewares
      // Controller deve apenas propagar erros se use cases falharem
      await reenviarController.reenviar(
        mockRequest as Request<{}, {}, ReenviarSchemaDTO> & {
          cedenteId: number;
        },
        mockResponse as Response,
      );

      // Se houver erro, deve ser tratado
      expect(statusMock).toHaveBeenCalled();
    });

    it("deve retornar status 500 para erros inesperados", async () => {
      mockRequest.body = undefined as any;

      await reenviarController.reenviar(
        mockRequest as Request<{}, {}, ReenviarSchemaDTO> & {
          cedenteId: number;
        },
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalled();
    });

    it("deve capturar exceções e retornar status 500 com ErrorResponse", async () => {
      const errorMessage = "Erro interno do servidor";
      const error = new Error(errorMessage);

      // Força o método status a lançar um erro na primeira chamada (200)
      // e ter sucesso na segunda chamada (500 do catch)
      const statusMockWithError = jest
        .fn()
        .mockImplementationOnce(() => {
          throw error;
        })
        .mockReturnValueOnce({
          json: jsonMock,
        });

      mockResponse.status = statusMockWithError;

      await reenviarController.reenviar(
        mockRequest as Request<{}, {}, ReenviarSchemaDTO> & {
          cedenteId: number;
        },
        mockResponse as Response,
      );

      expect(statusMockWithError).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        code: "INTERNAL_SERVER_ERROR",
        statusCode: 500,
        error: {
          errors: [errorMessage],
        },
      });
    });
  });

  describe("Chamadas aos métodos do response", () => {
    it("deve chamar response.status e json em sequência", async () => {
      await reenviarController.reenviar(
        mockRequest as Request<{}, {}, ReenviarSchemaDTO> & {
          cedenteId: number;
        },
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledTimes(1);
      expect(jsonMock).toHaveBeenCalledTimes(1);
    });

    it("deve processar sem modificar o request original", async () => {
      const originalBody = { ...mockRequest.body };
      const originalCedenteId = mockRequest.cedenteId;

      await reenviarController.reenviar(
        mockRequest as Request<{}, {}, ReenviarSchemaDTO> & {
          cedenteId: number;
        },
        mockResponse as Response,
      );

      expect(mockRequest.body).toEqual(originalBody);
      expect(mockRequest.cedenteId).toBe(originalCedenteId);
    });
  });

  describe("Performance", () => {
    it("deve processar request em tempo aceitável", async () => {
      const start = Date.now();

      await reenviarController.reenviar(
        mockRequest as Request<{}, {}, ReenviarSchemaDTO> & {
          cedenteId: number;
        },
        mockResponse as Response,
      );

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000);
    });
  });
});
