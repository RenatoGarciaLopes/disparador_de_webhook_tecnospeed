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
    return await WebhookReprocessado.findAll({
      where: {
        cedente_id,
        data_criacao: {
          [Op.between]: [start_date, end_date],
        },
        product: product ? product : undefined,
        servico_id: servico_ids ? { [Op.contains]: servico_ids } : undefined,
        kind: kind ? kind : undefined,
        type: type ? type : undefined,
      },
    });
  }

  async findById(id: string, cedente_id: number) {
    return await WebhookReprocessado.findOne({
      where: {
        id,
        cedente_id,
      },
    });
  }
}
