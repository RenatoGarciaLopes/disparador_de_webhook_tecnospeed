import { ReenviarService } from "@/modules/webhook/domain/services/ReenviarService";
import { ErrorResponse } from "@/shared/errors/ErrorResponse";
import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { KINDS_REENVIOS } from "@/shared/kind-reenvios";
import { Request, Response } from "express";
import { ReenviarDTO } from "../dtos/ReenviarDTO";

export class ReenviarController {
  constructor(private readonly reenviarService: ReenviarService) {}

  public async reenviar(
    req: Request<{}, {}, ReenviarDTO> & {
      softwareHouseId: number;
      cedenteId: number;
    },
    res: Response,
  ) {
    // 1. TODO: Extrair o kind do body da requisição
    // 2. TODO: Verificar se o kind está incluso nos tipos KINDS_REENVIOS suportados
    // 3. TODO: Se não estiver suportado, retornar erro 501 com mensagem apropriada
    // 4. TODO: Chamar o método correspondente do reenviarService passando o body e os dados do cedente
    // 5. TODO: Retornar resposta 200 com o resultado
    // 6. TODO: Tratar erros de InvalidFieldsError retornando status e payload apropriados
    // 7. TODO: Tratar demais erros retornando erro interno padrão
  }
}
