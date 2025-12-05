import { NextFunction, Request, Response } from "express";
import { CedenteRepository } from "../../../infrastructure/database/repositories/CedenteRepository";
import { SoftwareHouseRepository } from "../../../infrastructure/database/repositories/SoftwareHouseRepository";
import { AuthMiddleware } from "./auth.middleware";

jest.mock(
  "../../../infrastructure/database/repositories/SoftwareHouseRepository",
);
jest.mock("../../../infrastructure/database/repositories/CedenteRepository");

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

describe("[AUTH] AuthMiddleware", () => {
  let mockRequest: Partial<
    Request & { softwareHouseId: number; cedenteId: number }
  >;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      headers: {
        "x-api-cnpj-sh": "12345678000190",
        "x-api-token-sh": "token-sh",
        "x-api-cnpj-cedente": "98765432000110",
        "x-api-token-cedente": "token-cedente",
      },
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe("Casos de sucesso", () => {
    it("deve validar credenciais válidas e chamar next()", async () => {
      const mockSoftwareHouse = {
        id: 1,
        cnpj: "12345678000190",
        token: "token-sh",
        status: "ativo",
      };

      const mockCedente = {
        id: 2,
        cnpj: "98765432000110",
        token: "token-cedente",
        status: "ativo",
      };

      const mockSoftwareHouseRepo = {
        find: jest.fn().mockResolvedValue(mockSoftwareHouse),
      };

      const mockCedenteRepo = {
        find: jest.fn().mockResolvedValue(mockCedente),
      };

      (SoftwareHouseRepository as jest.Mock).mockImplementation(
        () => mockSoftwareHouseRepo,
      );
      (CedenteRepository as jest.Mock).mockImplementation(
        () => mockCedenteRepo,
      );

      await AuthMiddleware.validate(
        mockRequest as Request & { softwareHouseId: number; cedenteId: number },
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRequest.softwareHouseId).toBe(1);
      expect(mockRequest.cedenteId).toBe(2);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it("deve definir softwareHouseId e cedenteId no request", async () => {
      const mockSoftwareHouse = {
        id: 10,
        cnpj: "12345678000190",
        token: "token-sh",
        status: "ativo",
      };

      const mockCedente = {
        id: 20,
        cnpj: "98765432000110",
        token: "token-cedente",
        status: "ativo",
      };

      const mockSoftwareHouseRepo = {
        find: jest.fn().mockResolvedValue(mockSoftwareHouse),
      };

      const mockCedenteRepo = {
        find: jest.fn().mockResolvedValue(mockCedente),
      };

      (SoftwareHouseRepository as jest.Mock).mockImplementation(
        () => mockSoftwareHouseRepo,
      );
      (CedenteRepository as jest.Mock).mockImplementation(
        () => mockCedenteRepo,
      );

      await AuthMiddleware.validate(
        mockRequest as Request & { softwareHouseId: number; cedenteId: number },
        mockResponse as Response,
        mockNext,
      );

      expect(mockRequest.softwareHouseId).toBe(10);
      expect(mockRequest.cedenteId).toBe(20);
    });

    it("deve validar software house antes do cedente", async () => {
      const mockSoftwareHouse = {
        id: 1,
        cnpj: "12345678000190",
        status: "ativo",
      };

      const mockCedente = {
        id: 2,
        cnpj: "98765432000110",
        status: "ativo",
      };

      const findSoftwareHouseSpy = jest
        .fn()
        .mockResolvedValue(mockSoftwareHouse);
      const findCedenteSpy = jest.fn().mockResolvedValue(mockCedente);

      const mockSoftwareHouseRepo = { find: findSoftwareHouseSpy };
      const mockCedenteRepo = { find: findCedenteSpy };

      (SoftwareHouseRepository as jest.Mock).mockImplementation(
        () => mockSoftwareHouseRepo,
      );
      (CedenteRepository as jest.Mock).mockImplementation(
        () => mockCedenteRepo,
      );

      await AuthMiddleware.validate(
        mockRequest as Request & { softwareHouseId: number; cedenteId: number },
        mockResponse as Response,
        mockNext,
      );

      expect(findSoftwareHouseSpy).toHaveBeenCalledWith(
        "12345678000190",
        "token-sh",
      );
      expect(findCedenteSpy).toHaveBeenCalledWith(
        "98765432000110",
        "token-cedente",
        1,
      );
    });
  });

  describe("Tratamento de InvalidFieldsError", () => {
    it("deve retornar 400 quando os headers são inválidos", async () => {
      mockRequest.headers = {
        "x-api-cnpj-sh": "123",
        "x-api-token-sh": "token",
        "x-api-cnpj-cedente": "98765432000110",
        "x-api-token-cedente": "token",
      };

      await AuthMiddleware.validate(
        mockRequest as Request & { softwareHouseId: number; cedenteId: number },
        mockResponse as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve retornar erro quando campos obrigatórios estão ausentes", async () => {
      mockRequest.headers = {};

      await AuthMiddleware.validate(
        mockRequest as Request & { softwareHouseId: number; cedenteId: number },
        mockResponse as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve retornar o JSON do InvalidFieldsError", async () => {
      mockRequest.headers = {
        "x-api-cnpj-sh": "123",
      };

      await AuthMiddleware.validate(
        mockRequest as Request & { softwareHouseId: number; cedenteId: number },
        mockResponse as Response,
        mockNext,
      );

      expect(jsonMock).toHaveBeenCalled();
      const errorResponse = jsonMock.mock.calls[0][0];
      expect(errorResponse).toHaveProperty("code");
      expect(errorResponse).toHaveProperty("statusCode");
      expect(errorResponse).toHaveProperty("error");
    });
  });

  describe("Tratamento de UnauthorizedError", () => {
    it("deve retornar 401 quando software house não existe", async () => {
      const mockSoftwareHouseRepo = {
        find: jest.fn().mockResolvedValue(null),
      };

      (SoftwareHouseRepository as jest.Mock).mockImplementation(
        () => mockSoftwareHouseRepo,
      );

      await AuthMiddleware.validate(
        mockRequest as Request & { softwareHouseId: number; cedenteId: number },
        mockResponse as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve retornar 401 quando software house está inativo", async () => {
      const mockSoftwareHouse = {
        id: 1,
        cnpj: "12345678000190",
        status: "inativo",
      };

      const mockSoftwareHouseRepo = {
        find: jest.fn().mockResolvedValue(mockSoftwareHouse),
      };

      (SoftwareHouseRepository as jest.Mock).mockImplementation(
        () => mockSoftwareHouseRepo,
      );

      await AuthMiddleware.validate(
        mockRequest as Request & { softwareHouseId: number; cedenteId: number },
        mockResponse as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve retornar 401 quando cedente não existe", async () => {
      const mockSoftwareHouse = {
        id: 1,
        cnpj: "12345678000190",
        status: "ativo",
      };

      const mockSoftwareHouseRepo = {
        find: jest.fn().mockResolvedValue(mockSoftwareHouse),
      };

      const mockCedenteRepo = {
        find: jest.fn().mockResolvedValue(null),
      };

      (SoftwareHouseRepository as jest.Mock).mockImplementation(
        () => mockSoftwareHouseRepo,
      );
      (CedenteRepository as jest.Mock).mockImplementation(
        () => mockCedenteRepo,
      );

      await AuthMiddleware.validate(
        mockRequest as Request & { softwareHouseId: number; cedenteId: number },
        mockResponse as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve retornar 401 quando cedente está inativo", async () => {
      const mockSoftwareHouse = {
        id: 1,
        cnpj: "12345678000190",
        status: "ativo",
      };

      const mockCedente = {
        id: 2,
        cnpj: "98765432000110",
        status: "inativo",
      };

      const mockSoftwareHouseRepo = {
        find: jest.fn().mockResolvedValue(mockSoftwareHouse),
      };

      const mockCedenteRepo = {
        find: jest.fn().mockResolvedValue(mockCedente),
      };

      (SoftwareHouseRepository as jest.Mock).mockImplementation(
        () => mockSoftwareHouseRepo,
      );
      (CedenteRepository as jest.Mock).mockImplementation(
        () => mockCedenteRepo,
      );

      await AuthMiddleware.validate(
        mockRequest as Request & { softwareHouseId: number; cedenteId: number },
        mockResponse as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve retornar o JSON do UnauthorizedError", async () => {
      const mockSoftwareHouseRepo = {
        find: jest.fn().mockResolvedValue(null),
      };

      (SoftwareHouseRepository as jest.Mock).mockImplementation(
        () => mockSoftwareHouseRepo,
      );

      await AuthMiddleware.validate(
        mockRequest as Request & { softwareHouseId: number; cedenteId: number },
        mockResponse as Response,
        mockNext,
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
      const mockSoftwareHouseRepo = {
        find: jest.fn().mockRejectedValue(new Error("Database error")),
      };

      (SoftwareHouseRepository as jest.Mock).mockImplementation(
        () => mockSoftwareHouseRepo,
      );

      await AuthMiddleware.validate(
        mockRequest as Request & { softwareHouseId: number; cedenteId: number },
        mockResponse as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve usar ErrorResponse.internalServerErrorFromError para erros genéricos", async () => {
      const mockError = new Error("Unexpected error");
      const mockSoftwareHouseRepo = {
        find: jest.fn().mockRejectedValue(mockError),
      };

      (SoftwareHouseRepository as jest.Mock).mockImplementation(
        () => mockSoftwareHouseRepo,
      );

      await AuthMiddleware.validate(
        mockRequest as Request & { softwareHouseId: number; cedenteId: number },
        mockResponse as Response,
        mockNext,
      );

      expect(jsonMock).toHaveBeenCalled();
      const errorResponse = jsonMock.mock.calls[0][0];
      expect(errorResponse.code).toBe("INTERNAL_SERVER_ERROR");
      expect(errorResponse.statusCode).toBe(500);
      expect(errorResponse.error.errors).toContain("Unexpected error");
    });

    it("deve tratar erros de TypeError", async () => {
      const mockSoftwareHouseRepo = {
        find: jest
          .fn()
          .mockRejectedValue(new TypeError("Cannot read property")),
      };

      (SoftwareHouseRepository as jest.Mock).mockImplementation(
        () => mockSoftwareHouseRepo,
      );

      await AuthMiddleware.validate(
        mockRequest as Request & { softwareHouseId: number; cedenteId: number },
        mockResponse as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalled();
    });

    it("deve logar erro quando erro não é instância de Error", async () => {
      const nonErrorValue = "String error message" as any;
      const mockSoftwareHouseRepo = {
        find: jest.fn().mockRejectedValue(nonErrorValue),
      };

      (SoftwareHouseRepository as jest.Mock).mockImplementation(
        () => mockSoftwareHouseRepo,
      );

      await AuthMiddleware.validate(
        mockRequest as Request & { softwareHouseId: number; cedenteId: number },
        mockResponse as Response,
        mockNext,
      );

      expect(Logger.error).toHaveBeenCalledWith(
        `Unexpected error in auth middleware: ${String(nonErrorValue)}`,
      );
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalled();
    });

    it("deve logar erro quando erro é um objeto não Error", async () => {
      const nonErrorObject = { code: "CUSTOM_ERROR", message: "Custom" } as any;
      const mockSoftwareHouseRepo = {
        find: jest.fn().mockRejectedValue(nonErrorObject),
      };

      (SoftwareHouseRepository as jest.Mock).mockImplementation(
        () => mockSoftwareHouseRepo,
      );

      await AuthMiddleware.validate(
        mockRequest as Request & { softwareHouseId: number; cedenteId: number },
        mockResponse as Response,
        mockNext,
      );

      expect(Logger.error).toHaveBeenCalledWith(
        `Unexpected error in auth middleware: ${String(nonErrorObject)}`,
      );
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalled();
    });
  });

  describe("Integração com AuthDTO", () => {
    it("deve criar AuthDTO a partir dos headers do request", async () => {
      const mockSoftwareHouse = {
        id: 1,
        cnpj: "12345678000190",
        status: "ativo",
      };

      const mockCedente = {
        id: 2,
        cnpj: "98765432000110",
        status: "ativo",
      };

      const findSoftwareHouseSpy = jest
        .fn()
        .mockResolvedValue(mockSoftwareHouse);

      const mockSoftwareHouseRepo = {
        find: findSoftwareHouseSpy,
      };

      const mockCedenteRepo = {
        find: jest.fn().mockResolvedValue(mockCedente),
      };

      (SoftwareHouseRepository as jest.Mock).mockImplementation(
        () => mockSoftwareHouseRepo,
      );
      (CedenteRepository as jest.Mock).mockImplementation(
        () => mockCedenteRepo,
      );

      await AuthMiddleware.validate(
        mockRequest as Request & { softwareHouseId: number; cedenteId: number },
        mockResponse as Response,
        mockNext,
      );

      expect(findSoftwareHouseSpy).toHaveBeenCalledWith(
        "12345678000190",
        "token-sh",
      );
    });
  });

  describe("Fluxo completo", () => {
    it("deve executar todo o fluxo de autenticação com sucesso", async () => {
      const mockSoftwareHouse = {
        id: 1,
        cnpj: "12345678000190",
        token: "token-sh",
        status: "ativo",
      };

      const mockCedente = {
        id: 2,
        cnpj: "98765432000110",
        token: "token-cedente",
        status: "ativo",
      };

      const mockSoftwareHouseRepo = {
        find: jest.fn().mockResolvedValue(mockSoftwareHouse),
      };

      const mockCedenteRepo = {
        find: jest.fn().mockResolvedValue(mockCedente),
      };

      (SoftwareHouseRepository as jest.Mock).mockImplementation(
        () => mockSoftwareHouseRepo,
      );
      (CedenteRepository as jest.Mock).mockImplementation(
        () => mockCedenteRepo,
      );

      await AuthMiddleware.validate(
        mockRequest as Request & { softwareHouseId: number; cedenteId: number },
        mockResponse as Response,
        mockNext,
      );

      expect(mockSoftwareHouseRepo.find).toHaveBeenCalled();
      expect(mockCedenteRepo.find).toHaveBeenCalled();
      expect(mockRequest.softwareHouseId).toBe(1);
      expect(mockRequest.cedenteId).toBe(2);
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });
  });
});
