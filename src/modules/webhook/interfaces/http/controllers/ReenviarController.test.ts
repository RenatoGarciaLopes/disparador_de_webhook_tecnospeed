import { ReenviarService } from "@/modules/webhook/domain/services/ReenviarService";
import { ErrorResponse } from "@/shared/errors/ErrorResponse";
import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { Request, Response } from "express";
import { ReenviarController } from "./ReenviarController";

jest.mock("@/modules/webhook/domain/services/ReenviarService");

jest.mock("@/infrastructure/logger/logger", () => ({
  Logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn(),
  },
}));

import { Logger } from "@/infrastructure/logger/logger";

describe("[WEBHOOK] ReenviarController", () => {
  let controller: ReenviarController;
  let mockService: jest.Mocked<ReenviarService>;
  let mockRequest: Partial<
    Request & { softwareHouseId: number; cedenteId: number }
  >;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockService = {
      webhook: jest.fn(),
    } as any;

    controller = new ReenviarController(mockService);

    mockRequest = {
      body: {
        product: "BOLETO",
        id: [1, 2, 3],
        kind: "webhook",
        type: "pago",
      },
      softwareHouseId: 1,
      cedenteId: 2,
      headers: {
        "x-api-cnpj-cedente": "98.765.432/0001-10",
      },
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    jest.clearAllMocks();
    jest.spyOn(ErrorResponse, "internalServerErrorFromError");
  });

  describe("Casos de sucesso", () => {
    it("deve processar requisição válida e retornar 200", async () => {
      const mockResponseData = { success: true, message: "Processado" };
      mockService.webhook.mockResolvedValue(mockResponseData);

      await controller.reenviar(
        mockRequest as Request & { softwareHouseId: number; cedenteId: number },
        mockResponse as Response,
      );

      expect(Logger.info).toHaveBeenCalledWith(
        "Reenviar webhook request received: product=BOLETO, type=pago, kind=webhook, idsCount=3",
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockResponseData);
    });

    it("deve chamar o serviço com os parâmetros corretos", async () => {
      const mockResponseData = { success: true };
      mockService.webhook.mockResolvedValue(mockResponseData);

      await controller.reenviar(
        mockRequest as Request & { softwareHouseId: number; cedenteId: number },
        mockResponse as Response,
      );

      expect(Logger.info).toHaveBeenCalledWith(
        "Reenviar webhook request received: product=BOLETO, type=pago, kind=webhook, idsCount=3",
      );
      expect(mockService.webhook).toHaveBeenCalledWith(
        {
          product: "BOLETO",
          id: [1, 2, 3],
          kind: "webhook",
          type: "pago",
        },
        {
          id: 2,
          cnpj: "98.765.432/0001-10",
        },
      );
    });

    it("deve logar corretamente quando id é undefined", async () => {
      const mockResponseData = { success: true };
      mockService.webhook.mockResolvedValue(mockResponseData);
      mockRequest.body = {
        product: "BOLETO",
        kind: "webhook",
        type: "pago",
      };

      await controller.reenviar(
        mockRequest as Request & { softwareHouseId: number; cedenteId: number },
        mockResponse as Response,
      );

      expect(Logger.info).toHaveBeenCalledWith(
        "Reenviar webhook request received: product=BOLETO, type=pago, kind=webhook, idsCount=0",
      );
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("deve usar cedenteId do request", async () => {
      mockRequest.cedenteId = 99;
      const mockResponseData = { success: true };
      mockService.webhook.mockResolvedValue(mockResponseData);

      await controller.reenviar(
        mockRequest as Request & { softwareHouseId: number; cedenteId: number },
        mockResponse as Response,
      );

      expect(mockService.webhook).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ id: 99 }),
      );
    });

    it("deve usar CNPJ do header x-api-cnpj-cedente", async () => {
      mockRequest.headers = {
        "x-api-cnpj-cedente": "11.111.111/0001-11",
      };
      const mockResponseData = { success: true };
      mockService.webhook.mockResolvedValue(mockResponseData);

      await controller.reenviar(
        mockRequest as Request & { softwareHouseId: number; cedenteId: number },
        mockResponse as Response,
      );

      expect(mockService.webhook).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ cnpj: "11.111.111/0001-11" }),
      );
    });

    it("deve processar diferentes tipos de product", async () => {
      const products = ["BOLETO", "PAGAMENTO", "PIX"];

      for (const product of products) {
        jest.clearAllMocks();
        mockRequest.body = {
          product: product as any,
          id: [1],
          kind: "webhook",
          type: "pago",
        };
        mockService.webhook.mockResolvedValue({ success: true });

        await controller.reenviar(
          mockRequest as Request & {
            softwareHouseId: number;
            cedenteId: number;
          },
          mockResponse as Response,
        );

        expect(statusMock).toHaveBeenCalledWith(200);
      }
    });

    it("deve processar diferentes tipos de status", async () => {
      const types = ["pago", "cancelado", "disponivel"];

      for (const type of types) {
        jest.clearAllMocks();
        mockRequest.body = {
          product: "BOLETO",
          id: [1],
          kind: "webhook",
          type: type as any,
        };
        mockService.webhook.mockResolvedValue({ success: true });

        await controller.reenviar(
          mockRequest as Request & {
            softwareHouseId: number;
            cedenteId: number;
          },
          mockResponse as Response,
        );

        expect(statusMock).toHaveBeenCalledWith(200);
      }
    });
  });

  describe("Validação de kind", () => {
    it("deve retornar 501 quando kind não é suportado", async () => {
      mockRequest.body = {
        product: "BOLETO",
        id: [1],
        kind: "email" as any,
        type: "pago",
      };

      await controller.reenviar(
        mockRequest as Request & { softwareHouseId: number; cedenteId: number },
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(501);
      expect(jsonMock).toHaveBeenCalled();
      expect(mockService.webhook).not.toHaveBeenCalled();
    });

    it("deve retornar mensagem informando kinds suportados", async () => {
      mockRequest.body = {
        product: "BOLETO",
        id: [1],
        kind: "sms" as any,
        type: "pago",
      };

      await controller.reenviar(
        mockRequest as Request & { softwareHouseId: number; cedenteId: number },
        mockResponse as Response,
      );

      expect(jsonMock).toHaveBeenCalled();
      const errorResponse = jsonMock.mock.calls[0][0];
      expect(errorResponse.code).toBe("NOT_IMPLEMENTED");
      expect(errorResponse.statusCode).toBe(501);
      expect(errorResponse.error.errors[0]).toContain("webhook");
    });

    it("deve aceitar kind 'webhook'", async () => {
      mockRequest.body = {
        product: "BOLETO",
        id: [1],
        kind: "webhook",
        type: "pago",
      };
      mockService.webhook.mockResolvedValue({ success: true });

      await controller.reenviar(
        mockRequest as Request & { softwareHouseId: number; cedenteId: number },
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(mockService.webhook).toHaveBeenCalled();
    });
  });

  describe("Tratamento de InvalidFieldsError", () => {
    it("deve retornar 400 quando service lança InvalidFieldsError", async () => {
      const invalidFieldsError = new InvalidFieldsError(
        { errors: ["Campo inválido"] },
        "INVALID_FIELDS",
        400,
      );
      mockService.webhook.mockRejectedValue(invalidFieldsError);

      await controller.reenviar(
        mockRequest as Request & { softwareHouseId: number; cedenteId: number },
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalled();
    });

    it("deve retornar o JSON do InvalidFieldsError", async () => {
      const invalidFieldsError = new InvalidFieldsError(
        { errors: ["Dados inválidos"] },
        "INVALID_FIELDS",
        400,
      );
      mockService.webhook.mockRejectedValue(invalidFieldsError);

      await controller.reenviar(
        mockRequest as Request & { softwareHouseId: number; cedenteId: number },
        mockResponse as Response,
      );

      expect(jsonMock).toHaveBeenCalled();
      const errorResponse = jsonMock.mock.calls[0][0];
      expect(errorResponse).toHaveProperty("code");
      expect(errorResponse).toHaveProperty("statusCode");
      expect(errorResponse).toHaveProperty("error");
    });
  });

  describe("Tratamento de erros genéricos", () => {
    it("deve retornar 500 para erros não tratados", async () => {
      const genericError = new Error("Database error");
      mockService.webhook.mockRejectedValue(genericError);

      await controller.reenviar(
        mockRequest as Request & { softwareHouseId: number; cedenteId: number },
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalled();
    });

    it("deve usar ErrorResponse.internalServerErrorFromError para erros genéricos", async () => {
      const genericError = new Error("Unexpected error");
      mockService.webhook.mockRejectedValue(genericError);
      const mockInternalError = {
        code: "INTERNAL_SERVER_ERROR",
        statusCode: 500,
        error: { errors: ["Unexpected error"] },
      };
      (
        ErrorResponse.internalServerErrorFromError as unknown as jest.SpyInstance
      ).mockReturnValue({
        json: () => mockInternalError,
      } as any);

      await controller.reenviar(
        mockRequest as Request & { softwareHouseId: number; cedenteId: number },
        mockResponse as Response,
      );

      expect(Logger.error).toHaveBeenCalledWith(
        "Unexpected error in reenviar request: Unexpected error",
      );
      expect(jsonMock).toHaveBeenCalled();
      const errorResponse = jsonMock.mock.calls[0][0];
      expect(errorResponse.code).toBe("INTERNAL_SERVER_ERROR");
      expect(errorResponse.statusCode).toBe(500);
      expect(errorResponse.error.errors).toContain("Unexpected error");

      // Testa quando erro não é instância de Error
      jest.clearAllMocks();
      const nonErrorValue = "String error message" as any;
      mockService.webhook.mockRejectedValue(nonErrorValue);
      const mockInternalError2 = {
        code: "INTERNAL_SERVER_ERROR",
        statusCode: 500,
        error: { errors: [String(nonErrorValue)] },
      };
      (
        ErrorResponse.internalServerErrorFromError as unknown as jest.SpyInstance
      ).mockReturnValue({
        json: () => mockInternalError2,
      } as any);

      await controller.reenviar(
        mockRequest as Request & { softwareHouseId: number; cedenteId: number },
        mockResponse as Response,
      );

      expect(Logger.error).toHaveBeenCalledWith(
        `Unexpected error in reenviar request: ${String(nonErrorValue)}`,
      );
      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe("Integração com ReenviarService", () => {
    it("deve chamar o método correto do service baseado no kind", async () => {
      mockRequest.body = {
        product: "PIX",
        id: [5, 10],
        kind: "webhook",
        type: "disponivel",
      };
      mockService.webhook.mockResolvedValue({ success: true });

      await controller.reenviar(
        mockRequest as Request & { softwareHouseId: number; cedenteId: number },
        mockResponse as Response,
      );

      expect(mockService.webhook).toHaveBeenCalledTimes(1);
    });

    it("deve passar o body completo para o service", async () => {
      const bodyData = {
        product: "BOLETO" as const,
        id: [1, 2, 3, 4, 5],
        kind: "webhook" as const,
        type: "pago" as const,
      };
      mockRequest.body = bodyData;
      mockService.webhook.mockResolvedValue({ success: true });

      await controller.reenviar(
        mockRequest as Request & { softwareHouseId: number; cedenteId: number },
        mockResponse as Response,
      );

      expect(mockService.webhook).toHaveBeenCalledWith(
        bodyData,
        expect.any(Object),
      );
    });

    it("deve passar os dados do cedente para o service", async () => {
      mockRequest.cedenteId = 123;
      mockRequest.headers = {
        "x-api-cnpj-cedente": "99.999.999/0001-99",
      };
      mockService.webhook.mockResolvedValue({ success: true });

      await controller.reenviar(
        mockRequest as Request & { softwareHouseId: number; cedenteId: number },
        mockResponse as Response,
      );

      expect(mockService.webhook).toHaveBeenCalledWith(expect.any(Object), {
        id: 123,
        cnpj: "99.999.999/0001-99",
      });
    });
  });

  describe("Fluxo completo", () => {
    it("deve executar todo o fluxo com sucesso", async () => {
      const mockResponseData = {
        message: "Webhooks reenviados com sucesso",
        total: 3,
      };
      mockService.webhook.mockResolvedValue(mockResponseData);

      await controller.reenviar(
        mockRequest as Request & { softwareHouseId: number; cedenteId: number },
        mockResponse as Response,
      );

      expect(mockService.webhook).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockResponseData);
    });
  });
});
