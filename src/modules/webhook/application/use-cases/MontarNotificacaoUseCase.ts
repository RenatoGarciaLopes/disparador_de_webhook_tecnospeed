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

  public execute(params: { cnpjCedente: string }) {
    // Caso não existam configurações, retorna array vazio
    if (!this.configuracaoNotificacoes?.length) return [];

    const payloads: any[] = [];

    for (const config of this.configuracaoNotificacoes) {
      const { configuracaoNotificacao } = config;
      const headers: Record<string, string> = {};

      // Header principal (opcional)
      if (
        configuracaoNotificacao.header &&
        configuracaoNotificacao.header_campo
      ) {
        headers[configuracaoNotificacao.header_campo] =
          configuracaoNotificacao.header_valor;
      }

      // Headers adicionais
      if (Array.isArray(configuracaoNotificacao.headers_adicionais)) {
        configuracaoNotificacao.headers_adicionais.forEach((item) => {
          Object.assign(headers, item);
        });
      }

      let payload;

      switch (this.data.product) {
        case "BOLETO":
          payload = this.montarBoleto(config, {
            headers,
            cnpjCedente: params.cnpjCedente,
          });
          break;

        case "PAGAMENTO":
          payload = this.montarPagamento(config, { headers });
          break;

        case "PIX":
          payload = this.montarPix(config, { headers });
          break;

        default:
          continue; // produto não suportado
      }

      if (payload) payloads.push(payload);
    }

    return payloads;
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
