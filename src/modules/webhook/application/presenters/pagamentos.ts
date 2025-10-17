import { Servico } from "@/sequelize/models/servico.model";
import { z } from "zod";
import { ReenviarSchemaDTO } from "../../interfaces/http/validators/ReenviarSchema";
import { ConfiguracaoNotificacaoService } from "../../domain/services/ConfiguracaoNotificacaoService";
import { IConfiguracaoNotificacao } from "@/shared/interfaces/IConfiguracaoNotificacao";

const PagamentosPresenterSchema = z.object({
  kind: z.any(),
  method: z.any(),
  url: z.any(),
  headers: z.any(),
  body: z.object({
    status: z.any(),
    uniqueid: z.any(),
    createdAt: z.any(),
    ocurrences: z.any(),
    accountHash: z.any(),
    occurrences: z.any(),
  }),
});

type IPagamentosPresenter = z.infer<typeof PagamentosPresenterSchema>;

export class PagamentosPresenter {
  constructor(
    private readonly webhookReprocessadoId: string,
    private readonly servico: Servico,
    private readonly data: ReenviarSchemaDTO,
  ) {}

  toPayload(configuracaoNotificacao: IConfiguracaoNotificacao): IPagamentosPresenter {
    return {
      kind: "webhook",
      method: "POST",
      url: "https://webhook.site/fake-url",
      headers: { "content-type": "application/json" },
      body: {
        status: "SCHEDULED ACTIVE",
        uniqueid: this.webhookReprocessadoId,
        createdAt: new Date().toISOString(),
        ocurrences: [],
        accountHash: "2",
        occurrences: [],
      },
    };
  }
}
