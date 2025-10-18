import { Servico } from "@/sequelize/models/servico.model";
import { IConfiguracaoNotificacao } from "@/shared/interfaces/IConfiguracaoNotificacao";

export class ConfiguracaoNotificacaoService {
  static getFromServico(servico: Servico): IConfiguracaoNotificacao {
    // TODO: Implementar lógica correta baseada no DOCS_ENDPOINT_REENVIAR.md
    // DOCS linhas 94-100: "será necessário criar uma lógica para priorizar sempre a configuração da conta.
    // Caso a configuração na Conta não exista, então será utilizada a configuração do Cedente"

    // 1. Verificar se a conta tem configuração de notificação (prioridade)
    //    - Acessar: servico.convenio.conta.dataValues.configuracao_notificacao
    //    - Verificar se existe e não é null/undefined/objeto vazio

    // 2. Se a conta tiver configuração válida, retornar configuração da conta
    //    - Retornar: servico.convenio.conta.dataValues.configuracao_notificacao

    // 3. Se não tiver configuração na conta, usar fallback do cedente
    //    - Retornar: servico.convenio.conta.cedente.dataValues.configuracao_notificacao

    // RED: Implementação incorreta para os testes falharem
    // Está retornando sempre do cedente, mas deveria verificar a conta primeiro
    return servico.convenio.conta.cedente.dataValues
      .configuracao_notificacao as IConfiguracaoNotificacao;
  }
}
