import { SoftwareHouse } from "@/sequelize/models/software-house.model";

export class SoftwareHouseRepository {
  async findByCnpjAndToken(cnpj: string, token: string) {
    return await SoftwareHouse.findOne({
      where: {
        cnpj,
        token,
      },
    });
  }

  async validateAuth(cnpj: string, token: string) {
    const softwareHouse = await this.findByCnpjAndToken(cnpj, token);

    if (!softwareHouse) {
      return { valid: false, softwareHouse: null };
    }

    const status = softwareHouse.dataValues?.status || softwareHouse.status;
    if (status !== "ativo") {
      return { valid: false, softwareHouse };
    }

    return { valid: true, softwareHouse };
  }
}
