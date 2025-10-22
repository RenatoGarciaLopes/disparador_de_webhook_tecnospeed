import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { ProtocoloParamDTOValidator } from "../validators/ProtocoloParamDTOValidator";

export interface IProtocoloParamDTO {
  id: string;
}

export class ProtocoloParamDTO implements IProtocoloParamDTO {
  declare id: IProtocoloParamDTO["id"];

  constructor(body: unknown) {
    const { success, data, error } = ProtocoloParamDTOValidator.safeParse(body);
    if (!success) throw InvalidFieldsError.fromZodError(error);
    Object.assign(this, data);
  }
}
