import { NextFunction, Request, Response } from "express";
import * as ReenviarDTOModule from "../dtos/ReenviarDTO";
import { BodyMiddleware } from "./body.middleware";

describe("[WEBHOOK] BodyMiddleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      body: {
        product: "boleto",
        id: ["1", "2"],
        kind: "webhook",
        type: "pago",
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
    it("deve validar body válido e chamar next()", () => {
      BodyMiddleware.validate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it("deve transformar req.body em ReenviarDTO", () => {
      BodyMiddleware.validate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockRequest.body).toBeDefined();
      expect(mockRequest.body).toHaveProperty("product");
      expect(mockRequest.body).toHaveProperty("id");
      expect(mockRequest.body).toHaveProperty("kind");
      expect(mockRequest.body).toHaveProperty("type");
    });

    it("deve transformar product para uppercase", () => {
      mockRequest.body = {
        product: "pagamento",
        id: ["1"],
        kind: "webhook",
        type: "cancelado",
      };

      BodyMiddleware.validate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockRequest.body.product).toBe("PAGAMENTO");
      expect(mockNext).toHaveBeenCalled();
    });

    it("deve transformar id de string para number", () => {
      mockRequest.body = {
        product: "pix",
        id: ["10", "20", "30"],
        kind: "webhook",
        type: "disponivel",
      };

      BodyMiddleware.validate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockRequest.body.id).toEqual([10, 20, 30]);
      expect(typeof mockRequest.body.id[0]).toBe("number");
      expect(mockNext).toHaveBeenCalled();
    });

    it("deve aceitar diferentes valores de product", () => {
      const products = ["boleto", "pagamento", "pix"];

      products.forEach((product) => {
        jest.clearAllMocks();
        mockRequest.body = {
          product,
          id: ["1"],
          kind: "webhook",
          type: "pago",
        };

        BodyMiddleware.validate(
          mockRequest as Request,
          mockResponse as Response,
          mockNext,
        );

        expect(mockNext).toHaveBeenCalled();
      });
    });

    it("deve aceitar array com múltiplos ids", () => {
      mockRequest.body = {
        product: "boleto",
        id: ["1", "2", "3", "4", "5"],
        kind: "webhook",
        type: "pago",
      };

      BodyMiddleware.validate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockRequest.body.id).toHaveLength(5);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("Tratamento de InvalidFieldsError", () => {
    it("deve retornar 400 quando product está ausente", () => {
      mockRequest.body = {
        id: ["1"],
        kind: "webhook",
        type: "pago",
      };

      BodyMiddleware.validate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve retornar 400 quando id está ausente", () => {
      mockRequest.body = {
        product: "boleto",
        kind: "webhook",
        type: "pago",
      };

      BodyMiddleware.validate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve retornar 400 quando kind está ausente", () => {
      mockRequest.body = {
        product: "boleto",
        id: ["1"],
        type: "pago",
      };

      BodyMiddleware.validate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve retornar 400 quando type está ausente", () => {
      mockRequest.body = {
        product: "boleto",
        id: ["1"],
        kind: "webhook",
      };

      BodyMiddleware.validate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve retornar 400 quando todos os campos estão ausentes", () => {
      mockRequest.body = {};

      BodyMiddleware.validate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve retornar o JSON do InvalidFieldsError", () => {
      mockRequest.body = {
        product: "invalido",
      };

      BodyMiddleware.validate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(jsonMock).toHaveBeenCalled();
      const errorResponse = jsonMock.mock.calls[0][0];
      expect(errorResponse).toHaveProperty("code");
      expect(errorResponse).toHaveProperty("statusCode");
      expect(errorResponse).toHaveProperty("error");
    });

    it("deve retornar 400 quando product é inválido", () => {
      mockRequest.body = {
        product: "invalido",
        id: ["1"],
        kind: "webhook",
        type: "pago",
      };

      BodyMiddleware.validate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve retornar 400 quando id é um array vazio", () => {
      mockRequest.body = {
        product: "boleto",
        id: [],
        kind: "webhook",
        type: "pago",
      };

      BodyMiddleware.validate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve retornar 400 quando id tem mais de 30 elementos", () => {
      mockRequest.body = {
        product: "boleto",
        id: Array.from({ length: 31 }, (_, i) => String(i + 1)),
        kind: "webhook",
        type: "pago",
      };

      BodyMiddleware.validate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve retornar 400 quando id contém valor não numérico", () => {
      mockRequest.body = {
        product: "boleto",
        id: ["1", "abc", "3"],
        kind: "webhook",
        type: "pago",
      };

      BodyMiddleware.validate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve retornar 400 quando há campos extras (strict mode)", () => {
      mockRequest.body = {
        product: "boleto",
        id: ["1"],
        kind: "webhook",
        type: "pago",
        campoExtra: "não permitido",
      };

      BodyMiddleware.validate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("Validação strict mode", () => {
    it("deve rejeitar body com campos extras", () => {
      mockRequest.body = {
        product: "boleto",
        id: ["1"],
        kind: "webhook",
        type: "pago",
        extraField: "should be rejected",
      };

      BodyMiddleware.validate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("Tratamento de erros genéricos", () => {
    it("deve retornar 500 para erros não tratados", () => {
      const genericError = new Error("Unexpected error");
      jest
        .spyOn(ReenviarDTOModule, "ReenviarDTO")
        .mockImplementationOnce(() => {
          throw genericError;
        });

      mockRequest.body = {
        product: "boleto",
        id: ["1"],
        kind: "webhook",
        type: "pago",
      };

      BodyMiddleware.validate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();

      jest.restoreAllMocks();
    });

    it("deve usar ErrorResponse.internalServerErrorFromError para erros genéricos", () => {
      const genericError = new Error("Database connection failed");
      jest
        .spyOn(ReenviarDTOModule, "ReenviarDTO")
        .mockImplementationOnce(() => {
          throw genericError;
        });

      mockRequest.body = {
        product: "boleto",
        id: ["1"],
        kind: "webhook",
        type: "pago",
      };

      BodyMiddleware.validate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(jsonMock).toHaveBeenCalled();
      const errorResponse = jsonMock.mock.calls[0][0];
      expect(errorResponse.code).toBe("INTERNAL_SERVER_ERROR");
      expect(errorResponse.statusCode).toBe(500);
      expect(errorResponse.error.errors).toContain(
        "Database connection failed",
      );

      jest.restoreAllMocks();
    });
  });

  describe("Fluxo completo", () => {
    it("deve executar todo o fluxo de validação com sucesso", () => {
      mockRequest.body = {
        product: "boleto",
        id: ["1", "2", "3"],
        kind: "webhook",
        type: "pago",
      };

      BodyMiddleware.validate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockRequest.body.product).toBe("BOLETO");
      expect(mockRequest.body.id).toEqual([1, 2, 3]);
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });
  });
});
