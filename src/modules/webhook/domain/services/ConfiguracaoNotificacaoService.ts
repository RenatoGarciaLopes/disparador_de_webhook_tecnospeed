import { Servico } from "@/sequelize/models/servico.model";
import { IConfiguracaoNotificacao } from "@/shared/interfaces/IConfiguracaoNotificacao";

export class ConfiguracaoNotificacaoService {
  static getFromServico(servico: Servico): IConfiguracaoNotificacao {
    // TODO: Implementar lógica correta
    // 1. Verificar se a conta tem configuração de notificação
    // 2. Se tiver, retornar a configuração da conta
    // 3. Se não tiver, retornar a configuração do cedente

    // RED: Implementação incorreta para os testes falharem
    // Está retornando sempre do cedente, mas deveria verificar a conta primeiro
    return servico.convenio.conta.cedente.dataValues
      .configuracao_notificacao as IConfiguracaoNotificacao;
  }
}
