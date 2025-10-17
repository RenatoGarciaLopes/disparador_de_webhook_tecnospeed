import { WebhookReprocessadoRepository } from "../../../infrastructure/database/repositories/WebHookReprocessadoRespository";
import { WebhookReprocessado } from "@/sequelize/models/webhookreprocessado.model";
import { ProtocolosSchemaDTO } from "@/modules/protocolo/interfaces/http/validators/ProtocolosSchema";
import { GetProtocolosUseCase } from "./GetProtocolosUseCase";

describe("[UseCase] GetProtocoloUseCase", () => {
  let repository: jest.Mocked<WebhookReprocessadoRepository>;
  let useCase: GetProtocolosUseCase;

  beforeEach(() => {
    repository = {
      findAll: jest.fn(),
    } as unknown as jest.Mocked<WebhookReprocessadoRepository>;

    useCase = new GetProtocolosUseCase(repository);
  });

  it("deve chamar o repositório com os parâmetros corretos", async () => {
    const dto: ProtocolosSchemaDTO = {
      start_date: new Date("2025-01-01"),
      end_date: new Date("2025-01-31"),
      product: "BOLETO",
      servico_ids: ["1", "2"],
      kind: "webhook",
      type: "pago",
    };

    repository.findAll.mockResolvedValue([] as WebhookReprocessado[]);

    const result = await useCase.execute(dto, 1);

    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(repository.findAll).toHaveBeenCalledWith(
      1,
      dto.start_date,
      dto.end_date,
      dto.product,
      dto.servico_ids,
      dto.kind,
      dto.type,
    );

    expect(result).toEqual([]);
  });

  it("deve retornar dados do repositório quando houver registros", async () => {
    const dto: ProtocolosSchemaDTO = {
      start_date: new Date(),
      end_date: new Date(),
      product: "PIX",
      servico_ids: ["10"],
      kind: "webhook",
      type: "pendente",
    };

    const mockData: WebhookReprocessado[] = [
      { id: "1", dataValues: { id: "1" } } as any,
      { id: "2", dataValues: { id: "2" } } as any,
    ];

    repository.findAll.mockResolvedValue(mockData);

    const result = await useCase.execute(dto, 2);

    expect(repository.findAll).toHaveBeenCalledWith(
      2,
      dto.start_date,
      dto.end_date,
      dto.product,
      dto.servico_ids,
      dto.kind,
      dto.type,
    );
    expect(result).toEqual(mockData);
  });

  it("deve propagar erros do repositório", async () => {
    const dto: ProtocolosSchemaDTO = {
      start_date: new Date(),
      end_date: new Date(),
      product: "BOLETO",
      servico_ids: [],
      kind: "webhook",
      type: "cancelado",
    };

    repository.findAll.mockRejectedValue(new Error("Erro no banco"));

    await expect(useCase.execute(dto, 1)).rejects.toThrow("Erro no banco");
  });
});
