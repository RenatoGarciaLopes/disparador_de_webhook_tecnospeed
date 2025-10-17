import { z } from "zod";

export const ReenviarSchema = z
  .object({
    product: z.any(),
    id: z.any(),
    kind: z.any(),
    type: z.any(),
  })
  .strict();

export type ReenviarSchemaDTO = z.infer<typeof ReenviarSchema>;
