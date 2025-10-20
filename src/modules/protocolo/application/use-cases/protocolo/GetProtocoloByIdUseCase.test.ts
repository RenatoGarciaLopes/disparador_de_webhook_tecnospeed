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

  it("deve lançar erro se id não for fornecido", async () => {
    const dto: ProtocoloParamSchemaDTO = { id: undefined as any };

    await expect(useCase.execute(dto, 1)).rejects.toThrow(
      "ID do protocolo é obrigatório",
    );
    expect(repository.findById).not.toHaveBeenCalled();
  });

  it("deve chamar o repositório com o cedente correto", async () => {
    const dto: ProtocoloParamSchemaDTO = { id: "uuid-123" };
    repository.findById.mockResolvedValue({ id: "uuid-123" } as any);

    await useCase.execute(dto, 99);

    expect(repository.findById).toHaveBeenCalledWith("uuid-123", 99);
  });

  it("deve propagar erro do repositório", async () => {
    const dto: ProtocoloParamSchemaDTO = { id: "uuid-123" };
    const erroMock = new Error("Banco fora do ar");
    repository.findById.mockRejectedValue(erroMock);

    await expect(useCase.execute(dto, 1)).rejects.toThrow(erroMock);
  });
});
