import { UnauthorizedError } from "@/shared/errors/Unauthorized";
import { ISoftwareHouseRepository } from "../../domain/repositories/ISoftwareHouseRepository";

export class ValidateSoftwareHouseUseCase {
  constructor(
    private readonly softwareHouseRepository: ISoftwareHouseRepository,
  ) {}

  async execute(cnpj: string, token: string) {
    const softwareHouse = await this.softwareHouseRepository.find(cnpj, token);

    if (!softwareHouse) {
      throw new UnauthorizedError("Credenciais inválidas");
    }

    if (softwareHouse.status === "inativo") {
      throw new UnauthorizedError("Credenciais inválidas");
    }

    return softwareHouse;
  }
}
