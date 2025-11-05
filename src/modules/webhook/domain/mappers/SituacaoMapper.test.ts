import { SituacaoMapper } from "./SituacaoMapper";

describe("[WEBHOOK] SituacaoMapper", () => {
  describe("toBoleto()", () => {
    it("deve mapear 'disponivel' para 'REGISTRADO'", () => {
      const result = SituacaoMapper.toBoleto("disponivel");
      expect(result).toBe("REGISTRADO");
    });

    it("deve mapear 'cancelado' para 'BAIXADO'", () => {
      const result = SituacaoMapper.toBoleto("cancelado");
      expect(result).toBe("BAIXADO");
    });

    it("deve mapear 'pago' para 'LIQUIDADO'", () => {
      const result = SituacaoMapper.toBoleto("pago");
      expect(result).toBe("LIQUIDADO");
    });
  });

  describe("toPagamento()", () => {
    it("deve mapear 'disponivel' para 'SCHEDULED ACTIVE'", () => {
      const result = SituacaoMapper.toPagamento("disponivel");
      expect(result).toBe("SCHEDULED ACTIVE");
    });

    it("deve mapear 'cancelado' para 'CANCELLED'", () => {
      const result = SituacaoMapper.toPagamento("cancelado");
      expect(result).toBe("CANCELLED");
    });

    it("deve mapear 'pago' para 'PAID'", () => {
      const result = SituacaoMapper.toPagamento("pago");
      expect(result).toBe("PAID");
    });
  });

  describe("toPix()", () => {
    it("deve mapear 'disponivel' para 'ACTIVE'", () => {
      const result = SituacaoMapper.toPix("disponivel");
      expect(result).toBe("ACTIVE");
    });

    it("deve mapear 'cancelado' para 'REJECTED'", () => {
      const result = SituacaoMapper.toPix("cancelado");
      expect(result).toBe("REJECTED");
    });

    it("deve mapear 'pago' para 'LIQUIDATED'", () => {
      const result = SituacaoMapper.toPix("pago");
      expect(result).toBe("LIQUIDATED");
    });
  });
});
