import { Cedente } from "@/sequelize/models/cedente.model";
import { ICedenteRepository } from "@/shared/modules/auth/domain/repositories/ICedenteRepository";

export class CedenteRepository implements ICedenteRepository {
  async find(cnpj: string, token: string, softwareHouseId: number) {
    const cedente = await Cedente.findOne({
      where: { cnpj, token, softwarehouse_id: softwareHouseId },
    });

    if (!cedente) {
      return null;
    }

    return {
      id: cedente.id,
      status: cedente.status as "ativo" | "inativo",
    };
  }
}
