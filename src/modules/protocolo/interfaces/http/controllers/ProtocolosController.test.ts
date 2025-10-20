import { Request, Response } from "express";
import { ProtocolosController } from "./ProtocolosController";
import { GetProtocolosService } from "@/modules/protocolo/domain/services/GetProtocolosService";
import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import * as validateModule from "../middlewares/protocolo/validate-body";

describe("[Controller] /protocolo - ProtocolosController", () => {
  let protocolosController: ProtocolosController;
  let mockResponse: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  const mockService: Partial<GetProtocolosService> = {
    getProtocolos: jest.fn(),
    getProtocoloById: jest.fn(),
  };

  jest
    .spyOn(validateModule, "validateBody")
    .mockImplementation(async (body: any) => {
      if (!body.start_date || !body.end_date) {
        throw new InvalidFieldsError({
          errors: ["start_date e end_date são obrigatórios"],
        });
      }
      const start = new Date(body.start_date);
      const end = new Date(body.end_date);
      if (start > end) {
        throw new InvalidFieldsError({
          errors: ["start_date não pode ser maior que end_date"],
        });
      }
      const invalidValues = ["INVALID"];
      if (
        invalidValues.includes(body.product) ||
        invalidValues.includes(body.kind) ||
        invalidValues.includes(body.type)
      ) {
        throw new InvalidFieldsError({ errors: ["Campo inválido"] });
      }
      return body;
    });

  beforeEach(() => {
    protocolosController = new ProtocolosController(
      mockService as GetProtocolosService,
    );

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = { status: statusMock, json: jsonMock };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Listagem de Protocolos (GET /protocolo)", () => {
    it("deve retornar erro se start_date ou end_date não forem informados", async () => {
      const mockRequest: Partial<Request<{}, {}, any>> & { cedenteId: number } =
        {
          body: {},
          cedenteId: 1,
        };

      await protocolosController.getProtocolos(
        mockRequest as Request<{}, {}, any> & { cedenteId: number },
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("deve validar intervalo de datas permitido", async () => {
      const mockRequest: Partial<Request<{}, {}, any>> & { cedenteId: number } =
        {
          body: { start_date: "2025-10-01", end_date: "2025-09-01" },
          cedenteId: 1,
        };

      await protocolosController.getProtocolos(
        mockRequest as Request<{}, {}, any> & { cedenteId: number },
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("deve validar campos opcionais (product, id, kind, type)", async () => {
      const mockRequest: Partial<Request<{}, {}, any>> & { cedenteId: number } =
        {
          body: {
            start_date: "2025-10-01",
            end_date: "2025-10-10",
            product: "INVALID",
            id: [1, 2],
            kind: "INVALID",
            type: "INVALID",
          },
          cedenteId: 1,
        };

      await protocolosController.getProtocolos(
        mockRequest as Request<{}, {}, any> & { cedenteId: number },
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: { errors: ["Campo inválido"] },
        message: "INVALID_FIELDS",
      });
    });

    it("deve retornar sucesso (200) se filtros e dados estiverem corretos", async () => {
      const mockRequest: Partial<Request<{}, {}, any>> & { cedenteId: number } =
        {
          body: {
            start_date: "2025-10-01",
            end_date: "2025-10-10",
            product: "BOLETO",
            id: [1, 2],
            kind: "webhook",
            type: "DISPONIVEL",
          },
          cedenteId: 1,
        };

      (mockService.getProtocolos as jest.Mock).mockResolvedValue([{ id: 1 }]);

      await protocolosController.getProtocolos(
        mockRequest as Request<{}, {}, any> & { cedenteId: number },
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith([{ id: 1 }]);
    });
  });

  describe("Consulta Individual de Protocolo (GET /protocolo/:id)", () => {
    it("deve retornar erro se id não for informado", async () => {
      const mockRequest: Partial<Request<{ id: string }>> & {
        cedenteId: number;
      } = { params: { id: "" }, cedenteId: 1 };

      await protocolosController.getProtolocoById(
        mockRequest as Request<{ id: string }> & { cedenteId: number },
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: "UUID é obrigatório" });
    });

    it("deve retornar erro 400 se protocolo não encontrado", async () => {
      const mockRequest: Partial<Request<{ id: string }>> & {
        cedenteId: number;
      } = {
        params: { id: "123e4567-e89b-12d3-a456-426614174000" },
        cedenteId: 1,
      };
      (mockService.getProtocoloById as jest.Mock).mockResolvedValue(null);

      await protocolosController.getProtolocoById(
        mockRequest as Request<{ id: string }> & { cedenteId: number },
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Protocolo não encontrado.",
      });
    });

    it("deve retornar sucesso (200) se id existir", async () => {
      const mockRequest: Partial<Request<{ id: string }>> & {
        cedenteId: number;
      } = {
        params: { id: "123e4567-e89b-12d3-a456-426614174000" },
        cedenteId: 1,
      };
      (mockService.getProtocoloById as jest.Mock).mockResolvedValue({
        id: "123e4567-e89b-12d3-a456-426614174000",
      });

      await protocolosController.getProtolocoById(
        mockRequest as Request<{ id: string }> & { cedenteId: number },
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        id: "123e4567-e89b-12d3-a456-426614174000",
      });
    });
  });

  describe("Performance", () => {
    it("deve processar request em tempo aceitável para getProtocolos", async () => {
      const mockRequest: Partial<Request<{}, {}, any>> & { cedenteId: number } =
        {
          body: {
            start_date: "2025-10-01",
            end_date: "2025-10-10",
            product: "BOLETO",
            id: [1],
            kind: "webhook",
            type: "DISPONIVEL",
          },
          cedenteId: 1,
        };
      (mockService.getProtocolos as jest.Mock).mockResolvedValue([]);
      const start = Date.now();
      await protocolosController.getProtocolos(
        mockRequest as Request<{}, {}, any> & { cedenteId: number },
        mockResponse as Response,
      );
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000);
    });

    it("deve processar request em tempo aceitável para getProtolocoById", async () => {
      const mockRequest: Partial<Request<{ id: string }>> & {
        cedenteId: number;
      } = {
        params: { id: "123e4567-e89b-12d3-a456-426614174000" },
        cedenteId: 1,
      };
      (mockService.getProtocoloById as jest.Mock).mockResolvedValue({});
      const start = Date.now();
      await protocolosController.getProtolocoById(
        mockRequest as Request<{ id: string }> & { cedenteId: number },
        mockResponse as Response,
      );
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000);
    });
  });
});
