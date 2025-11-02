import { Logger } from "@/infrastructure/logger/logger";
import { ErrorResponse } from "@/shared/errors/ErrorResponse";
import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { UnauthorizedError } from "@/shared/errors/Unauthorized";
import { NextFunction, Request, Response } from "express";
import { ValidateCedenteUseCase } from "../../../application/use-cases/ValidateCedenteUseCase";
import { ValidateSoftwareHouseUseCase } from "../../../application/use-cases/ValidateSoftwareHouseUseCase";
import { CedenteRepository } from "../../../infrastructure/database/repositories/CedenteRepository";
import { SoftwareHouseRepository } from "../../../infrastructure/database/repositories/SoftwareHouseRepository";
import { AuthDTO } from "../dtos/AuthDTO";

export class AuthMiddleware {
  public static async validate(
    req: Request & { softwareHouseId: number; cedenteId: number },
    res: Response,
    next: NextFunction,
  ) {
    const validateSoftwareHouseUseCase = new ValidateSoftwareHouseUseCase(
      new SoftwareHouseRepository(),
    );
    const validateCedenteUseCase = new ValidateCedenteUseCase(
      new CedenteRepository(),
    );

    try {
      const authData = new AuthDTO(req.headers);

      Logger.debug("Validating SoftwareHouse");

      const softwareHouse = await validateSoftwareHouseUseCase.execute(
        authData.softwareHouse.cnpj,
        authData.softwareHouse.token,
      );

      Logger.info(
        `SoftwareHouse validated successfully: id=${softwareHouse.id}`,
      );

      Logger.debug("Validating Cedente");

      const cedente = await validateCedenteUseCase.execute(
        authData.cedente.cnpj,
        authData.cedente.token,
        softwareHouse.id,
      );

      Logger.info(
        `Cedente validated successfully: id=${cedente.id}, softwareHouseId=${softwareHouse.id}`,
      );

      req.softwareHouseId = softwareHouse.id;
      req.cedenteId = cedente.id;

      next();
    } catch (error: unknown) {
      if (error instanceof InvalidFieldsError) {
        Logger.warn(`Validation error in auth middleware: ${error.code}`);
        return res.status(error.status).json(error.json());
      }

      if (error instanceof UnauthorizedError) {
        Logger.warn(`Unauthorized access attempt: ${error.code}`);
        return res.status(error.statusCode).json(error.json());
      }

      Logger.error(
        `Unexpected error in auth middleware: ${error instanceof Error ? error.message : String(error)}`,
      );

      return res
        .status(500)
        .json(
          ErrorResponse.internalServerErrorFromError(error as Error).json(),
        );
    }
  }
}
