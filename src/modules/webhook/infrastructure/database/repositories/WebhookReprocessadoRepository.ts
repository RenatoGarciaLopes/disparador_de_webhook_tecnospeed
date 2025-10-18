import { WebhookReprocessado } from "@/sequelize/models/webhookreprocessado.model";

export interface CreateWebhookReprocessadoDTO {
  data: object;
  cedente_id: number;
  kind: string;
  type: string;
  servico_id: string[];
  product: string;
}

export class WebhookReprocessadoRepository {
  async create(dto: CreateWebhookReprocessadoDTO) {
    return await WebhookReprocessado.create(dto);
  }
}
