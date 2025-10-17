import { WebhookReprocessado } from "@/sequelize/models/webhookreprocessado.model";
import { WebhookReprocessadoRepository } from "./WebHookReprocessadoRespository";

describe("[Repository] /webhook - WebhookReprocessadoRepository", () => {
  it("deve retornar os serviços encontrados", async () => {
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

  it("deve retornar os serviços encontrados com filtros", async () => {
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

  it("deve retornar um array vazio se os serviços não forem encontrados", async () => {
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
});
