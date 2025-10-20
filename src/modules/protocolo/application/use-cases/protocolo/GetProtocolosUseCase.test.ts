import { WebhookReprocessadoRepository } from "../../../infrastructure/database/repositories/WebHookReprocessadoRespository";
import { WebhookReprocessado } from "@/sequelize/models/webhookreprocessado.model";
import { ProtocolosSchemaDTO } from "@/modules/protocolo/interfaces/http/validators/ProtocolosSchema";
import { GetProtocolosUseCase } from "./GetProtocolosUseCase";
import { ErrorResponse } from "@/shared/errors/ErrorResponse";

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
      id: ["1", "2"],
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
      dto.id,
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
      id: ["10"],
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
      dto.id,
      dto.kind,
      dto.type,
    );
    expect(result).toEqual(mockData);
  });

  it("deve retornar um array vazio quando não houver registros", async () => {
    const dto: ProtocolosSchemaDTO = {
      start_date: new Date(),
      end_date: new Date(),
      product: "PIX",
      id: [],
      kind: "webhook",
      type: "pendente",
    };

    repository.findAll.mockResolvedValue([]);

    const result = await useCase.execute(dto, 1);

    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual([]);
  });

  it("deve lançar erro se start_date e end_date não forem informados", async () => {
    const data = {} as any;

    await expect(useCase.execute(data, 1)).rejects.toThrow(
      "Start date e end date são obrigatórios",
    );

    expect(repository.findAll).not.toHaveBeenCalled();
  });

  it("deve lançar erro interno do servidor se o repositório falhar", async () => {
    const data = {
      start_date: new Date("2025-01-01"),
      end_date: new Date("2025-01-02"),
      product: "BOLETO",
      id: ["1", "2"],
      kind: "webhook",
      type: "pago",
    };

    const mockError = new Error("Erro no banco");

    repository.findAll.mockRejectedValue(mockError);

    await expect(useCase.execute(data, 1)).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      statusCode: 500,
      error: { errors: ["Erro no banco"] },
    });
  });
});
