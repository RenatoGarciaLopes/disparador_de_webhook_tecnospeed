import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import {
  ProtocolosSchema,
  ProtocolosSchemaDTO,
} from "../../validators/ProtocolosSchema";

export async function validateBody<T>(body: T): Promise<ProtocolosSchemaDTO> {
  const { data, success, error } = ProtocolosSchema.safeParse(body);
  if (!success) throw InvalidFieldsError.fromZodError(error);
  return data;
}
