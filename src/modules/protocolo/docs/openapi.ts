import { ErrorResponseSchema } from "@/infrastructure/docs/schemas";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

export function registerProtocoloDocs(registry: OpenAPIRegistry) {
  const ProtocolosDTOSchema = z
    .object({
      start_date: z.string().meta({
        description: "Data de início da consulta (formato ISO 8601)",
        example: "2025-01-01",
      }),
      end_date: z.string().meta({
        description: "Data de fim da consulta (formato ISO 8601)",
        example: "2025-01-31",
      }),
      product: z.enum(["boleto", "pagamento", "pix"]).optional().meta({
        description: "Tipo de produto a ser consultado",
        example: "boleto",
      }),
      id: z
        .array(z.string())
        .optional()
        .meta({
          description: "IDs de serviço (strings)",
          example: ["1", "2", "3"],
        }),
      kind: z.string().optional().meta({
        description: "Tipo de reenvio",
        example: "webhook",
      }),
      type: z.enum(["pago", "cancelado", "disponivel"]).optional().meta({
        description: "Situação dos serviços a ser consultado",
        example: "pago",
      }),
      page: z.number().int().positive().optional().meta({
        description: "Número da página a ser consultada",
        example: 1,
      }),
      limit: z.number().int().positive().max(100).optional().meta({
        description: "Limite de resultados por página",
        example: 10,
      }),
    })
    .strict();
  registry.register("ProtocolosDTO", ProtocolosDTOSchema);

  const ProtocoloSchema = z
    .object({
      id: z.uuid().optional().meta({
        description: "ID do protocolo",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
      data: z.record(z.string(), z.any()).meta({
        description: "Dados da requisição montada para reenvio",
        example: {
          "<chave>": "<valor>",
        },
      }),
      data_criacao: z.string().meta({
        description: "Data de criação da requisição (formato ISO 8601)",
        example: "2025-01-01T00:00:00.000Z",
      }),
      cedente_id: z.number().int().meta({
        description: "ID do cedente",
        example: 1,
      }),
      kind: z.string().meta({
        description: "Tipo de reenvio",
        example: "webhook",
      }),
      type: z.string().meta({
        description: "Situação dos serviços a ser reenviado",
        example: "pago",
      }),
      servico_id: z.array(z.string()).meta({
        description: "IDs dos serviços a ser reenviado",
        example: ["1", "2", "3"],
      }),
      product: z.string().meta({
        description: "Tipo de produto a ser reenviado",
        example: "boleto",
      }),
      protocolo: z.string().meta({
        description: "UUID do protocolo retornado pela API da Tecnospeed",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
    })
    .strict();
  registry.register("Protocolo", ProtocoloSchema);

  const ProtocolosPageSchema = z
    .object({
      data: z.array(ProtocoloSchema),
      pagination: z.object({
        page: z.number().int().positive().meta({
          description: "Número da página",
          example: 1,
        }),
        limit: z.number().int().positive().meta({
          description: "Limite de resultados por página",
          example: 10,
        }),
        total: z.number().int().nonnegative().meta({
          description: "Total de resultados",
          example: 100,
        }),
        total_pages: z.number().int().nonnegative().meta({
          description: "Total de páginas",
          example: 10,
        }),
      }),
    })
    .strict();
  registry.register("ProtocolosPage", ProtocolosPageSchema);

  registry.registerPath({
    method: "get",
    path: "/protocolos",
    tags: ["Protocolos"],
    request: {
      params: ProtocolosDTOSchema,
    },
    responses: {
      200: {
        description: "Lista de protocolos paginada",
        content: {
          "application/json": { schema: ProtocolosPageSchema },
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
      500: {
        description: "Erro interno",
        content: {
          "application/json": { schema: ErrorResponseSchema },
        },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/protocolos/{id}",
    tags: ["Protocolos"],
    request: {
      params: z.object({
        id: z.uuid().meta({
          description: "ID do protocolo",
          example: "123e4567-e89b-12d3-a456-426614174000",
        }),
      }),
    },
    responses: {
      200: {
        description: "Protocolo encontrado",
        content: {
          "application/json": { schema: ProtocoloSchema },
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
      404: {
        description: "Protocolo não encontrado",
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
