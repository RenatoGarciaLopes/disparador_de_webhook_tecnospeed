import { Cedente } from "@/sequelize/models/cedente.model";
import { Conta } from "@/sequelize/models/conta.model";
import { Convenio } from "@/sequelize/models/convenio.model";
import { Servico } from "@/sequelize/models/servico.model";
import { Op } from "sequelize";

export class ServicoRepository {
  async findAllByIds(ids: number[]) {
    return await Servico.findAll({
      where: {
        id: {
          [Op.in]: ids,
        },
      },
      include: [
        {
          model: Convenio,
          attributes: ["id"],
          include: [
            {
              model: Conta,
              attributes: ["id", "configuracao_notificacao"],
              include: [
                {
                  model: Cedente,
                  attributes: ["id", "configuracao_notificacao", "token", "cnpj"],
                },
              ],
            },
          ],
        },
      ],
    });
  }
}
