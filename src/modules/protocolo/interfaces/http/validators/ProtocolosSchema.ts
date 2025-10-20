import { z } from "zod";

export const ProtocolosSchema = z
  .object({
    start_date: z.date(),
    end_date: z.date(),
    product: z.enum(["PIX", "PAGAMENTO", "BOLETO"]).optional(),
    id: z.array(z.number().int().positive()).optional(),
    kind: z.enum(["webhook", "evento", "agendamento"]).optional(),
    type: z.enum(["DISPONIVEL", "CANCELADO", "PAGO"]).optional(),
  })
  .strict();

export type ProtocolosSchemaDTO = z.infer<typeof ProtocolosSchema>;
