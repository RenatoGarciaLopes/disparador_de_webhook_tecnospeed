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
    limit?: number,
    offset?: number,
  ) {
    const whereClause: any = {
      cedente_id,
      data_criacao: { [Op.between]: [start_date, end_date] },
    };

    if (product) whereClause.product = product;
    if (kind) whereClause.kind = kind;
    if (type) whereClause.type = type;
    if (servico_ids && servico_ids.length > 0) {
      whereClause.servico_id = { [Op.contains]: servico_ids };
    }

    const findOptions: any = { where: whereClause };

    if (limit !== undefined) {
      findOptions.limit = limit;
    }
    if (offset !== undefined) {
      findOptions.offset = offset;
    }

    const [result, total] = await Promise.all([
      WebhookReprocessado.findAll(findOptions),
      WebhookReprocessado.count({ where: whereClause }),
    ]);

    return {
      data: result.map((wh) => ({
        ...wh.dataValues,
      })),
      total,
    };
  }

  async findById(id: string, cedente_id: number) {
    const protocolo = await WebhookReprocessado.findOne({
      where: { protocolo: id, cedente_id },
    });

    return protocolo?.dataValues;
  }
}
