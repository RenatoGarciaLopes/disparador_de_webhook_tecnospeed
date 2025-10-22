import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { IKindReenvio } from "@/shared/kind-reenvios";
import { ProtocolosDTOValidator } from "../validators/ProtocolosDTOValidator";

export interface IProtocolosDTO {
  start_date: Date;
  end_date: Date;
  product?: "BOLETO" | "PAGAMENTO" | "PIX";
  id?: string[];
  kind?: IKindReenvio;
  type?: "pago" | "cancelado" | "disponivel";
}

export class ProtocolosDTO implements IProtocolosDTO {
  declare start_date: IProtocolosDTO["start_date"];
  declare end_date: IProtocolosDTO["end_date"];
  declare product: IProtocolosDTO["product"];
  declare id: IProtocolosDTO["id"];
  declare kind: IProtocolosDTO["kind"];
  declare type: IProtocolosDTO["type"];

  constructor(body: unknown) {
    const { success, data, error } = ProtocolosDTOValidator.safeParse(body);
    if (!success) throw InvalidFieldsError.fromZodError(error);
    Object.assign(this, data);
  }
}
