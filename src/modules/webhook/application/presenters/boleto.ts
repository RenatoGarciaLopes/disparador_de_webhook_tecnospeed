import { Servico } from "@/sequelize/models/servico.model";
import { IConfiguracaoNotificacao } from "@/shared/interfaces/IConfiguracaoNotificacao";
import { z } from "zod";
import { ReenviarSchemaDTO } from "../../interfaces/http/validators/ReenviarSchema";

const BoletoPresenterSchema = z.object({
  kind: z.any(),
  method: z.any(),
  url: z.any(),
  headers: z.any(),
  body: z.object({
    tipoWH: z.any(),
    dataHoraEnvio: z.any(),
    CpfCnpjCedente: z.any(),
    titulo: z.object({
      situacao: z.any(),
      idintegracao: z.any(),
      TituloNossoNumero: z.any(),
      TituloMovimentos: z.any(),
    }),
  }),
});

type IBoletoPresenter = z.infer<typeof BoletoPresenterSchema>;

export class BoletoPresenter {
  constructor(
    private readonly webhookReprocessadoId: string,
    private readonly servico: Servico,
    private readonly data: ReenviarSchemaDTO,
  ) {}

  toPayload(
    configuracaoNotificacao: IConfiguracaoNotificacao,
  ): IBoletoPresenter {
    return {
      kind: "webhook",
      method: "POST",
      url: "https://webhook.site/fake-url",
      headers: { "content-type": "application/json" },
      body: {
        tipoWH: "",
        dataHoraEnvio: new Date()
          .toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium" })
          .replace(",", ""),
        CpfCnpjCedente: "2",
        titulo: {
          situacao: "REGISTRADO",
          idintegracao: this.webhookReprocessadoId,
          TituloNossoNumero: "",
          TituloMovimentos: {},
        },
      },
    };
  }
}
