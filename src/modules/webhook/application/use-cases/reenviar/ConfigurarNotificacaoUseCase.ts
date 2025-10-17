import { Servico } from "@/sequelize/models/servico.model";
import { IConfiguracaoNotificacao } from "@/shared/interfaces/IConfiguracaoNotificacao";
import { ReenviarSchemaDTO } from "../../../interfaces/http/validators/ReenviarSchema";

// Interface para o grupo de serviços por configuração
interface GrupoServicos {
  configuracao: IConfiguracaoNotificacao;
  servicos: Servico[];
}

export class ConfigurarNotificacaoUseCase {
  constructor() {}

  async execute(
    data: ReenviarSchemaDTO,
    servicos: Servico[],
  ): Promise<GrupoServicos[]> {
    // TODO: Implementar lógica completa de agrupamento
    // 1. Criar um Map para agrupar serviços por configuração de notificação
    // 2. Para cada serviço:
    //    a. Obter configuração via ConfiguracaoNotificacaoService.getFromServico(servico)
    //    b. Usar a URL da configuração como chave do agrupamento
    //    c. Adicionar serviço ao grupo correspondente
    // 3. Converter o Map em array de GrupoServicos
    // 4. Retornar array com grupos (cada grupo terá sua própria configuração e lista de serviços)
    //
    // IMPORTANTE: A configuração deve priorizar a Conta, se não existir usa a do Cedente
    // Serviços da mesma Conta/Cedente com mesma configuração ficam no mesmo grupo
    // Serviços de Contas/Cedentes diferentes com mesma URL podem ficar no mesmo grupo

    // RED: Implementação vazia para os testes falharem
    return [];
  }
}
