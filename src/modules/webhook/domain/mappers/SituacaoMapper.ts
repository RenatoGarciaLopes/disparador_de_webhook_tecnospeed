import { ReenviarDTO } from "../../interfaces/http/dtos/ReenviarDTO";

export class SituacaoMapper {
  static toBoleto(situacao: ReenviarDTO["type"]) {
    const map: Record<ReenviarDTO["type"], string> = {
      disponivel: "REGISTRADO",
      cancelado: "BAIXADO",
      pago: "LIQUIDADO",
    };

    return map[situacao];
  }

  static toPagamento(situacao: ReenviarDTO["type"]) {
    const map: Record<ReenviarDTO["type"], string> = {
      disponivel: "SCHEDULED ACTIVE",
      cancelado: "CANCELLED",
      pago: "PAID",
    };

    return map[situacao];
  }

  static toPix(situacao: ReenviarDTO["type"]) {
    const map: Record<ReenviarDTO["type"], string> = {
      disponivel: "ACTIVE",
      cancelado: "REJECTED",
      pago: "LIQUIDATED",
    };

    return map[situacao];
  }
}
