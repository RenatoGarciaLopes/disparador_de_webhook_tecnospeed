import { WebhookReprocessado } from "@/sequelize/models/webhookreprocessado.model";
import { WebhookReprocessadoRepository } from "./WebHookReprocessadoRespository";
import { Op } from "sequelize";

describe("[Repository] /webhook - WebhookReprocessadoRepository", () => {
  let repository: WebhookReprocessadoRepository;

  beforeEach(() => {
    repository = new WebhookReprocessadoRepository();
    jest.clearAllMocks();
  });

  it("deve aplicar corretamente todos os filtros e operadores na query", async () => {
    const findAllSpy = jest
      .spyOn(WebhookReprocessado, "findAll")
      .mockResolvedValue([]);

    const start_date = new Date("2025-01-01");
    const end_date = new Date("2025-01-31");
    const cedente_id = 1;
    const product = "BOLETO";
    const servico_ids = ["1", "2"];
    const kind = "webhook";
    const type = "pago";

    await repository.findAll(
      cedente_id,
      start_date,
      end_date,
      product,
      servico_ids,
      kind,
      type,
    );

    expect(findAllSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          cedente_id,
          product,
          kind,
          type,
          servico_id: { [Op.contains]: servico_ids },
          data_criacao: { [Op.between]: [start_date, end_date] },
        }),
      }),
    );
  });

  it("deve garantir que cedente_id sempre é incluído na query", async () => {
    const findAllSpy = jest
      .spyOn(WebhookReprocessado, "findAll")
      .mockResolvedValue([]);

    const cedente_id = 999;
    const start_date = new Date("2025-03-01");
    const end_date = new Date("2025-03-31");

    await repository.findAll(cedente_id, start_date, end_date);

    expect(findAllSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ cedente_id }),
      }),
    );
  });

  it("deve aplicar corretamente Op.between no filtro de data", async () => {
    const findAllSpy = jest
      .spyOn(WebhookReprocessado, "findAll")
      .mockResolvedValue([]);

    const start_date = new Date("2025-02-01");
    const end_date = new Date("2025-02-10");

    await repository.findAll(1, start_date, end_date);

    expect(findAllSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          data_criacao: { [Op.between]: [start_date, end_date] },
        }),
      }),
    );
  });

  it("deve aplicar corretamente Op.contains quando servico_ids é fornecido", async () => {
    const findAllSpy = jest
      .spyOn(WebhookReprocessado, "findAll")
      .mockResolvedValue([]);

    const start_date = new Date("2025-04-01");
    const end_date = new Date("2025-04-30");
    const servico_ids = ["123", "456"];

    await repository.findAll(1, start_date, end_date, undefined, servico_ids);

    expect(findAllSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          servico_id: { [Op.contains]: servico_ids },
        }),
      }),
    );
  });

  it("deve incluir filtros opcionais se fornecidos", async () => {
    const findAllSpy = jest
      .spyOn(WebhookReprocessado, "findAll")
      .mockResolvedValue([]);

    const start_date = new Date("2025-05-01");
    const end_date = new Date("2025-05-31");
    const product = "BOLETO";
    const kind = "webhook";

    await repository.findAll(1, start_date, end_date, product, undefined, kind);

    expect(findAllSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          product,
          kind,
        }),
      }),
    );
  });

  it("deve retornar os protocolos encontrados", async () => {
    jest
      .spyOn(WebhookReprocessado, "findAll")
      .mockResolvedValue([
        { dataValues: { id: "1" } },
        { dataValues: { id: "2" } },
      ] as unknown as WebhookReprocessado[]);

    const start_date = new Date("2025-06-01");
    const end_date = new Date("2025-06-30");
    const result = await repository.findAll(1, start_date, end_date);

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ dataValues: { id: "1" } }),
        expect.objectContaining({ dataValues: { id: "2" } }),
      ]),
    );
  });

  it("deve retornar um array vazio se nenhum registro for encontrado", async () => {
    jest.spyOn(WebhookReprocessado, "findAll").mockResolvedValue([]);

    const start_date = new Date("2025-07-01");
    const end_date = new Date("2025-07-31");
    const result = await repository.findAll(1, start_date, end_date);

    expect(result).toEqual([]);
  });

  it("deve retornar protocolo se encontrado pelo ID", async () => {
    jest.spyOn(WebhookReprocessado, "findOne").mockResolvedValue({
      dataValues: { id: "uuid-123" },
    } as any);

    const result = await repository.findById("uuid-123", 1);

    expect(result).toEqual(
      expect.objectContaining({ dataValues: { id: "uuid-123" } }),
    );
  });
});
