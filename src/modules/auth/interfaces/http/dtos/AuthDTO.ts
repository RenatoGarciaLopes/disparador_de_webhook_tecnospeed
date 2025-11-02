import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { IncomingHttpHeaders } from "http";
import { AuthDTOValidator } from "../validators/AuthDTOValidator";

export interface IAuthDTO {
  softwareHouse: {
    cnpj: string;
    token: string;
  };
  cedente: {
    cnpj: string;
    token: string;
  };
}

export class AuthDTO implements IAuthDTO {
  declare softwareHouse: IAuthDTO["softwareHouse"];
  declare cedente: IAuthDTO["cedente"];

  constructor(headers: IncomingHttpHeaders) {
    const { success, data, error } = AuthDTOValidator.safeParse(headers);
    if (!success) throw InvalidFieldsError.fromZodError(error);

    this.softwareHouse = {
      cnpj: data["x-api-cnpj-sh"],
      token: data["x-api-token-sh"],
    };
    this.cedente = {
      cnpj: data["x-api-cnpj-cedente"],
      token: data["x-api-token-cedente"],
    };
  }
}
