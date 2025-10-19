import { WebhookReprocessado } from "@/sequelize/models/webhookreprocessado.model";
import { WebhookReprocessadoRepository } from "../../../infrastructure/database/repositories/WebHookReprocessadoRespository";
import { ProtocolosSchemaDTO } from "../../../interfaces/http/validators/ProtocolosSchema";
import { ErrorResponse } from "@/shared/errors/ErrorResponse";

export class GetProtocolosUseCase {
  constructor(
    private readonly webhookReprocessadoRepository: WebhookReprocessadoRepository,
  ) {}

  async execute(
    data: ProtocolosSchemaDTO,
    cedenteId: number,
  ): Promise<WebhookReprocessado[]> {
    if (!data.start_date || !data.end_date) {
      throw new Error("Start date e end date são obrigatórios");
    }

    try {
      const webhookReprocessados =
        await this.webhookReprocessadoRepository.findAll(
          cedenteId,
          data.start_date,
          data.end_date,
          data.product,
          data.id,
          data.kind,
          data.type,
        );

      return webhookReprocessados;
    } catch (error) {
      throw ErrorResponse.internalServerErrorFromError(error as Error);
    }
  }
}
