import { UnauthorizedError } from "@/shared/errors/Unauthorized";
import { ICedenteRepository } from "@/shared/modules/auth/domain/repositories/ICedenteRepository";

export class ValidateCedenteUseCase {
  constructor(private readonly cedenteRepository: ICedenteRepository) {}

  async execute(cnpj: string, token: string, softwareHouseId: number) {
    const cedente = await this.cedenteRepository.find(
      cnpj,
      token,
      softwareHouseId,
    );

    if (!cedente || cedente.status === "inativo") {
      throw new UnauthorizedError("Credenciais inválidas");
    }

    return cedente;
  }
}
