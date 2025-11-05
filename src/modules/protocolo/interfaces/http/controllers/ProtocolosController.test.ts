import { ProtocolosService } from "@/modules/protocolo/domain/services/ProtocolosService";
import { ErrorResponse } from "@/shared/errors/ErrorResponse";
import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { Response } from "express";
import { ProtocolosController } from "./ProtocolosController";

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

describe("[Controller] /protocolo - ProtocolosController", () => {
  let controller: ProtocolosController;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;
  let mockResponse: Partial<Response>;

  const mockService: Partial<ProtocolosService> = {
    getProtocolos: jest.fn(),
    getProtocoloById: jest.fn(),
  };

  beforeEach(() => {
    controller = new ProtocolosController(mockService as ProtocolosService);
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = { status: statusMock, json: jsonMock };
    jest.clearAllMocks();
    jest.spyOn(ErrorResponse, "internalServerErrorFromError");
  });

  describe("getProtocolos", () => {
    it("deve retornar 400 se cedenteId estiver ausente", async () => {
      const mockRequest = {
        body: { start_date: "2025-10-01", end_date: "2025-10-10" },
      } as any;

      const invalidError = new InvalidFieldsError({
        errors: ["cedenteId é obrigatório"],
      });
      (mockService.getProtocolos as jest.Mock).mockRejectedValue(invalidError);

      await controller.getProtocolos(mockRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(invalidError.json());
    });

    it("deve retornar 400 se cedenteId não for um número válido", async () => {
      const mockRequest = {
        cedenteId: "abc",
        body: { start_date: "2025-10-01", end_date: "2025-10-10" },
      } as any;

      const invalidError = new InvalidFieldsError({
        errors: ["cedenteId deve ser um número válido"],
      });
      (mockService.getProtocolos as jest.Mock).mockRejectedValue(invalidError);

      await controller.getProtocolos(mockRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(invalidError.json());
    });

    it("deve retornar 400 se start_date ou end_date estiverem ausentes", async () => {
      const mockRequest = { body: {}, cedenteId: 1 } as any;
      const invalidError = new InvalidFieldsError({
        errors: ["start_date obrigatório"],
      });
      (mockService.getProtocolos as jest.Mock).mockRejectedValue(invalidError);

      await controller.getProtocolos(mockRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(invalidError.json());
    });

    it("deve retornar 400 se start_date ou end_date forem inválidas", async () => {
      const mockRequest = {
        body: { start_date: "abc", end_date: "2025-10-10" },
        cedenteId: 1,
      } as any;
      const invalidError = new InvalidFieldsError({
        errors: ["Data inicial inválida"],
      });
      (mockService.getProtocolos as jest.Mock).mockRejectedValue(invalidError);

      await controller.getProtocolos(mockRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(invalidError.json());
    });

    it("deve retornar 400 se end_date for menor que start_date ou intervalo > 31 dias", async () => {
      const cases = [
        { start_date: "2025-10-10", end_date: "2025-10-01" },
        { start_date: "2025-10-01", end_date: "2025-11-15" },
      ];

      for (const body of cases) {
        const mockRequest = { body, cedenteId: 1 } as any;
        const invalidError = new InvalidFieldsError({
          errors: [
            "A diferença entre start_date e end_date tem quer ser >= 0 e <= 31 dias",
          ],
        });
        (mockService.getProtocolos as jest.Mock).mockRejectedValue(
          invalidError,
        );

        await controller.getProtocolos(mockRequest, mockResponse as Response);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith(invalidError.json());
      }
    });

    it("deve retornar 200 quando os filtros forem válidos", async () => {
      const mockRequest = {
        body: {
          start_date: "2025-10-01",
          end_date: "2025-10-10",
          product: "BOLETO",
          id: [1, 2],
          kind: "webhook",
          type: "DISPONIVEL",
        },
        cedenteId: 1,
      } as any;

      (mockService.getProtocolos as jest.Mock).mockResolvedValue([{ id: 1 }]);

      await controller.getProtocolos(mockRequest, mockResponse as Response);

      expect(mockService.getProtocolos).toHaveBeenCalledWith(
        1,
        mockRequest.body,
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith([{ id: 1 }]);
    });

    it("deve retornar 500 em caso de erro inesperado", async () => {
      const mockRequest = {
        body: { start_date: "2025-10-01", end_date: "2025-10-10" },
        cedenteId: 1,
      } as any;
      (mockService.getProtocolos as jest.Mock).mockRejectedValue(
        new Error("Erro no banco de dados"),
      );
      const mockInternalError = {
        code: "INTERNAL_SERVER_ERROR",
        statusCode: 500,
        error: { errors: ["Erro no banco de dados"] },
      };
      (
        ErrorResponse.internalServerErrorFromError as unknown as jest.SpyInstance
      ).mockReturnValue({
        json: () => mockInternalError,
      } as any);

      await controller.getProtocolos(mockRequest, mockResponse as Response);

      expect(Logger.error).toHaveBeenCalledWith(
        "Unexpected error in getProtocolos: Erro no banco de dados",
      );
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(mockInternalError);

      // Testa quando erro não é instância de Error
      jest.clearAllMocks();
      const nonErrorValue = "String database error" as any;
      (mockService.getProtocolos as jest.Mock).mockRejectedValue(nonErrorValue);
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

      await controller.getProtocolos(mockRequest, mockResponse as Response);

      expect(Logger.error).toHaveBeenCalledWith(
        `Unexpected error in getProtocolos: ${String(nonErrorValue)}`,
      );
      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("deve validar campos opcionais: product, kind, type e id", async () => {
      const invalidCases = [
        {
          body: {
            start_date: "2025-10-01",
            end_date: "2025-10-05",
            product: "INVALIDO",
          },
          error: "Valor inválido para o campo 'product'",
        },
        {
          body: {
            start_date: "2025-10-01",
            end_date: "2025-10-05",
            kind: "INVALIDO",
          },
          error: "Valor inválido para o campo 'kind'",
        },
        {
          body: {
            start_date: "2025-10-01",
            end_date: "2025-10-05",
            type: "INVALIDO",
          },
          error: "Valor inválido para o campo 'type'",
        },
        {
          body: {
            start_date: "2025-10-01",
            end_date: "2025-10-05",
            id: ["abc", "def"],
          },
          error: "O campo 'id' deve ser um array de números válidos",
        },
      ];

      for (const { body, error } of invalidCases) {
        const mockRequest = { body, cedenteId: 1 } as any;
        const invalidError = new InvalidFieldsError({ errors: [error] });
        (mockService.getProtocolos as jest.Mock).mockRejectedValue(
          invalidError,
        );

        await controller.getProtocolos(mockRequest, mockResponse as Response);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith(invalidError.json());
      }
    });
  });

  describe("getProtolocoById", () => {
    it("deve validar id e cedenteId", async () => {
      const cases = [
        { params: { id: "" }, error: "UUID é obrigatório" },
        { params: { id: "invalid-123" }, error: "UUID inválido" },
        { params: { id: "uuid-123" }, error: "Protocolo não encontrado." },
      ];

      for (const { params, error } of cases) {
        jest.clearAllMocks();
        const mockRequest = { params, cedenteId: 1 } as any;
        const invalidError = new InvalidFieldsError({ errors: [error] });
        (mockService.getProtocoloById as jest.Mock).mockRejectedValue(
          invalidError,
        );

        await controller.getProtolocoById(
          mockRequest,
          mockResponse as Response,
        );

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalled();
      }
    });

    it("deve retornar 200 se o protocolo existir", async () => {
      const mockRequest = {
        params: { id: "aaf52d31-55ef-4bc9-84ab-62a4a0fb47cb" },
        cedenteId: 1,
      } as any;
      const protocolo = { id: "aaf52d31-55ef-4bc9-84ab-62a4a0fb47cb" };
      (mockService.getProtocoloById as jest.Mock).mockResolvedValue(protocolo);

      await controller.getProtolocoById(mockRequest, mockResponse as Response);

      expect(mockService.getProtocoloById).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ id: protocolo.id }),
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(protocolo);

      // Testa quando protocolo não é encontrado (ErrorResponse com statusCode 400)
      jest.clearAllMocks();
      const notFoundError = new ErrorResponse("NOT_FOUND", 400, {
        errors: ["Protocolo não encontrado"],
      });
      (mockService.getProtocoloById as jest.Mock).mockRejectedValue(
        notFoundError,
      );

      await controller.getProtolocoById(mockRequest, mockResponse as Response);

      expect(Logger.warn).toHaveBeenCalledWith(
        `Protocolo not found: id=${mockRequest.params.id}, cedenteId=${mockRequest.cedenteId}`,
      );
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(notFoundError.json());
    });

    it("deve retornar 500 em caso de erro inesperado", async () => {
      const mockRequest = {
        params: { id: "aaf52d31-55ef-4bc9-84ab-62a4a0fb47cb" },
        cedenteId: 1,
      } as any;
      (mockService.getProtocoloById as jest.Mock).mockRejectedValue(
        new Error("Erro no banco de dados"),
      );
      const mockInternalError = {
        code: "INTERNAL_SERVER_ERROR",
        statusCode: 500,
        error: { errors: ["Erro no banco de dados"] },
      };
      (
        ErrorResponse.internalServerErrorFromError as unknown as jest.SpyInstance
      ).mockReturnValue({
        json: () => mockInternalError,
      } as any);

      await controller.getProtolocoById(mockRequest, mockResponse as Response);

      expect(Logger.error).toHaveBeenCalledWith(
        "Unexpected error in getProtocoloById: Erro no banco de dados",
      );
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(mockInternalError);

      // Testa quando erro não é instância de Error
      jest.clearAllMocks();
      const nonErrorObject = {
        code: "DB_ERROR",
        message: "Database failed",
      } as any;
      (mockService.getProtocoloById as jest.Mock).mockRejectedValue(
        nonErrorObject,
      );
      const mockInternalError2 = {
        code: "INTERNAL_SERVER_ERROR",
        statusCode: 500,
        error: { errors: [String(nonErrorObject)] },
      };
      (
        ErrorResponse.internalServerErrorFromError as unknown as jest.SpyInstance
      ).mockReturnValue({
        json: () => mockInternalError2,
      } as any);

      await controller.getProtolocoById(mockRequest, mockResponse as Response);

      expect(Logger.error).toHaveBeenCalledWith(
        `Unexpected error in getProtocoloById: ${String(nonErrorObject)}`,
      );
      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });
});
