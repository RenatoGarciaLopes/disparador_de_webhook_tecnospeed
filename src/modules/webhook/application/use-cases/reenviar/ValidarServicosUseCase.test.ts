import { Servico } from "@/sequelize/models/servico.model";
import { ServicoRepository } from "../../../infrastructure/database/repositories/ServicoRepository";
import { ValidarServicosUseCase } from "./ValidarServicosUseCase";

describe("[Use Case] /reenviar - ValidarServicosUseCase", () => {
  let validarServicosUseCase: ValidarServicosUseCase;

  beforeEach(() => {
    validarServicosUseCase = new ValidarServicosUseCase(
      new ServicoRepository(),
    );
  });

  it("deve lançar um erro se o Cendente validado nas headers não correspondente ao Cedente dos `Servico`s encontrados", async () => {
    jest.spyOn(ServicoRepository.prototype, "findAllByIds").mockResolvedValue([
      {
        dataValues: {
          id: 1,
          status: "ativo",
          produto: "BOLETO",
          situacao: "cancelado",
        },
        convenio: {
          conta: {
            cedente: {
              dataValues: {
                id: 2,
                cnpj: "invalido",
                token: "invalido",
              },
            },
          },
        },
      } as unknown as Servico,
    ]);

    const data = {
      product: "boleto",
      id: [1],
      kind: "webhook",
      type: "disponivel",
    };

    await expect(validarServicosUseCase.execute(data, 1)).rejects.toEqual(
      expect.objectContaining({
        code: "INVALID_FIELDS",
        error: expect.objectContaining({
          properties: expect.objectContaining({
            id: expect.objectContaining({
              errors: expect.arrayContaining([
                "O serviço com o ID 1 não foi encontrado para o Cedente informado.",
              ]),
            }),
          }),
        }),
      }),
    );
  });

  it("deve lançar um erro se algum dos IDs não existem na tabela `Servico`", async () => {
    jest
      .spyOn(ServicoRepository.prototype, "findAllByIds")
      .mockResolvedValue([
        { dataValues: { id: 1 } },
        { dataValues: { id: 2 } },
      ] as Servico[]);

    const data = {
      product: "boleto",
      id: [1, 2, 3, 5],
      kind: "webhook",
      type: "disponivel",
    };

    await expect(validarServicosUseCase.execute(data, 1)).rejects.toEqual(
      expect.objectContaining({
        code: "INVALID_FIELDS",
        error: expect.objectContaining({
          properties: expect.objectContaining({
            id: expect.objectContaining({
              errors: expect.arrayContaining([
                "O serviço com o ID 3 não foi encontrado na tabela `Servico`.",
                "O serviço com o ID 5 não foi encontrado na tabela `Servico`.",
              ]),
            }),
          }),
        }),
      }),
    );
  });

  it("deve lançar um erro se algum dos IDs não estiver `ativo`", async () => {
    jest
      .spyOn(ServicoRepository.prototype, "findAllByIds")
      .mockResolvedValue([
        { dataValues: { id: 1, status: "ativo" } },
        { dataValues: { id: 2, status: "inativo" } },
      ] as Servico[]);

    const data = {
      product: "boleto",
      id: [1, 2],
      kind: "webhook",
      type: "disponivel",
    };

    await expect(validarServicosUseCase.execute(data, 1)).rejects.toEqual(
      expect.objectContaining({
        code: "INVALID_FIELDS",
        error: expect.objectContaining({
          properties: expect.objectContaining({
            id: expect.objectContaining({
              errors: expect.arrayContaining([
                "O serviço com o ID 2 não está ativo.",
              ]),
            }),
          }),
        }),
      }),
    );
  });

  it("deve lançar um erro se algum dos IDs não corresponder ao `produto` especificado no parâmetro `product`", async () => {
    jest
      .spyOn(ServicoRepository.prototype, "findAllByIds")
      .mockResolvedValue([
        { dataValues: { id: 1, status: "ativo", produto: "BOLETO" } },
      ] as unknown as Servico[]);

    const data = {
      product: "pix",
      id: [1],
      kind: "webhook",
      type: "disponivel",
    };

    await expect(validarServicosUseCase.execute(data, 1)).rejects.toEqual(
      expect.objectContaining({
        code: "INVALID_FIELDS",
        error: expect.objectContaining({
          properties: expect.objectContaining({
            id: expect.objectContaining({
              errors: expect.arrayContaining([
                "O serviço com o ID 1 não corresponde ao `produto` especificado no parâmetro `product`.",
              ]),
            }),
          }),
        }),
      }),
    );
  });

  it("deve lançar um erro se alguma `situacao` dos IDs não corresponder ao `tipo` especificado no parâmetro `type`", async () => {
    jest.spyOn(ServicoRepository.prototype, "findAllByIds").mockResolvedValue([
      {
        dataValues: {
          id: 1,
          status: "ativo",
          produto: "BOLETO",
          situacao: "cancelado",
        },
      },
    ] as unknown as Servico[]);

    const data = {
      product: "boleto",
      id: [1],
      kind: "webhook",
      type: "disponivel",
    };

    await expect(validarServicosUseCase.execute(data, 1)).rejects.toEqual(
      expect.objectContaining({
        code: "INVALID_FIELDS",
        error: expect.objectContaining({
          properties: expect.objectContaining({
            id: expect.objectContaining({
              errors: expect.arrayContaining([
                "O serviço com o ID 1 não corresponde à `situacao` especificado no parâmetro `type`.",
              ]),
            }),
          }),
        }),
      }),
    );
  });

  it("deve retornar array de serviços quando todas as validações passarem", async () => {
    const mockServicos = [
      {
        dataValues: {
          id: 1,
          status: "ativo",
          produto: "BOLETO",
          situacao: "disponivel",
        },
        convenio: {
          conta: {
            cedente: {
              dataValues: {
                id: 1,
              },
            },
          },
        },
      },
      {
        dataValues: {
          id: 2,
          status: "ativo",
          produto: "BOLETO",
          situacao: "disponivel",
        },
        convenio: {
          conta: {
            cedente: {
              dataValues: {
                id: 1,
              },
            },
          },
        },
      },
    ] as unknown as Servico[];

    jest
      .spyOn(ServicoRepository.prototype, "findAllByIds")
      .mockResolvedValue(mockServicos);

    const data = {
      product: "boleto",
      id: [1, 2],
      kind: "webhook",
      type: "disponivel",
    };

    const result = await validarServicosUseCase.execute(data, 1);

    expect(result).toEqual(mockServicos);
    expect(result).toHaveLength(2);
  });

  it("deve agrupar múltiplos erros para múltiplos IDs", async () => {
    jest
      .spyOn(ServicoRepository.prototype, "findAllByIds")
      .mockResolvedValue([
        { dataValues: { id: 1, status: "inativo", produto: "BOLETO" } },
        { dataValues: { id: 2, status: "inativo", produto: "BOLETO" } },
      ] as unknown as Servico[]);

    const data = {
      product: "boleto",
      id: [1, 2],
      kind: "webhook",
      type: "disponivel",
    };

    await expect(validarServicosUseCase.execute(data, 1)).rejects.toEqual(
      expect.objectContaining({
        code: "INVALID_FIELDS",
        error: expect.objectContaining({
          properties: expect.objectContaining({
            id: expect.objectContaining({
              errors: expect.arrayContaining([
                "O serviço com o ID 1 não está ativo.",
                "O serviço com o ID 2 não está ativo.",
              ]),
            }),
          }),
        }),
      }),
    );
  });

  it("deve validar todos os serviços mesmo quando encontrar erro no primeiro", async () => {
    jest.spyOn(ServicoRepository.prototype, "findAllByIds").mockResolvedValue([
      { dataValues: { id: 1, status: "inativo", produto: "BOLETO" } },
      { dataValues: { id: 2 } }, // ID 3 não encontrado
    ] as Servico[]);

    const data = {
      product: "boleto",
      id: [1, 2, 3],
      kind: "webhook",
      type: "disponivel",
    };

    await expect(validarServicosUseCase.execute(data, 1)).rejects.toEqual(
      expect.objectContaining({
        code: "INVALID_FIELDS",
        error: expect.objectContaining({
          properties: expect.objectContaining({
            id: expect.objectContaining({
              errors: expect.any(Array),
            }),
          }),
        }),
      }),
    );
  });

  describe("Edge cases", () => {
    it("deve lidar com array de IDs vazio", async () => {
      jest
        .spyOn(ServicoRepository.prototype, "findAllByIds")
        .mockResolvedValue([]);

      const data = {
        product: "boleto",
        id: [],
        kind: "webhook",
        type: "disponivel",
      };

      const result = await validarServicosUseCase.execute(data, 1);
      expect(result).toEqual([]);
    });

    it("deve validar corretamente com 30 IDs (máximo)", async () => {
      const thirtyIds = Array.from({ length: 30 }, (_, i) => i + 1);
      const mockServicos = thirtyIds.map((id) => ({
        dataValues: {
          id,
          status: "ativo",
          produto: "BOLETO",
          situacao: "disponivel",
        },
        convenio: {
          conta: {
            cedente: {
              dataValues: {
                id: 1,
              },
            },
          },
        },
      })) as unknown as Servico[];

      jest
        .spyOn(ServicoRepository.prototype, "findAllByIds")
        .mockResolvedValue(mockServicos);

      const data = {
        product: "boleto",
        id: thirtyIds,
        kind: "webhook",
        type: "disponivel",
      };

      const result = await validarServicosUseCase.execute(data, 1);
      expect(result).toHaveLength(30);
    });
  });
});
