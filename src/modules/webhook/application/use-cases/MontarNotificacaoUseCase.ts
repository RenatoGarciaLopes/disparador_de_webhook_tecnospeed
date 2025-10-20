import { IConfiguracaoNotificacao } from "@/shared/interfaces/IConfiguracaoNotificacao";
import { SituacaoMapper } from "../../domain/mappers/SituacaoMapper";
import { ReenviarDTO } from "../../interfaces/http/dtos/ReenviarDTO";
import { BoletoPresenter } from "../presenters/boleto";
import { PagamentoPresenter } from "../presenters/pagamento";
import { PixPresenter } from "../presenters/pix";

export type ConfiguracaoNotificacao = {
  cedenteId: number;
  servicoId: number;
  contaId: number;
  configuracaoNotificacao: IConfiguracaoNotificacao;
};

export class MontarNotificacaoUseCase {
  constructor(
    private readonly webhookReprocessadoId: string,
    private readonly data: Omit<ReenviarDTO, "id">,
    private readonly configuracaoNotificacoes: ConfiguracaoNotificacao[],
  ) {}

  public execute(metadata: { cnpjCedente: string }) {
    // TODO: Inicializar o array de payloads para armazenar os resultados de cada notificação montada
    // TODO: Iterar sobre cada configuração de notificação recebida no construtor
    // TODO: Criar um objeto de headers (cabeçalhos) inicial vazio
    // TODO: Se existir um header principal, adicionar ao objeto de headers
    // TODO: Percorrer os headers adicionais da configuração de notificação e mesclar ao objeto de headers
    // TODO: Verificar o tipo do produto para definir qual presenter utilizar e montar o payload correto
    // TODO: Retornar o array de payloads montados para as notificações de cada configuração processada
    // return payloads;
  }

  private montarBoleto(
    configuracaoNotificacao: ConfiguracaoNotificacao,
    metadata: {
      cnpjCedente: string;
      headers: Record<string, string>;
    },
  ) {
    const situacao = SituacaoMapper.toBoleto(this.data.type);

    return BoletoPresenter.toPayload(
      configuracaoNotificacao.configuracaoNotificacao.url,
      metadata.headers,
      {
        webhookReprocessadoId: this.webhookReprocessadoId,
        situacao,
        cnpjCedente: metadata.cnpjCedente,
      },
    );
  }

  private montarPagamento(
    configuracaoNotificacao: ConfiguracaoNotificacao,
    metadata: {
      headers: Record<string, string>;
    },
  ) {
    const situacao = SituacaoMapper.toPagamento(this.data.type);

    return PagamentoPresenter.toPayload(
      configuracaoNotificacao.configuracaoNotificacao.url,
      metadata.headers,
      {
        webhookReprocessadoId: this.webhookReprocessadoId,
        situacao,
        contaId: configuracaoNotificacao.contaId,
      },
    );
  }

  private montarPix(
    configuracaoNotificacao: ConfiguracaoNotificacao,
    metadata: {
      headers: Record<string, string>;
    },
  ) {
    const situacao = SituacaoMapper.toPix(this.data.type);

    return PixPresenter.toPayload(
      configuracaoNotificacao.configuracaoNotificacao.url,
      metadata.headers,
      {
        webhookReprocessadoId: this.webhookReprocessadoId,
        situacao,
        contaId: configuracaoNotificacao.contaId,
        servicoId: configuracaoNotificacao.servicoId,
        cedenteId: configuracaoNotificacao.cedenteId,
      },
    );
  }
}
