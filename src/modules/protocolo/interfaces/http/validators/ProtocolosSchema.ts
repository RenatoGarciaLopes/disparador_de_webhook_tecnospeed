import { z } from "zod";

export const ProtocolosSchema = z
  .object({
    start_date: z.any(),
    end_date: z.any(),
    product: z.any(),
    id: z.any(),
    kind: z.any(),
    type: z.any(),
  })
  .strict();

export type ProtocolosSchemaDTO = z.infer<typeof ProtocolosSchema>;
