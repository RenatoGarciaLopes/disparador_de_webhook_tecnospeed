import { ErrorResponse } from "@/shared/errors/ErrorResponse";
import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { NextFunction, Request, Response } from "express";
import { ProtocolosDTO } from "../../dtos/ProtocolosDTO";

export class BodyMiddleware {
  public static validate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = new ProtocolosDTO(req.query);
      req.body = data;

      next();
    } catch (error: unknown) {
      if (error instanceof InvalidFieldsError) {
        return res.status(error.status).json(error.json());
      }

      return res
        .status(500)
        .json(
          ErrorResponse.internalServerErrorFromError(error as Error).json(),
        );
    }
  }
}
