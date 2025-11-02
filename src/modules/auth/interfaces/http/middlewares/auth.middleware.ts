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
      const softwareHouse = await validateSoftwareHouseUseCase.execute(
        authData.softwareHouse.cnpj,
        authData.softwareHouse.token,
      );
      const cedente = await validateCedenteUseCase.execute(
        authData.cedente.cnpj,
        authData.cedente.token,
        softwareHouse.id,
      );

      req.softwareHouseId = softwareHouse.id;
      req.cedenteId = cedente.id;

      next();
    } catch (error: unknown) {
      if (error instanceof InvalidFieldsError) {
        return res.status(error.status).json(error.json());
      }

      if (error instanceof UnauthorizedError) {
        return res.status(error.statusCode).json(error.json());
      }

      return res
        .status(500)
        .json(
          ErrorResponse.internalServerErrorFromError(error as Error).json(),
        );
    }
  }
}
