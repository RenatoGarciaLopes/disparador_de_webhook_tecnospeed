import { WebhookReprocessado } from "@/sequelize/models/webhookreprocessado.model";
import { Op } from "sequelize";

export class WebhookReprocessadoRepository {
  async findAll(
    cedente_id: number,
    start_date: Date,
    end_date: Date,
    product?: string,
    servico_ids?: string[],
    kind?: string,
    type?: string,
  ) {
    const where: any = {
      cedente_id,
      data_criacao: { [Op.between]: [start_date, end_date] },
      ...(product && { product }),
      ...(servico_ids && { servico_id: { [Op.contains]: servico_ids } }),
      ...(kind && { kind }),
      ...(type && { type }),
    };

    return await WebhookReprocessado.findAll({ where });
  }

  async findById(id: string, cedente_id: number) {
    return await WebhookReprocessado.findOne({
      where: { id, cedente_id },
    });
  }
}
