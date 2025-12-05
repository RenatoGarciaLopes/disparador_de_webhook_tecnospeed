import { z } from "zod";

export const AuthDTOValidator = z.object({
  ["x-api-cnpj-sh"]: z.string().length(14),
  ["x-api-token-sh"]: z.string(),
  ["x-api-cnpj-cedente"]: z.string().length(14),
  ["x-api-token-cedente"]: z.string(),
});
