import { Request, Response } from "express";
import { ReenviarSchemaDTO } from "../validators/ReenviarSchema";
import { ErrorResponse } from "@/shared/errors/ErrorResponse";

export class ReenviarController {
  public async reenviar(
    req: Request<{}, {}, ReenviarSchemaDTO> & { cedenteId: number },
    res: Response,
  ) {
    // TODO: Implementar lógica completa do controller
    // 1. Extrair dados do request (body e cedenteId)
    // 2. Instanciar use cases e services
    // 3. Executar ValidarServicosUseCase
    // 4. Executar ConfigurarNotificacaoUseCase
    // 5. Executar ReenviarService para gerar payloads
    // 6. Enviar payloads para TechnoSpeed
    // 7. Salvar protocolos no banco (WebhookReprocessado)
    // 8. Retornar resposta de sucesso com:
    //    - message: "Notificação gerada com sucesso"
    //    - protocolos: array de UUIDs
    //    - total: quantidade processada
    //    - timestamp: data/hora
    //    - product: produto processado
    // 9. Try/catch para tratar erros:
    //    - InvalidFieldsError → 400
    //    - Erros genéricos → 500

    // RED: Implementação vazia para os testes falharem
    // Retorna resposta vazia sem processar nada
    try {
      res.status(200).json({});
    } catch (error) {
      res.status(500).json(
        ErrorResponse.internalServerErrorFromError(error as Error),
      );
    }
  }
}
