import { ErrorResponse } from "@/shared/errors/ErrorResponse";
import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { NextFunction, Request, Response } from "express";
import { ReenviarDTO } from "../dtos/ReenviarDTO";

export class BodyMiddleware {
  public static validate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = new ReenviarDTO(req.body);
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
