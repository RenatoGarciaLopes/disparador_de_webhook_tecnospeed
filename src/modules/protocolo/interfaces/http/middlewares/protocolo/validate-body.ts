import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import {
  ProtocolosSchema,
  ProtocolosSchemaDTO,
} from "../../validators/ProtocolosSchema";

function normalizeBody(body: any): any {
  return {
    start_date: body.start_date ? new Date(body.start_date) : undefined,
    end_date: body.end_date ? new Date(body.end_date) : undefined,
    product:
      typeof body.product === "string" ? body.product.toUpperCase() : undefined,
    type: typeof body.type === "string" ? body.type.toUpperCase() : undefined,
    id: Array.isArray(body.id)
      ? body.id.map((v: any) => parseInt(v, 10))
      : undefined,
    kind: typeof body.kind === "string" ? body.kind : undefined,
  };
}

export async function validateBody<T>(body: T): Promise<ProtocolosSchemaDTO> {
  const rawBody = body as any;

  if (!rawBody || Object.keys(rawBody).length === 0) {
    throw new InvalidFieldsError(
      { errors: ["start_date e end_date são obrigatórios"] },
      "INVALID_FIELDS",
    );
  }

  const allowedFields = [
    "start_date",
    "end_date",
    "product",
    "type",
    "id",
    "kind",
  ];
  const extraFields = Object.keys(rawBody).filter(
    (f) => !allowedFields.includes(f),
  );
  if (extraFields.length > 0) {
    throw new InvalidFieldsError(
      { errors: extraFields.map((f) => `Campo não permitido: ${f}`) },
      "INVALID_FIELDS",
    );
  }

  if (rawBody.id && !Array.isArray(rawBody.id)) {
    throw new InvalidFieldsError(
      { errors: ["id deve ser um array"] },
      "INVALID_FIELDS",
    );
  }

  if (Array.isArray(rawBody.id)) {
    const invalidId = rawBody.id.some(
      (v: any) =>
        typeof v !== "string" || !/^[0-9]+$/.test(v) || parseInt(v, 10) <= 0,
    );
    if (invalidId) {
      throw new InvalidFieldsError(
        {
          errors: [
            "id deve ser um array de strings de números inteiros positivos",
          ],
        },
        "INVALID_FIELDS",
      );
    }
  }

  const normalized = normalizeBody(rawBody);
  const { start_date, end_date } = normalized;

  if (start_date && end_date) {
    if (
      !(start_date instanceof Date) ||
      isNaN(start_date.getTime()) ||
      !(end_date instanceof Date) ||
      isNaN(end_date.getTime())
    ) {
      throw new InvalidFieldsError(
        { errors: ["Datas inválidas"] },
        "INVALID_FIELDS",
      );
    }

    const diffDays =
      (end_date.getTime() - start_date.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays < 0) {
      throw new InvalidFieldsError(
        { errors: ["start_date não pode ser maior que end_date"] },
        "INVALID_FIELDS",
      );
    }
    if (diffDays > 31) {
      throw new InvalidFieldsError(
        { errors: ["Intervalo entre datas não pode ser maior que 31 dias"] },
        "INVALID_FIELDS",
      );
    }
  }

  const { success, data, error } = ProtocolosSchema.safeParse(normalized);
  if (!success) {
    throw InvalidFieldsError.fromZodError(error);
  }

  return data;
}
