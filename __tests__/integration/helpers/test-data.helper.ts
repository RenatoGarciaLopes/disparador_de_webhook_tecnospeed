import { CacheService } from "@/infrastructure/cache/cache.service";
import { DatabaseService } from "@/infrastructure/database/database.service";
import { sequelize } from "@/sequelize";
import { Cedente } from "@/sequelize/models/cedente.model";
import { Conta } from "@/sequelize/models/conta.model";
import { Convenio } from "@/sequelize/models/convenio.model";
import { Servico } from "@/sequelize/models/servico.model";
import { SoftwareHouse } from "@/sequelize/models/software-house.model";
import { WebhookReprocessado } from "@/sequelize/models/webhookreprocessado.model";

export class TestDataHelper {
  private static dbService: DatabaseService;
  private static cacheService: CacheService;

  static async initialize() {
    this.dbService = new DatabaseService();
    this.cacheService = CacheService.getInstance();
    await this.dbService.connect();
    try {
      await this.cacheService.connect();
    } catch {
      console.log("[warning] Cache não disponível, continuando sem cache");
    }
  }

  static async cleanup() {
    try {
      await this.cacheService.flushAll();
    } catch (e) {
      console.warn("[warning] Falha ao limpar cache", e);
    }
    await WebhookReprocessado.destroy({ where: {}, force: true });
    await Servico.destroy({ where: {}, force: true });
    await Convenio.destroy({ where: {}, force: true });
    await Conta.destroy({ where: {}, force: true });
    await Cedente.destroy({ where: {}, force: true });
    await SoftwareHouse.destroy({ where: {}, force: true });
  }

  static async shutdown() {
    try {
      await this.cacheService.quit();
    } catch (e) {
      console.warn("[warning] Falha ao encerrar cache", e);
    }

    try {
      await sequelize.close();
    } catch (e) {
      console.warn("[warning] Falha ao encerrar conexão com o banco", e);
    }
  }

  static async createSoftwareHouse(data: Partial<any> = {}) {
    const defaultData = {
      cnpj: "12345678000195",
      token: "test-sh-token",
      status: "ativo",
      ...data,
    };

    return await SoftwareHouse.create(defaultData).catch((sh) => {
      console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", sh);
      throw sh;
    });
  }

  static async createCedente(softwareHouseId: number, data: Partial<any> = {}) {
    const defaultData = {
      cnpj: "98765432000123",
      token: "test-cedente-token",
      softwarehouse_id: softwareHouseId,
      status: "ativo",
      ...data,
    };

    return await Cedente.create(defaultData);
  }

  static async createConta(cedenteId: number, data: Partial<any> = {}) {
    const defaultData = {
      cedente_id: cedenteId,
      produto: "BOLETO",
      banco_codigo: "001",
      status: "ativo",
      ...data,
    };

    return await Conta.create(defaultData);
  }

  static async createConvenio(contaId: number, data: Partial<any> = {}) {
    const defaultData = {
      numero_convenio: `convenio-${Date.now()}`,
      conta_id: contaId,
      ...data,
    };

    return await Convenio.create(defaultData);
  }

  static async createServico(convenioId: number, data: Partial<any> = {}) {
    const defaultData = {
      convenio_id: convenioId,
      produto: "BOLETO",
      situacao: "disponivel",
      status: "ativo",
      ...data,
    } as const;

    return await Servico.create(defaultData).catch((servico) => {
      console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", servico);
      throw servico;
    });
  }

  static async createWebhookReprocessado(
    cedenteId: number,
    data: Partial<any> = {},
  ) {
    const defaultData = {
      protocolo: `123e4567-e89b-12d3-a456-42661417400${Date.now()}`,
      cedente_id: cedenteId,
      product: "boleto",
      kind: "webhook",
      type: "disponível",
      servico_id: ["servico-1"],
      payload: {},
      status: "pendente",
      data: {
        notifications: [],
      },
      ...data,
    };

    return await WebhookReprocessado.create(defaultData);
  }

  static async createTestScenario() {
    const softwareHouse = await this.createSoftwareHouse();
    const cedente = await this.createCedente(softwareHouse.id);
    const conta = await this.createConta(cedente.id);
    const convenio = await this.createConvenio(conta.id);
    const servico = await this.createServico(convenio.id);

    return {
      softwareHouse,
      cedente,
      conta,
      convenio,
      servico,
    };
  }

  static async createMultipleServicos(convenioId: number, count: number = 3) {
    const servicos = [];
    for (let i = 0; i < count; i++) {
      const servico = await this.createServico(convenioId, {
        produto: i % 2 === 0 ? "BOLETO" : "PIX",
        situacao: "disponivel",
        status: "ativo",
      });
      servicos.push(servico);
    }
    return servicos;
  }

  static async createMultipleCedentes(
    softwareHouseId: number,
    count: number = 2,
  ) {
    const cedentes = [];
    for (let i = 0; i < count; i++) {
      const cedente = await this.createCedente(softwareHouseId, {
        cnpj: `1111111100011${i}`,
        token: `test-cedente-token-${i}`,
      });
      cedentes.push(cedente);
    }
    return cedentes;
  }
}
