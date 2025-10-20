import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { IServicoRepository } from "../../domain/repositories/IServicoRepository";

export type Servicos = Awaited<
  ReturnType<IServicoRepository["findAllConfiguracaoNotificacaoByCedente"]>
>;

export class ConfiguracaoNotificacaoUseCase {
  static execute(servicos: Servicos) {
    // TODO: Inicializar o array que irá armazenar as configurações de notificação
    // TODO: Inicializar o array que irá armazenar ids de serviços sem configuração de notificação

    // TODO: Iterar sobre os serviços retornados
    // TODO: Para cada serviço, recuperar a configuração de notificação do nível da conta
    // TODO: Se não existir no nível da conta, recuperar do nível do cedente

    // TODO: Checar se o serviço atual não possui configuração de notificação
    // TODO: Se não possuir, adicionar o id do serviço no array de serviços sem configuração de notificação e continuar para o próximo

    // TODO: Se possuir configuração, adicionar no array de configurações de notificação o objeto com cedenteId, servicoId, contaId e a configuração

    // TODO: Após a iteração, checar se existe algum serviço sem configuração de notificação
    // TODO: Se existir, lançar uma exceção InvalidFieldsError contendo uma mensagem de erro para cada serviço

    // TODO: Retornar o array de configurações encontradas
  }
}
