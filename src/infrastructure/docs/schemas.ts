import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

export const ErrorResponseSchema = z
  .object({
    code: z.string().meta({
      description: "Código do erro",
      example: "BAD_REQUEST",
    }),
    statusCode: z.number().int().meta({
      description: "Código do status HTTP",
      example: 400,
    }),
    error: z
      .object({
        errors: z.array(z.string()).meta({
          description: "Mensagens de erro",
          example: ["Erro de teste"],
        }),
        properties: z.record(z.string(), z.any()).meta({
          description: "Propriedades do erro",
          example: {
            nome: "Erro de teste",
          },
        }),
      })
      .meta({
        description: "Erro",
        example: {
          errors: ["Erro de teste"],
          properties: { nome: "Erro de teste" },
        },
      }),
  })
  .strict();

export function registerErrorResponse(registry: OpenAPIRegistry) {
  registry.register("ErrorResponse", z.object(ErrorResponseSchema.shape));
}
