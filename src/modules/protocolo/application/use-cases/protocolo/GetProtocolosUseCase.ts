import { WebhookReprocessado } from "@/sequelize/models/webhookreprocessado.model";
import { WebhookReprocessadoRepository } from "../../../infrastructure/database/repositories/WebHookReprocessadoRespository";
import { ProtocolosSchemaDTO } from "../../../interfaces/http/validators/ProtocolosSchema";

export class GetProtocolosUseCase {
  constructor(
    private readonly webhookReprocessadoRepository: WebhookReprocessadoRepository,
  ) {}

  async execute(
    data: ProtocolosSchemaDTO,
    cedenteId: number,
  ): Promise<WebhookReprocessado[]> {
    const webhookReprocessados =
      await this.webhookReprocessadoRepository.findAll(
        cedenteId,
        data.start_date,
        data.end_date,
        data.product,
        data.servico_ids,
        data.kind,
        data.type,
      );
    return webhookReprocessados;
  }
}
