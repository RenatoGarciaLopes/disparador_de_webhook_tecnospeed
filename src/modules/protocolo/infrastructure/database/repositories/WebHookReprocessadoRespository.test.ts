import { WebhookReprocessado } from "@/sequelize/models/webhookreprocessado.model";
import { Op } from "sequelize";
import { WebhookReprocessadoRepository } from "./WebHookReprocessadoRespository";

describe("[Repository] /webhook - WebhookReprocessadoRepository", () => {
  let repository: WebhookReprocessadoRepository;

  beforeEach(() => {
    repository = new WebhookReprocessadoRepository();
    jest.clearAllMocks();
  });

  it("deve retornar os protocolos encontrados", async () => {
    jest
      .spyOn(WebhookReprocessado, "findAll")
      .mockResolvedValue([
        { dataValues: { id: "1" } },
        { dataValues: { id: "2" } },
      ] as unknown as WebhookReprocessado[]);
    jest.spyOn(WebhookReprocessado, "count").mockResolvedValue(2);

    const result = await repository.findAll(1, new Date(), new Date());
    expect(result).toEqual({
      data: [{ id: "1" }, { id: "2" }],
      total: 2,
    });
  });

  it("deve retornar protocolos com filtros aplicados", async () => {
    jest
      .spyOn(WebhookReprocessado, "findAll")
      .mockResolvedValue([
        { dataValues: { id: "1" } },
        { dataValues: { id: "2" } },
      ] as unknown as WebhookReprocessado[]);
    jest.spyOn(WebhookReprocessado, "count").mockResolvedValue(2);

    const result = await repository.findAll(
      1,
      new Date(),
      new Date(),
      "BOLETO",
      ["1", "2"],
      "webhook",
      "pago",
    );

    expect(result).toEqual({
      data: [{ id: "1" }, { id: "2" }],
      total: 2,
    });
  });

  it("deve retornar array vazio se nenhum protocolo for encontrado", async () => {
    jest.spyOn(WebhookReprocessado, "findAll").mockResolvedValue([] as any);
    jest.spyOn(WebhookReprocessado, "count").mockResolvedValue(0);

    const result = await repository.findAll(1, new Date(), new Date());
    expect(result).toEqual({
      data: [],
      total: 0,
    });
  });

  it("não deve aplicar Op.contains se servico_ids estiver vazio ou indefinido", async () => {
    const spy = jest
      .spyOn(WebhookReprocessado, "findAll")
      .mockResolvedValue([] as any);
    jest.spyOn(WebhookReprocessado, "count").mockResolvedValue(0);

    await repository.findAll(1, new Date(), new Date());
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({ servico_id: expect.anything() }),
      }),
    );

    await repository.findAll(1, new Date(), new Date(), undefined, []);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({ servico_id: expect.anything() }),
      }),
    );
  });

  it("deve aplicar Op.contains quando servico_ids for fornecido", async () => {
    const ids = ["1", "2"];
    const spy = jest
      .spyOn(WebhookReprocessado, "findAll")
      .mockResolvedValue([] as any);
    jest.spyOn(WebhookReprocessado, "count").mockResolvedValue(0);

    await repository.findAll(1, new Date(), new Date(), undefined, ids);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          servico_id: { [Op.contains]: ids },
        }),
      }),
    );
  });

  it("deve filtrar data_criacao usando Op.between", async () => {
    const spy = jest
      .spyOn(WebhookReprocessado, "findAll")
      .mockResolvedValue([] as any);
    jest.spyOn(WebhookReprocessado, "count").mockResolvedValue(0);

    const start = new Date("2025-01-01");
    const end = new Date("2025-01-31");

    await repository.findAll(1, start, end);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          data_criacao: { [Op.between]: [start, end] },
        }),
      }),
    );
  });

  it("deve retornar protocolo se encontrado", async () => {
    jest.spyOn(WebhookReprocessado, "findOne").mockResolvedValue({
      dataValues: { protocolo: "uuid-123" },
    } as any);

    const result = await repository.findById("uuid-123", 1);
    expect(result).toEqual({ protocolo: "uuid-123" });
  });

  it("deve retornar undefined se protocolo não for encontrado", async () => {
    jest.spyOn(WebhookReprocessado, "findOne").mockResolvedValue(null);

    const result = await repository.findById("non-existent", 1);
    expect(result).toBeUndefined();
  });

  it("deve buscar pelo campo protocolo corretamente", async () => {
    const spy = jest.spyOn(WebhookReprocessado, "findOne").mockResolvedValue({
      dataValues: { protocolo: "uuid-123" },
    } as any);

    await repository.findById("uuid-123", 1);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { protocolo: "uuid-123", cedente_id: 1 },
      }),
    );
  });

  it("findAll deve filtrar apenas protocolos do cedente correto", async () => {
    const spy = jest
      .spyOn(WebhookReprocessado, "findAll")
      .mockResolvedValue([] as any);
    jest.spyOn(WebhookReprocessado, "count").mockResolvedValue(0);

    const cedenteId = 10;
    await repository.findAll(cedenteId, new Date(), new Date());

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ cedente_id: cedenteId }),
      }),
    );
  });

  it("findById deve filtrar apenas protocolo do cedente correto", async () => {
    const spy = jest.spyOn(WebhookReprocessado, "findOne").mockResolvedValue({
      dataValues: { protocolo: "uuid-123", cedente_id: 10 },
    } as any);

    const cedenteId = 10;
    await repository.findById("uuid-123", cedenteId);

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { protocolo: "uuid-123", cedente_id: cedenteId },
      }),
    );
  });

  it("deve aplicar limit quando fornecido", async () => {
    const spy = jest
      .spyOn(WebhookReprocessado, "findAll")
      .mockResolvedValue([] as any);
    jest.spyOn(WebhookReprocessado, "count").mockResolvedValue(0);

    await repository.findAll(
      1,
      new Date(),
      new Date(),
      undefined,
      undefined,
      undefined,
      undefined,
      10,
    );

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 10,
      }),
    );
  });

  it("deve aplicar offset quando fornecido", async () => {
    const spy = jest
      .spyOn(WebhookReprocessado, "findAll")
      .mockResolvedValue([] as any);
    jest.spyOn(WebhookReprocessado, "count").mockResolvedValue(0);

    await repository.findAll(
      1,
      new Date(),
      new Date(),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      5,
    );

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        offset: 5,
      }),
    );
  });

  it("deve aplicar limit e offset quando ambos forem fornecidos", async () => {
    const spy = jest
      .spyOn(WebhookReprocessado, "findAll")
      .mockResolvedValue([] as any);
    jest.spyOn(WebhookReprocessado, "count").mockResolvedValue(0);

    await repository.findAll(
      1,
      new Date(),
      new Date(),
      undefined,
      undefined,
      undefined,
      undefined,
      10,
      5,
    );

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 10,
        offset: 5,
      }),
    );
  });

  it("não deve aplicar limit quando não for fornecido", async () => {
    const spy = jest
      .spyOn(WebhookReprocessado, "findAll")
      .mockResolvedValue([] as any);
    jest.spyOn(WebhookReprocessado, "count").mockResolvedValue(0);

    await repository.findAll(1, new Date(), new Date());

    expect(spy).toHaveBeenCalledWith(
      expect.not.objectContaining({
        limit: expect.anything(),
      }),
    );
  });

  it("não deve aplicar offset quando não for fornecido", async () => {
    const spy = jest
      .spyOn(WebhookReprocessado, "findAll")
      .mockResolvedValue([] as any);
    jest.spyOn(WebhookReprocessado, "count").mockResolvedValue(0);

    await repository.findAll(1, new Date(), new Date());

    expect(spy).toHaveBeenCalledWith(
      expect.not.objectContaining({
        offset: expect.anything(),
      }),
    );
  });
});
