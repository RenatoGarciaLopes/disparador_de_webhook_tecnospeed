import { z } from "zod";

export const ProtocoloParamSchema = z
  .object({
    id: z.any(),
  })
  .strict();

export type ProtocoloParamSchemaDTO = z.infer<typeof ProtocoloParamSchema>;
