import { z } from "zod";

z.config(z.locales.pt());

const envSchema = z.object({
  NODE_ENV: z.string(),
  PORT: z.string().transform(Number),

  DB_USERNAME: z.string(),
  DB_PASSWORD: z.string(),
  DB_DATABASE: z.string(),
  DB_HOST: z.string(),
  DB_PORT: z.string().transform(Number),
});

const { success, data, error } = envSchema.safeParse(process.env);

if (!success) {
  console.error("Variáveis de ambiente inválidas:", z.prettifyError(error));
  process.exit(1);
}

export const config = data;
