import { KINDS_REENVIOS } from "@/shared/kind-reenvios";
import { z } from "zod";

export const ProtocolosDTOValidator = z
  .object({
    start_date: z
      .string()
      .transform((val) => new Date(val))
      .refine((val) => !isNaN(val.getTime()), {
        message: "Data inicial inválida",
      }),
    end_date: z
      .string()
      .transform((val) => new Date(val))
      .refine((val) => !isNaN(val.getTime()), {
        message: "Data final inválida",
      }),
    product: z
      .enum(["boleto", "pagamento", "pix"])
      .transform((val) => val.toUpperCase())
      .optional(),
    id: z
      .array(
        z.string().refine(
          (val) => {
            const num = Number(val);
            return !isNaN(num) && num > 0 && num % 1 === 0;
          },
          { message: "id deve ser um número inteiro positivo" },
        ),
      )
      .optional(),
    kind: z.enum(KINDS_REENVIOS).optional(),
    type: z.enum(["pago", "cancelado", "disponivel"]).optional(),
  })
  .strict()
  .refine(
    (data) => {
      const diffDays =
        (data.end_date.getTime() - data.start_date.getTime()) /
        (1000 * 60 * 60 * 24);

      if (diffDays < 0) {
        return false;
      }
      if (diffDays > 31) {
        return false;
      }
      return true;
    },
    {
      message:
        "A diferença entre start_date e end_date tem quer ser >= 0 e <= 31 dias",
    },
  );
