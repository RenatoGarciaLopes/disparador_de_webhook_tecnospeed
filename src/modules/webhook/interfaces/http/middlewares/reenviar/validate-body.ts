import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import {
  ReenviarSchema,
  ReenviarSchemaDTO,
} from "../../validators/ReenviarSchema";

export async function validateBody<T>(body: T): Promise<ReenviarSchemaDTO> {
  const { data, success, error } = ReenviarSchema.safeParse(body);
  if (!success) throw InvalidFieldsError.fromZodError(error);
  return data;
}
