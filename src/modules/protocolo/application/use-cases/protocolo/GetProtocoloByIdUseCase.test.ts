import { GetProtocoloByIdUseCase } from "./GetProtocoloByIdUseCase";
import { WebhookReprocessadoRepository } from "../../../infrastructure/database/repositories/WebHookReprocessadoRespository";
import { ProtocoloParamSchemaDTO } from "@/modules/protocolo/interfaces/http/validators/ProtocoloParamSchema";

describe("[UseCase] GetProtocoloByIdUseCase - Bandeira RED", () => {
  let repository: jest.Mocked<WebhookReprocessadoRepository>;
  let useCase: GetProtocoloByIdUseCase;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<WebhookReprocessadoRepository>;

    useCase = new GetProtocoloByIdUseCase(repository);
  });

  it("deve retornar protocolo se encontrado", async () => {
    const dto: ProtocoloParamSchemaDTO = { id: "uuid-123" };

    repository.findById.mockResolvedValue({
      dataValues: { id: "uuid-123" },
    } as any);

    const result = await useCase.execute(dto, 1);

    expect(repository.findById).toHaveBeenCalledTimes(1);
    expect(repository.findById).toHaveBeenCalledWith("uuid-123", 1);
    expect(result).toEqual(
      expect.objectContaining({ dataValues: { id: "uuid-123" } }),
    );
  });

  it("deve lançar erro se protocolo não for encontrado", async () => {
    const dto: ProtocoloParamSchemaDTO = { id: "uuid-invalido" };

    repository.findById.mockResolvedValue(null as any);

    await expect(useCase.execute(dto, 1)).rejects.toThrow(
      "Protocolo não encontrado.",
    );
  });
});
