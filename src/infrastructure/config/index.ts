import { z } from "zod";

z.config(z.locales.pt());

const envSchema = z.object({
  NODE_ENV: z.string().min(2),
  PORT: z
    .string()
    .refine((val) => !isNaN(Number(val)), {
      message: "PORT deve ser um número válido",
    })
    .transform(Number),

  DB_USERNAME: z.string().min(2),
  DB_PASSWORD: z.string().min(2),
  DB_DATABASE: z.string().min(2),
  DB_HOST: z.string().min(2),
  DB_PORT: z
    .string()
    .refine((val) => !isNaN(Number(val)), {
      message: "DB_PORT deve ser um número válido",
    })
    .transform(Number),

  REDIS_PASSWORD: z.string().min(2),
  REDIS_PORT: z
    .string()
    .refine((val) => !isNaN(Number(val)), {
      message: "REDIS_PORT deve ser um número válido",
    })
    .transform(Number),
  REDIS_HOST: z.string().min(2),

  TECNOSPEED_BASE_URL: z.url(),
});

const { success, data, error } = envSchema.safeParse(process.env);

if (!success) {
  console.error("Variáveis de ambiente inválidas:", z.prettifyError(error));
  process.exit(1);
}

export const config = data;
