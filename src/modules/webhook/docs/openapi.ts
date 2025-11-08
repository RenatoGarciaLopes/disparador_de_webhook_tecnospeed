import { ErrorResponseSchema } from "@/infrastructure/docs/schemas";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

export function registerWebhookDocs(registry: OpenAPIRegistry) {
  const ReenviarDTOSchema = z.object({
    product: z.enum(["boleto", "pagamento", "pix"]).meta({
      description: "Tipo dos serviços a ser reenviado",
      example: "boleto",
    }),
    id: z
      .array(z.string())
      .min(1)
      .max(30)
      .meta({
        description:
          "IDs dos serviços a ser reenviado (inteiros positivos como strings)",
        example: ["1", "2", "3"],
      }),
    kind: z
      .string()
      .meta({ description: "Tipo de reenvio", example: "webhook" }),
    type: z.enum(["pago", "cancelado", "disponivel"]).meta({
      description: "Situação dos serviços a ser reenviado",
      example: "pago",
    }),
  });
  registry.register("ReenviarDTO", ReenviarDTOSchema);

  const ReenviarSuccessSchema = z
    .object({
      message: z.string(),
      protocolo: z.string(),
    })
    .strict();
  registry.register("ReenviarSuccess", ReenviarSuccessSchema);

  registry.registerPath({
    method: "post",
    path: "/reenviar",
    tags: ["Webhook"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: ReenviarDTOSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Notificação reenviada com sucesso",
        content: {
          "application/json": { schema: ReenviarSuccessSchema },
        },
      },
      400: {
        description: "Requisição inválida",
        content: {
          "application/json": { schema: ErrorResponseSchema },
        },
      },
      401: {
        description: "Não autorizado",
        content: {
          "application/json": { schema: ErrorResponseSchema },
        },
      },
      409: {
        description:
          "Requisição duplicada e já processada, os serviços já foram processados anteriormente",
        content: {
          "application/json": { schema: ErrorResponseSchema },
        },
      },
      422: {
        description: "Campos inválidos",
        content: {
          "application/json": { schema: ErrorResponseSchema },
        },
      },
      500: {
        description: "Erro interno",
        content: {
          "application/json": { schema: ErrorResponseSchema },
        },
      },
    },
  });
}
