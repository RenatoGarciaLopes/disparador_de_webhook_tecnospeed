import { WebhookReprocessado } from "@/sequelize/models/webhookreprocessado.model";
import { WebhookReprocessadoRepository } from "./WebHookReprocessadoRespository";

describe("[Repository] /webhook - WebhookReprocessadoRepository", () => {
  let repository: WebhookReprocessadoRepository;

  beforeEach(() => {
    repository = new WebhookReprocessadoRepository();
  });

  // findALL
  it("deve retornar os protocolos encontrados", async () => {
    jest.spyOn(WebhookReprocessado, "findAll").mockResolvedValue([
      {
        dataValues: {
          id: "1",
        },
      },
      {
        dataValues: {
          id: "2",
        },
      },
    ] as unknown as WebhookReprocessado[]);
    const webhookReprocessadoRepository = new WebhookReprocessadoRepository();
    const webhookReprocessados = await webhookReprocessadoRepository.findAll(
      1,
      new Date(),
      new Date(),
    );
    expect(webhookReprocessados).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ dataValues: { id: "1" } }),
        expect.objectContaining({ dataValues: { id: "2" } }),
      ]),
    );
  });

  it("deve retornar os protocolos encontrados com filtros", async () => {
    jest.spyOn(WebhookReprocessado, "findAll").mockResolvedValue([
      {
        dataValues: {
          id: "1",
        },
      },
      {
        dataValues: {
          id: "2",
        },
      },
    ] as unknown as WebhookReprocessado[]);
    const webhookReprocessadoRepository = new WebhookReprocessadoRepository();
    const webhookReprocessados = await webhookReprocessadoRepository.findAll(
      1,
      new Date(),
      new Date(),
      "BOLETO",
      ["1", "2"],
      "webhook",
      "pago",
    );
    expect(webhookReprocessados).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ dataValues: { id: "1" } }),
        expect.objectContaining({ dataValues: { id: "2" } }),
      ]),
    );
  });

  it("deve retornar um array vazio se os protocolos não forem encontrados", async () => {
    jest
      .spyOn(WebhookReprocessado, "findAll")
      .mockResolvedValue([] as unknown as WebhookReprocessado[]);
    const webhookReprocessadoRepository = new WebhookReprocessadoRepository();
    const webhookReprocessados = await webhookReprocessadoRepository.findAll(
      1,
      new Date(),
      new Date(),
    );
    expect(webhookReprocessados).toEqual([]);
  });

  // findById
  it("deve retornar protocolo se encontrado", async () => {
    jest.spyOn(WebhookReprocessado, "findOne").mockResolvedValue({
      dataValues: { id: "uuid-123", status: "sent" },
    } as any);

    const result = await repository.findById("uuid-123", 1);

    expect(result).toEqual(
      expect.objectContaining({ dataValues: { id: "uuid-123" } }),
    );
  });

  it("deve lançar erro se protocolo não for encontrado", async () => {
    jest.spyOn(WebhookReprocessado, "findOne").mockResolvedValue(null);

    await expect(repository.findById("uuid-invalido", 1)).rejects.toThrow(
      "Protocolo não encontrado.",
    );
  });
});
