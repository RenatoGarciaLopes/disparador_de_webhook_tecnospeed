import { Logger } from "@/infrastructure/logger/logger";
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
    if (!this.configuracaoNotificacoes?.length) {
      Logger.info(
        `Nenhuma configuração de notificação encontrada: product=${this.data.product}, type=${this.data.type}`,
      );
      return [];
    }

    const payloads: any[] = [];

    for (const config of this.configuracaoNotificacoes) {
      const { configuracaoNotificacao } = config;
      const headers: Record<string, string> = {};

      if (
        configuracaoNotificacao.header &&
        configuracaoNotificacao.header_campo
      ) {
        headers[configuracaoNotificacao.header_campo] =
          configuracaoNotificacao.header_valor;
      }

      if (Array.isArray(configuracaoNotificacao.headers_adicionais)) {
        configuracaoNotificacao.headers_adicionais.forEach((item) => {
          Object.assign(headers, item);
        });
      }

      try {
        let payload;

        switch (this.data.product) {
          case "BOLETO":
            Logger.debug(
              `Montando payload de BOLETO: url=${configuracaoNotificacao.url?.substring(0, 50)}...`,
            );
            payload = this.montarBoleto(config, {
              headers,
              cnpjCedente: params.cnpjCedente,
            });
            break;

          case "PAGAMENTO":
            Logger.debug(
              `Montando payload de PAGAMENTO: url=${configuracaoNotificacao.url?.substring(0, 50)}...`,
            );
            payload = this.montarPagamento(config, { headers });
            break;

          case "PIX":
            Logger.debug(
              `Montando payload de PIX: url=${configuracaoNotificacao.url?.substring(0, 50)}...`,
            );
            payload = this.montarPix(config, { headers });
            break;

          default:
            continue;
        }

        if (payload) payloads.push(payload);
      } catch (e: any) {
        Logger.warn(
          `Erro ao montar payload: url=${configuracaoNotificacao.url}, error=${e?.message}`,
        );
      }
    }

    Logger.info(
      `Payloads de notificação montados: total=${payloads.length}, produto=${this.data.product}`,
    );

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
