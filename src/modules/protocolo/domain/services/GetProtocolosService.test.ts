import { GetProtocolosService } from "./GetProtocolosService";
import { GetProtocolosUseCase } from "../../application/use-cases/protocolo/GetProtocolosUseCase";
import { GetProtocoloByIdUseCase } from "../../application/use-cases/protocolo/GetProtocoloByIdUseCase";
import { ProtocolosSchemaDTO } from "../../interfaces/http/validators/ProtocolosSchema";
import { ProtocoloParamSchemaDTO } from "../../interfaces/http/validators/ProtocoloParamSchema";
import { WebhookReprocessado } from "@/sequelize/models/webhookreprocessado.model";
import { ErrorResponse } from "@/shared/errors/ErrorResponse";

describe("[Service] GetProtocolosService - Bandeira RED", () => {
  let getProtocolosUseCase: jest.Mocked<GetProtocolosUseCase>;
  let getProtocoloByIdUseCase: jest.Mocked<GetProtocoloByIdUseCase>;
  let getProtocolosService: GetProtocolosService;

  beforeEach(() => {
    getProtocolosUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetProtocolosUseCase>;
    getProtocoloByIdUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetProtocoloByIdUseCase>;
    getProtocolosService = new GetProtocolosService(
      getProtocolosUseCase,
      getProtocoloByIdUseCase,
    );
  });

  it("deve retornar dados do use case quando filtros válidos forem fornecidos", async () => {
    const dto: ProtocolosSchemaDTO = {
      start_date: new Date("2025-01-01"),
      end_date: new Date("2025-01-20"),
      product: "PIX",
      id: ["1", "2"],
      kind: "webhook",
      type: "DISPONIVEL",
    };

    const mockResult: WebhookReprocessado[] = [
      { id: "1" } as WebhookReprocessado,
    ];
    getProtocolosUseCase.execute.mockResolvedValue(mockResult);

    const result = await getProtocolosService.getProtocolos(1, dto);

    expect(getProtocolosUseCase.execute).toHaveBeenCalledWith(dto, 1);
    expect(result).toEqual(mockResult);
  });

  it("deve retornar protocolo individual se uuid for fornecido", async () => {
    const dto: ProtocoloParamSchemaDTO = { id: "uuid-123" };
    const mockResult: WebhookReprocessado = { id: "1" } as WebhookReprocessado;

    getProtocoloByIdUseCase.execute.mockResolvedValue(mockResult);

    const result = await getProtocolosService.getProtocoloById(1, dto);

    expect(getProtocoloByIdUseCase.execute).toHaveBeenCalledWith(dto, 1);
    expect(result).toEqual(mockResult);
  });

  it("deve lançar erro se uuid não for fornecido na consulta individual", async () => {
    const dto: ProtocoloParamSchemaDTO = { id: undefined as any };

    await expect(getProtocolosService.getProtocoloById(1, dto)).rejects.toThrow(
      "ID do protocolo é obrigatório",
    );
  });

  it("deve propagar erro do use case ao buscar protocolos", async () => {
    const dto: ProtocolosSchemaDTO = {
      start_date: new Date(),
      end_date: new Date(),
      product: undefined,
      id: undefined,
      kind: undefined,
      type: undefined,
    };

    const erroMock = new Error("Banco fora do ar");
    getProtocolosUseCase.execute.mockRejectedValue(erroMock);

    await expect(getProtocolosService.getProtocolos(1, dto)).rejects.toThrow(
      erroMock,
    );
  });

  it("deve propagar erro do use case ao buscar protocolo por id", async () => {
    const dto: ProtocoloParamSchemaDTO = { id: "uuid-123" };
    const erroMock = new Error("Banco fora do ar");

    getProtocoloByIdUseCase.execute.mockRejectedValue(erroMock);

    await expect(getProtocolosService.getProtocoloById(1, dto)).rejects.toThrow(
      erroMock,
    );
  });

  it("deve lançar erro se o use case retornar null ao buscar protocolo por id", async () => {
    const dto: ProtocoloParamSchemaDTO = { id: "uuid-123" };
    getProtocoloByIdUseCase.execute.mockResolvedValue(null);

    await expect(getProtocolosService.getProtocoloById(1, dto)).rejects.toThrow(
      `Protocolo com ID ${dto.id} não encontrado`,
    );
  });
});
