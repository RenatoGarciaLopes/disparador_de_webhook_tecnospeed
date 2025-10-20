import { ErrorResponse } from "@/shared/errors/ErrorResponse";
import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { NextFunction, Request, Response } from "express";
import { ReenviarDTO } from "../dtos/ReenviarDTO";

export class BodyMiddleware {
  public static validate(req: Request, res: Response, next: NextFunction) {
    try {
      // const data = new ReenviarDTO(req.body);
      // req.body = data;

      next();
    } catch (error: unknown) {
      // 1. TODO: Verificar se o erro é uma instância de InvalidFieldsError
      // 2. TODO: Se for, retornar o status e o payload apropriado do erro
      // 3. TODO: Caso contrário, retornar erro 500 com resposta de erro interno padrão
    }
  }
}
