import "@/infrastructure/config";

import { sequelize } from "@/sequelize";
import { Cedente } from "@/sequelize/models/cedente.model";
import { Conta } from "@/sequelize/models/conta.model";
import { Convenio } from "@/sequelize/models/convenio.model";
import { Servico } from "@/sequelize/models/servico.model";
import { SoftwareHouse } from "@/sequelize/models/software-house.model";
import { Sequelize } from "sequelize";

export class DatabaseHelper {
  private static instance: Sequelize;

  static async setup(): Promise<Sequelize> {
    if (!this.instance) {
      this.instance = sequelize;
    }

    // Sincroniza models (cria tabelas se não existem)
    await this.instance.sync({ force: false });

    return this.instance;
  }

  static async cleanup(): Promise<void> {
    if (!this.instance) return;

    // Limpa dados mantendo estrutura
    await Servico.destroy({ where: {}, truncate: true, cascade: true });
    await Convenio.destroy({ where: {}, truncate: true, cascade: true });
    await Conta.destroy({ where: {}, truncate: true, cascade: true });
    await Cedente.destroy({ where: {}, truncate: true, cascade: true });
    await SoftwareHouse.destroy({ where: {}, truncate: true, cascade: true });
  }

  static async close(): Promise<void> {
    if (this.instance) {
      await this.instance.close();
    }
  }

  static async seedTestData(): Promise<void> {
    // Software House
    await SoftwareHouse.create({
      id: 1,
      cnpj: "12345678901234",
      token: "sh-token-test",
      status: "ativo",
    } as any);

    // Cedente
    await Cedente.create({
      id: 1,
      cnpj: "98765432109876",
      token: "cedente-token-test",
      status: "ativo",
      softwarehouse_id: 1,
      configuracao_notificacao: {
        url: "https://webhook.site/test-cedente",
        email: null,
        tipos: {},
        cancelado: false,
        pago: false,
        disponivel: true,
        header: false,
        ativado: true,
        header_campo: "",
        header_valor: "",
        headers_adicionais: [],
      },
    } as any);

    // Conta
    await Conta.create({
      id: 1,
      cedente_id: 1,
      configuracao_notificacao: {
        url: "https://webhook.site/test-conta",
        email: null,
        tipos: {},
        cancelado: false,
        pago: false,
        disponivel: true,
        header: false,
        ativado: true,
        header_campo: "",
        header_valor: "",
        headers_adicionais: [],
      },
    } as any);

    // Convenio
    await Convenio.create({
      id: 1,
      conta_id: 1,
    } as any);

    // Serviços
    await Servico.bulkCreate([
      {
        id: 1,
        status: "ativo",
        produto: "BOLETO",
        situacao: "disponivel",
        convenio_id: 1,
      },
      {
        id: 2,
        status: "ativo",
        produto: "BOLETO",
        situacao: "disponivel",
        convenio_id: 1,
      },
      {
        id: 3,
        status: "inativo",
        produto: "BOLETO",
        situacao: "disponivel",
        convenio_id: 1,
      },
    ] as any[]);
  }
}
