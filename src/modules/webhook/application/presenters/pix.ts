import { Servico } from "@/sequelize/models/servico.model";
import { z } from "zod";
import { ReenviarSchemaDTO } from "../../interfaces/http/validators/ReenviarSchema";

const PixPresenterSchema = z.object({
  kind: z.any(),
  method: z.any(),
  url: z.any(),
  headers: z.record(z.any(), z.any()),
  body: z.object({
    type: z.any(),
    companyId: z.any(),
    event: z.any(),
    transactionId: z.any(),
    tags: z.array(z.any()),
    id: z.object({ pixId: z.any() }),
  }),
});

type IPixPresenter = z.infer<typeof PixPresenterSchema>;

export class PixPresenter {
  constructor(
    private readonly webhookReprocessadoId: string,
    private readonly servico: Servico,
    private readonly data: ReenviarSchemaDTO,
  ) {}

  toPayload(): IPixPresenter {
    return {
      kind: "webhook",
      method: "POST",
      url: "https://webhook.site/fake-url",
      headers: { "content-type": "application/json" },
      body: {
        type: "",
        companyId: 1,
        event: "ACTIVE",
        transactionId: this.webhookReprocessadoId,
        tags: ["2", "pix", new Date().getFullYear().toString()],
        id: {
          pixId: "1",
        },
      },
    };
  }
}
