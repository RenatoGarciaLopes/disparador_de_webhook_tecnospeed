import { z } from "zod";
import { envSchema } from "./schema";

const { success, data, error } = envSchema.safeParse(process.env);

if (!success) {
  console.error("Variáveis de ambiente inválidas:", z.prettifyError(error));
  process.exit(1);
}

export const config = data;
