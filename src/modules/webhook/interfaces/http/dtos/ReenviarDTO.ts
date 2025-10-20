import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { IKindReenvio } from "@/shared/kind-reenvios";
import { ReenviarDTOValidator } from "../validators/ReenviarDTOValidator";

export interface IReenviarDTO {
  product: "BOLETO" | "PAGAMENTO" | "PIX";
  id: number[];
  kind: IKindReenvio;
  type: "pago" | "cancelado" | "disponivel";
}

export class ReenviarDTO implements IReenviarDTO {
  declare product: IReenviarDTO["product"];
  declare id: IReenviarDTO["id"];
  declare kind: IReenviarDTO["kind"];
  declare type: IReenviarDTO["type"];

  constructor(body: unknown) {
    const { success, data, error } = ReenviarDTOValidator.safeParse(body);
    if (!success) throw InvalidFieldsError.fromZodError(error);
    Object.assign(this, data);
  }
}
