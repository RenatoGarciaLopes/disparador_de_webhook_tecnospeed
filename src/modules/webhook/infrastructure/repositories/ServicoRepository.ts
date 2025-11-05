import { Cedente } from "@/sequelize/models/cedente.model";
import { Conta } from "@/sequelize/models/conta.model";
import { Convenio } from "@/sequelize/models/convenio.model";
import { Servico } from "@/sequelize/models/servico.model";
import { Op } from "sequelize";
import { IServicoRepository } from "../../domain/repositories/IServicoRepository";
import { IReenviarDTO } from "../../interfaces/http/dtos/ReenviarDTO";

export class ServicoRepository implements IServicoRepository {
  async findAllConfiguracaoNotificacaoByCedente(
    cedenteId: number,
    servicoIds: number[],
    produto: IReenviarDTO["product"],
    situacao: IReenviarDTO["type"],
  ) {
    const servicos = await Servico.findAll({
      where: {
        id: { [Op.in]: servicoIds },
        produto,
        situacao,
        status: "ativo",
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
                  attributes: ["id", "configuracao_notificacao"],
                },
              ],
            },
          ],
        },
      ],
    });

    const servicosFiltrados = [];

    for (const servico of servicos) {
      if (servico.convenio.conta.cedente.id !== cedenteId) continue;
      servicosFiltrados.push({
        id: servico.id,
        convenio: {
          id: servico.convenio.id,
          conta: {
            id: servico.convenio.conta.id,
            configuracao_notificacao:
              servico.convenio.conta.configuracao_notificacao,
            cedente: {
              id: servico.convenio.conta.cedente.id,
              configuracao_notificacao:
                servico.convenio.conta.cedente.configuracao_notificacao,
            },
          },
        },
      });
    }

    return servicosFiltrados;
  }
}
