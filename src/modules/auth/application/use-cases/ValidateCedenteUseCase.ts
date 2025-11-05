import { ICedenteRepository } from "@/modules/auth/domain/repositories/ICedenteRepository";
import { UnauthorizedError } from "@/shared/errors/Unauthorized";

export class ValidateCedenteUseCase {
  constructor(private readonly cedenteRepository: ICedenteRepository) {}

  async execute(cnpj: string, token: string, softwareHouseId: number) {
    const cedente = await this.cedenteRepository.find(
      cnpj,
      token,
      softwareHouseId,
    );

    if (!cedente) {
      throw new UnauthorizedError("Credenciais inválidas");
    }

    if (cedente.status === "inativo") {
      throw new UnauthorizedError("Credenciais inválidas");
    }

    return cedente;
  }
}
