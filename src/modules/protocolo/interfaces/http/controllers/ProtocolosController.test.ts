import { Request, Response } from "express";
import { ProtocolosController } from "./ProtocolosController";
import { ProtocolosSchemaDTO } from "../validators/ProtocolosSchema";
import { ProtocoloParamSchemaDTO } from "../validators/ProtocoloParamSchema";

describe("[Controller] /protocolo - ProtocolosController", () => {
  let protocolosController: ProtocolosController;
  let mockRequest: Partial<Request> & { cedenteId?: number; body?: any };
  let mockResponse: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    protocolosController = new ProtocolosController();
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    mockRequest = {};
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Listagem de Protocolos (GET /protocolo)", () => {
    it("deve retornar erro se start_date ou end_date não forem informados", async () => {
      mockRequest.body = {};
      mockRequest.cedenteId = 1;
      await protocolosController.getProtocolos(
        mockRequest as Request & { cedenteId: number },
        mockResponse as Response,
      );
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("deve validar intervalo de datas permitido", async () => {
      mockRequest.body = { start_date: "2025-10-01", end_date: "2025-09-01" };
      mockRequest.cedenteId = 1;
      await protocolosController.getProtocolos(
        mockRequest as Request & { cedenteId: number },
        mockResponse as Response,
      );
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("deve validar campos opcionais (product, id, kind, type)", async () => {
      mockRequest.body = {
        start_date: "2025-10-01",
        end_date: "2025-10-10",
        product: "INVALID",
        id: [1, 2],
        kind: "INVALID",
        type: "INVALID",
      };
      mockRequest.cedenteId = 1;
      await protocolosController.getProtocolos(
        mockRequest as Request & { cedenteId: number },
        mockResponse as Response,
      );
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("deve retornar sucesso (200) se filtros e dados estiverem corretos", async () => {
      mockRequest.body = {
        start_date: "2025-10-01",
        end_date: "2025-10-10",
        product: "BOLETO",
        id: [1, 2],
        kind: "webhook",
        type: "DISPONIVEL",
      };
      mockRequest.cedenteId = 1;
      await protocolosController.getProtocolos(
        mockRequest as Request & { cedenteId: number },
        mockResponse as Response,
      );
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    describe("Consulta Individual de Protocolo (GET /protocolo/:uuid)", () => {
      it("deve retornar erro se uuid não for informado", async () => {
        mockRequest.params = {};
        mockRequest.cedenteId = 1;
        await protocolosController.getProtolocoById(
          mockRequest as Request & { cedenteId: number },
          mockResponse as Response,
        );
        expect(statusMock).toHaveBeenCalledWith(400);
      });

      it("deve retornar erro 400 se protocolo não encontrado", async () => {
        mockRequest.params = { uuid: "uuid-invalido" };
        mockRequest.cedenteId = 1;
        await protocolosController.getProtolocoById(
          mockRequest as Request & { cedenteId: number },
          mockResponse as Response,
        );
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          message: "Protocolo não encontrado.",
        });
      });

      it("deve retornar sucesso (200) se uuid existir e status for 'sent'", async () => {
        mockRequest.params = { uuid: "uuid-teste" };
        mockRequest.cedenteId = 1;
        await protocolosController.getProtolocoById(
          mockRequest as Request & { cedenteId: number },
          mockResponse as Response,
        );
        expect(statusMock).toHaveBeenCalledWith(200);
      });

      describe("Performance", () => {
        it("deve processar request em tempo aceitável", async () => {
          const start = Date.now();

          await protocolosController.getProtocolos(
            mockRequest as Request<{}, {}, ProtocolosSchemaDTO> & {
              cedenteId: number;
            },
            mockResponse as Response,
          );

          const duration = Date.now() - start;
          expect(duration).toBeLessThan(5000);
        });

        it("deve processar request em tempo aceitável", async () => {
          const start = Date.now();

          await protocolosController.getProtolocoById(
            mockRequest as Request<{}, {}, ProtocoloParamSchemaDTO> & {
              cedenteId: number;
            },
            mockResponse as Response,
          );

          const duration = Date.now() - start;
          expect(duration).toBeLessThan(5000);
        });
      });
    });
  });
});
