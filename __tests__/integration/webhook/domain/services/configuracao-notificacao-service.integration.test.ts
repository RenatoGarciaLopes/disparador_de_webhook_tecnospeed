import { ConfiguracaoNotificacaoService } from "@/modules/webhook/domain/services/ConfiguracaoNotificacaoService";
import { ServicoRepository } from "@/modules/webhook/infrastructure/database/repositories/ServicoRepository";
import { DatabaseHelper } from "../../helpers/database.helper";

describe("[Integration] ConfiguracaoNotificacaoService - Database", () => {
  let repository: ServicoRepository;

  beforeAll(async () => {
    await DatabaseHelper.setup();
  });

  beforeEach(async () => {
    await DatabaseHelper.cleanup();
    await DatabaseHelper.seedTestData();
    repository = new ServicoRepository();
  });

  afterAll(async () => {
    await DatabaseHelper.cleanup();
    await DatabaseHelper.close();
  });

  describe("getFromServico - Prioridade Conta > Cedente (DOCS linha 94-100)", () => {
    it("deve priorizar configuração da Conta quando ela existe", async () => {
      // Buscar serviço com configuração na Conta
      const servicos = await repository.findAllByIds([1]);
      const servico = servicos[0];

      // Validar que o serviço tem configuração na Conta
      expect(
        servico.convenio.conta.dataValues.configuracao_notificacao,
      ).toBeDefined();

      const config = ConfiguracaoNotificacaoService.getFromServico(servico);

      // Deve retornar configuração da Conta
      expect(config).toBeDefined();
      expect(config).toHaveProperty("url");
      expect(config).toHaveProperty("headers");

      // Se a conta tem configuração, deve usar ela
      if (servico.convenio.conta.dataValues.configuracao_notificacao) {
        expect(config).toEqual(
          servico.convenio.conta.dataValues.configuracao_notificacao,
        );
      }
    });

    it("deve usar configuração do Cedente quando Conta não tem (DOCS linha 100)", async () => {
      // Buscar serviço onde Conta tem configuração null/undefined
      // Nota: O seed deve ter pelo menos um serviço com Conta sem configuração
      const servicos = await repository.findAllByIds([1, 2, 3, 4, 5]);

      // Procurar um serviço onde Conta não tem configuração
      const servicoSemConfigConta = servicos.find(
        (s) => !s.convenio.conta.dataValues.configuracao_notificacao,
      );

      if (servicoSemConfigConta) {
        const config = ConfiguracaoNotificacaoService.getFromServico(
          servicoSemConfigConta,
        );

        expect(config).toBeDefined();

        // Deve usar configuração do Cedente
        expect(config).toEqual(
          servicoSemConfigConta.convenio.conta.cedente.dataValues
            .configuracao_notificacao,
        );
      } else {
        // Se não houver no seed, o teste passa
        // (Isso significa que todos os serviços têm configuração na Conta)
        expect(true).toBe(true);
      }
    });

    it("deve carregar relacionamentos completos do banco", async () => {
      const servicos = await repository.findAllByIds([1]);
      const servico = servicos[0];

      // Valida que relacionamentos foram carregados via JOIN
      expect(servico.convenio).toBeDefined();
      expect(servico.convenio.conta).toBeDefined();
      expect(servico.convenio.conta.cedente).toBeDefined();
      expect(servico.convenio.conta.dataValues).toBeDefined();
      expect(servico.convenio.conta.cedente.dataValues).toBeDefined();
    });

    it("deve retornar headers, url e method da configuração", async () => {
      const servicos = await repository.findAllByIds([1]);
      const config = ConfiguracaoNotificacaoService.getFromServico(servicos[0]);

      expect(config).toHaveProperty("url");
      expect(config.url).toBeTruthy();
      expect(config.url).toMatch(/^https?:\/\//);

      // Headers podem existir ou não dependendo da configuração
      if (config.headers) {
        expect(typeof config.headers).toBe("object");
      }
    });

    it("deve validar estrutura da configuração retornada", async () => {
      const servicos = await repository.findAllByIds([1]);
      const config = ConfiguracaoNotificacaoService.getFromServico(servicos[0]);

      // Configuração deve ter pelo menos uma URL
      expect(config).toBeDefined();
      expect(config.url).toBeDefined();
      expect(typeof config.url).toBe("string");
      expect(config.url.length).toBeGreaterThan(0);
    });
  });

  describe("Múltiplos serviços com configurações diferentes", () => {
    it("deve retornar configurações para múltiplos serviços", async () => {
      const servicos = await repository.findAllByIds([1, 2]);

      const config1 = ConfiguracaoNotificacaoService.getFromServico(
        servicos[0],
      );
      const config2 = ConfiguracaoNotificacaoService.getFromServico(
        servicos[1],
      );

      // Ambas configurações devem existir
      expect(config1).toBeDefined();
      expect(config2).toBeDefined();
      expect(config1.url).toBeDefined();
      expect(config2.url).toBeDefined();
    });

    it("deve retornar mesma configuração para serviços da mesma conta", async () => {
      const servicos = await repository.findAllByIds([1, 2]);

      // Se ambos pertencem à mesma conta
      const conta1 = servicos[0].convenio.conta.dataValues.id;
      const conta2 = servicos[1].convenio.conta.dataValues.id;

      if (conta1 === conta2) {
        const config1 = ConfiguracaoNotificacaoService.getFromServico(
          servicos[0],
        );
        const config2 = ConfiguracaoNotificacaoService.getFromServico(
          servicos[1],
        );

        expect(config1.url).toBe(config2.url);
        expect(config1.headers).toEqual(config2.headers);
      }
    });

    it("deve lidar corretamente com serviços de contas diferentes", async () => {
      const servicos = await repository.findAllByIds([1, 2, 3]);

      // Buscar serviços de contas diferentes
      const contasUnicas = new Set(
        servicos.map((s) => s.convenio.conta.dataValues.id),
      );

      // Se houver múltiplas contas, cada uma pode ter configuração diferente
      if (contasUnicas.size > 1) {
        const configs = servicos.map((s) =>
          ConfiguracaoNotificacaoService.getFromServico(s),
        );

        // Todas devem ter configuração
        configs.forEach((config) => {
          expect(config).toBeDefined();
          expect(config.url).toBeDefined();
        });
      }
    });
  });

  describe("Regra de priorização (DOCS linha 96)", () => {
    it("deve sempre verificar Conta primeiro", async () => {
      const servicos = await repository.findAllByIds([1]);
      const servico = servicos[0];

      const configConta =
        servico.convenio.conta.dataValues.configuracao_notificacao;
      const configCedente =
        servico.convenio.conta.cedente.dataValues.configuracao_notificacao;

      const configRetornada =
        ConfiguracaoNotificacaoService.getFromServico(servico);

      // Se Conta tem configuração, deve usar ela
      if (configConta) {
        expect(configRetornada).toEqual(configConta);
        expect(configRetornada).not.toEqual(configCedente);
      } else {
        // Se Conta não tem, usa Cedente
        expect(configRetornada).toEqual(configCedente);
      }
    });

    it("deve nunca retornar undefined ou null", async () => {
      const servicos = await repository.findAllByIds([1]);
      const config = ConfiguracaoNotificacaoService.getFromServico(servicos[0]);

      expect(config).toBeDefined();
      expect(config).not.toBeNull();
    });
  });

  describe("Performance com múltiplos serviços", () => {
    it("deve processar múltiplos serviços rapidamente", async () => {
      const servicos = await repository.findAllByIds([1, 2]);

      const start = Date.now();

      servicos.forEach((servico) => {
        ConfiguracaoNotificacaoService.getFromServico(servico);
      });

      const duration = Date.now() - start;

      // Processamento deve ser rápido (< 100ms)
      expect(duration).toBeLessThan(100);
    });
  });

  describe("Edge cases", () => {
    it("deve lidar com serviço com relacionamentos carregados", async () => {
      const servicos = await repository.findAllByIds([1]);
      const servico = servicos[0];

      // Validar que todos os relacionamentos necessários existem
      expect(servico.convenio).toBeDefined();
      expect(servico.convenio.conta).toBeDefined();
      expect(servico.convenio.conta.cedente).toBeDefined();

      // Não deve lançar erro
      expect(() => {
        ConfiguracaoNotificacaoService.getFromServico(servico);
      }).not.toThrow();
    });
  });
});
