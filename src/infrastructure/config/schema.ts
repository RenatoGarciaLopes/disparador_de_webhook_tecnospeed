import { z } from "zod";

z.config(z.locales.pt());

export const envSchema = z.object({
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

  HTTP_TIMEOUT_MS: z.coerce.number().default(5 * 1000), // 5s default

  CB_TIMEOUT_MS: z.coerce.number().default(4 * 1000), // 4s default
  CB_RESET_TIMEOUT_MS: z.coerce.number().default(30 * 1000), // 30s default
  CB_ERROR_THRESHOLD_PERCENT: z.coerce.number().min(1).max(100).default(50),
  CB_VOLUME_THRESHOLD: z.coerce.number().default(10),

  CLUSTERS: z.coerce.number().default(2),
});
