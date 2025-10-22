import { z } from "zod";

export const ProtocoloParamDTOValidator = z
  .object({
    id: z.uuid(),
  })
  .strict();
