import { Cedente } from "@/sequelize/models/cedente.model";

export class CedenteRepository {
  async findByCnpjAndToken(cnpj: string, token: string) {
    return await Cedente.findOne({
      where: {
        cnpj,
        token,
      },
    });
  }

  async validateAuth(cnpj: string, token: string, softwareHouseId: number) {
    const cedente = await this.findByCnpjAndToken(cnpj, token);

    if (!cedente) {
      return { valid: false, cedente: null };
    }

    const status = cedente.dataValues?.status || cedente.status;
    if (status !== "ativo") {
      return { valid: false, cedente };
    }

    const shId =
      cedente.dataValues?.softwarehouse_id || cedente.softwarehouse_id;
    if (shId !== softwareHouseId) {
      return { valid: false, cedente };
    }

    return { valid: true, cedente };
  }
}

