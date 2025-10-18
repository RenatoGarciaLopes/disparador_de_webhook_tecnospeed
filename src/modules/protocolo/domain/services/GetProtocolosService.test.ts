import { GetProtocolosService } from "./GetProtocolosService";
import { GetProtocolosUseCase } from "../../application/use-cases/protocolo/GetProtocolosUseCase";
import { ProtocolosSchemaDTO } from "../../interfaces/http/validators/ProtocolosSchema";
import { ProtocoloParamSchemaDTO } from "../../interfaces/http/validators/ProtocoloParamSchema";

describe("[Service] GetProtocolosService - Bandeira RED", () => {
  let getProtocolosUseCase: jest.Mocked<GetProtocolosUseCase>;
  let getProtocolosService: GetProtocolosService;

  beforeEach(() => {
    getProtocolosUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetProtocolosUseCase>;

    getProtocolosService = new GetProtocolosService(getProtocolosUseCase);
  });

  it("deve retornar dados do use case quando filtros válidos forem fornecidos", async () => {
    const dto: ProtocolosSchemaDTO = {
      start_date: new Date("2025-01-01"),
      end_date: new Date("2025-01-20"),
      product: "PIX",
      id: ["1", "2"],
      kind: "webhook",
      type: "disponivel",
    };

    getProtocolosUseCase.execute.mockResolvedValue([]);

    const result = await getProtocolosService.getProtocolos(1, dto);

    expect(getProtocolosUseCase.execute).toHaveBeenCalledTimes(1);
    expect(getProtocolosUseCase.execute).toHaveBeenCalledWith(dto, 1);
    expect(result).toEqual([]);
  });

  it("deve retornar protocolo individual se uuid for fornecido", async () => {
    const dto: ProtocoloParamSchemaDTO = { id: "uuid-123" };

    const result = await getProtocolosService.getProtocoloById(1, dto);

    expect(result).toEqual([]);
  });

  it("deve lançar erro se uuid não for fornecido na consulta individual", async () => {
    const dto: ProtocoloParamSchemaDTO = { id: undefined as any };

    await expect(
      getProtocolosService.getProtocoloById(1, dto),
    ).rejects.toThrow();
  });
});
