import { ISoftwareHouseRepository } from "@/modules/auth/domain/repositories/ISoftwareHouseRepository";
import { SoftwareHouse } from "@/sequelize/models/software-house.model";

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
