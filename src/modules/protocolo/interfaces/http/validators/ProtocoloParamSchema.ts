import { z } from "zod";

export const ProtocoloParamSchema = z
  .object({
    id: z.string().uuid({ message: "id deve ser um UUID válido" }),
  })
  .strict();

export type ProtocoloParamSchemaDTO = z.infer<typeof ProtocoloParamSchema>;
