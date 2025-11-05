import { WebhookReprocessado } from "@/sequelize/models/webhookreprocessado.model";
import {
  ICreateWebhookReprocessado,
  IWebhookReprocessadoRepository,
} from "../../domain/repositories/IWebhookReprocessadoRepository";

export class WebhookReprocessadoRepository
  implements IWebhookReprocessadoRepository
{
  async create(webhookReprocessado: ICreateWebhookReprocessado) {
    const webhookReprocessadoCreated =
      await WebhookReprocessado.create(webhookReprocessado);
    return webhookReprocessadoCreated.toJSON();
  }
}
