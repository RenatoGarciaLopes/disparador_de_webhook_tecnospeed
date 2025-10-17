import { Servico } from "@/sequelize/models/servico.model";
import { ServicoRepository } from "./ServicoRepository";

describe("[Repository] /webhook - ServicoRepository", () => {
  it("deve retornar os serviços encontrados", async () => {
    jest
      .spyOn(Servico, "findAll")
      .mockResolvedValue([
        { dataValues: { id: 1 } },
        { dataValues: { id: 2 } },
      ] as unknown as Servico[]);
    const servicoRepository = new ServicoRepository();
    const servicos = await servicoRepository.findAllByIds([1, 2, 3]);
    expect(servicos).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ dataValues: { id: 1 } }),
        expect.objectContaining({ dataValues: { id: 2 } }),
      ]),
    );
  });

  it("deve retornar um array vazio se os serviços não forem encontrados", async () => {
    jest
      .spyOn(Servico, "findAll")
      .mockResolvedValue([] as unknown as Servico[]);
    const servicoRepository = new ServicoRepository();
    const servicos = await servicoRepository.findAllByIds([1, 2, 3]);
    expect(servicos).toEqual([]);
  });
});
