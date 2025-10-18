export type ProductType = "BOLETO" | "PAGAMENTO" | "PIX";
export type NotificationType = "DISPONIVEL" | "CANCELADO" | "PAGO";
export type SituacaoType =
  | "REGISTRADO"
  | "BAIXADO"
  | "LIQUIDADO"
  | "SCHEDULED ACTIVE"
  | "CANCELLED"
  | "PAID"
  | "ACTIVE"
  | "REJECTED"
  | "LIQUIDATED";

/**
 * Mapper para converter type + product em situação específica
 * Baseado na tabela de situações (DOCS_ENDPOINT_REENVIAR.md linhas 108-114)
 */
export class SituacaoMapper {
  /**
   * Mapeia o type (disponível/cancelado/pago) para a situação específica do produto
   * @param product - Tipo do produto (BOLETO, PAGAMENTO ou PIX)
   * @param type - Tipo de notificação (DISPONIVEL, CANCELADO ou PAGO)
   * @returns Situação mapeada conforme tabela
   * @throws Error se combinação for inválida
   */
  static mapToSituacao(
    product: ProductType,
    type: NotificationType,
  ): SituacaoType {
    // TODO: Implementar mapeamento conforme tabela de situações
    // RED: Retorna sempre vazio para os testes falharem
    throw new Error("Not implemented");
  }
}
