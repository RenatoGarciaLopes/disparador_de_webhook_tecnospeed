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
    try {
      // 1. Extrair kind do body
      const kind = (req.body as any)?.kind ?? (req.body as any)?.type;
      if (!kind) {
        const body =
          typeof (ErrorResponse as any).badRequest === "function"
            ? (ErrorResponse as any).badRequest("Campo 'kind' é obrigatório.")
            : {
                code: "BAD_REQUEST",
                statusCode: 400,
                error: { errors: ["Campo 'kind' é obrigatório."] },
              };
        return res.status(400).json(body);
      }

      // 2. Verificar suporte
      if (!KINDS_REENVIOS.includes(kind)) {
        const body =
          typeof (ErrorResponse as any).notImplemented === "function"
            ? (ErrorResponse as any).notImplemented(
                `Tipo de reenvio '${kind}' não suportado. Tipos suportados: ${KINDS_REENVIOS.join(
                  ", ",
                )}`,
              )
            : {
                code: "NOT_IMPLEMENTED",
                statusCode: 501,
                error: {
                  errors: [
                    `Tipo de reenvio '${kind}' não suportado. Tipos suportados: ${KINDS_REENVIOS.join(
                      ", ",
                    )}`,
                  ],
                },
              };
        return res.status(501).json(body);
      }

      // 4. Chamar handler apropriado na service
      const handler =
        (this.reenviarService as any)[kind] ??
        (this.reenviarService as any).webhook;
      if (typeof handler !== "function") {
        const body =
          typeof (ErrorResponse as any).notImplemented === "function"
            ? (ErrorResponse as any).notImplemented(
                `Reenvio para kind '${kind}' não implementado.`,
              )
            : {
                code: "NOT_IMPLEMENTED",
                statusCode: 501,
                error: {
                  errors: [`Reenvio para kind '${kind}' não implementado.`],
                },
              };
        return res.status(501).json(body);
      }

      // Obter CNPJ do cedente (tenta .get primeiro, depois headers e body)
      const cedenteCnpj =
        (req.get?.("x-api-cnpj-cedente") as string) ||
        (req.headers["x-api-cnpj-cedente"] as string) ||
        (req.body as any).cedenteCnpj ||
        (req.body as any).cedente?.cnpj ||
        "";

      // Suportar variantes de assinatura da service
      let result;
      if ((handler as any).length >= 3) {
        // assinatura: (data, cedenteId, softwareHouseId)
        result = await handler.call(
          this.reenviarService,
          req.body,
          req.cedenteId,
          req.softwareHouseId,
        );
      } else {
        // assinatura: (data, cedente: { id, cnpj })
        const cedente = {
          id: req.cedenteId,
          cnpj: cedenteCnpj,
        };
        result = await handler.call(this.reenviarService, req.body, cedente);
      }

      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof InvalidFieldsError) {
        // preferir toJSON() se existir, senão tentar payload/details, senão montar padrão
        const toJSONResult =
          typeof (error as any).toJSON === "function"
            ? (error as any).toJSON()
            : undefined;
        const errorData =
          toJSONResult ??
          (typeof (error as any).payload !== "undefined"
            ? (error as any).payload
            : {
                code: (error as any).code ?? "INVALID_FIELDS",
                statusCode: (error as any).statusCode ?? 400,
                error: {
                  errors: [(error as any).message ?? String(error)],
                },
              });
        return res.status(errorData.statusCode ?? 400).json(errorData);
      }

      // não logar em ambiente de teste para evitar poluir saída dos testes
      if (process.env.NODE_ENV !== "test") {
        console.error("[ReenviarController] erro ao reenviar:", error);
      }

      // usar helper ErrorResponse se disponível (testes esperam uso desses helpers)
      const body =
        typeof (ErrorResponse as any).internalServerErrorFromError ===
        "function"
          ? (ErrorResponse as any).internalServerErrorFromError(
              error instanceof Error ? error : new Error(String(error)),
            )
          : {
              code: "INTERNAL_SERVER_ERROR",
              statusCode: 500,
              error: {
                errors: [
                  error?.message ?? "Erro interno ao processar reenvio.",
                ],
              },
            };

      return res.status(body.statusCode ?? 500).json(body);
    }
  }
}
