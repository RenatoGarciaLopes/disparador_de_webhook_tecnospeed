import { SoftwareHouse } from "@/sequelize/models/software-house.model";
import { ISoftwareHouseRepository } from "@/shared/modules/auth/domain/repositories/ISoftwareHouseRepository";

export class SoftwareHouseRepository implements ISoftwareHouseRepository {
  async find(cnpj: string, token: string) {
    const softwareHouse = await SoftwareHouse.findOne({
      where: { cnpj, token },
    });

    if (!softwareHouse) {
      return null;
    }

    return {
      id: softwareHouse.id,
      status: softwareHouse.status as "ativo" | "inativo",
    };
  }
}
