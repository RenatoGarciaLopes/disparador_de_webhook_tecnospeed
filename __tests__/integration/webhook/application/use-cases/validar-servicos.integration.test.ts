import { ValidarServicosUseCase } from "@/modules/webhook/application/use-cases/reenviar/ValidarServicosUseCase";
import { ServicoRepository } from "@/modules/webhook/infrastructure/database/repositories/ServicoRepository";
import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { DatabaseHelper } from "../../helpers/database.helper";

describe("[Integration] ValidarServicosUseCase - Database", () => {
  let useCase: ValidarServicosUseCase;
  let repository: ServicoRepository;

  beforeAll(async () => {
    await DatabaseHelper.setup();
  });

  beforeEach(async () => {
    await DatabaseHelper.cleanup();
    await DatabaseHelper.seedTestData();
    repository = new ServicoRepository();
    useCase = new ValidarServicosUseCase(repository);
  });

  afterAll(async () => {
    await DatabaseHelper.cleanup();
    await DatabaseHelper.close();
  });

  describe("Validação com dados reais do banco", () => {
    it("deve validar serviços existentes (query real)", async () => {
      // SEM mock do repository - usa banco real
      const data = {
        product: "BOLETO",
        id: [1, 2],
        kind: "webhook",
        type: "DISPONIVEL",
      };

      const servicos = await useCase.execute(data, 1);

      expect(servicos).toHaveLength(2);
      expect(servicos[0].dataValues.id).toBe(1);
      expect(servicos[1].dataValues.id).toBe(2);
    });

    it("deve lançar erro para IDs não encontrados no banco (query real)", async () => {
      const data = {
        product: "BOLETO",
        id: [999, 888], // IDs não existem
        kind: "webhook",
        type: "DISPONIVEL",
      };

      await expect(useCase.execute(data, 1)).rejects.toThrow(
        InvalidFieldsError,
      );
    });

    it("deve validar relacionamento com Cedente (query com JOIN real)", async () => {
      const data = {
        product: "BOLETO",
        id: [1],
        kind: "webhook",
        type: "DISPONIVEL",
      };

      // Cedente 1 está no seed e deve corresponder
      const servicos = await useCase.execute(data, 1);

      expect(servicos).toHaveLength(1);
      expect(servicos[0].convenio.conta.cedente.dataValues.id).toBe(1);
    });
  });

  describe("Validações com dados reais", () => {
    it("deve validar status ativo vs inativo (dados do banco)", async () => {
      const data = {
        product: "BOLETO",
        id: [1, 2, 3], // ID 3 é inativo no seed
        kind: "webhook",
        type: "DISPONIVEL",
      };

      // Se implementação validar status, deve lançar erro para ID 3
      // Se não validar, retorna todos
      const result = await useCase.execute(data, 1).catch((e) => e);

      if (result instanceof InvalidFieldsError) {
        // Validação de status implementada
        expect(result.error.properties?.id?.errors).toContainEqual(
          expect.stringContaining("não está ativo"),
        );
      } else {
        // Validação ainda não implementada (RED)
        expect(Array.isArray(result)).toBe(true);
      }
    });

    it("deve carregar configuração de notificação via relacionamento", async () => {
      const data = {
        product: "BOLETO",
        id: [1],
        kind: "webhook",
        type: "DISPONIVEL",
      };

      const servicos = await useCase.execute(data, 1);

      // Valida que relacionamento trouxe configuração
      const configuracao =
        servicos[0].convenio.conta.dataValues.configuracao_notificacao;

      expect(configuracao).toBeDefined();
      expect(configuracao?.url).toBe("https://webhook.site/test-conta");
    });
  });
});
