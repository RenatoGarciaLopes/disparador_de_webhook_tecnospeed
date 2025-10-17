import { Servico } from "@/sequelize/models/servico.model";

export class ConfiguracaoNotificacaoService {
  static getFromServico(servico: Servico) {
    return servico.convenio.conta.cedente.dataValues.configuracao_notificacao;
  }
}