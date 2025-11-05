import { WebhookReprocessadoCreationAttributes } from "@/sequelize/models/webhookreprocessado.model";

export interface ICreateWebhookReprocessado
  extends WebhookReprocessadoCreationAttributes {}

export interface IWebhookReprocessadoRepository {
  create(
    webhookReprocessado: ICreateWebhookReprocessado,
  ): Promise<ICreateWebhookReprocessado>;
}
