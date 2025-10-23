import { z } from "zod";

export const ReenviarDTOValidator = z
  .object({
    product: z
      .enum(["boleto", "pagamento", "pix"])
      .transform((val) => val.toUpperCase()),
    id: z
      .array(
        z
          .string()
          .transform((val) => Number(val))
          .refine((val) => !isNaN(val) && val > 0 && val % 1 === 0, {
            message: "id deve ser um número inteiro positivo",
          }),
      )
      .max(30)
      .min(1),
    kind: z.string(),
    type: z.enum(["pago", "cancelado", "disponivel"]),
  })
  .strict();
