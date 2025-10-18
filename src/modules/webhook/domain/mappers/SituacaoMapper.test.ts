import { SituacaoMapper } from "./SituacaoMapper";

describe("[Mapper] SituacaoMapper", () => {
  describe("mapToSituacao", () => {
    describe("BOLETO", () => {
      it("deve mapear BOLETO + DISPONIVEL → REGISTRADO", () => {
        const result = SituacaoMapper.mapToSituacao("BOLETO", "DISPONIVEL");
        expect(result).toBe("REGISTRADO");
      });

      it("deve mapear BOLETO + CANCELADO → BAIXADO", () => {
        const result = SituacaoMapper.mapToSituacao("BOLETO", "CANCELADO");
        expect(result).toBe("BAIXADO");
      });

      it("deve mapear BOLETO + PAGO → LIQUIDADO", () => {
        const result = SituacaoMapper.mapToSituacao("BOLETO", "PAGO");
        expect(result).toBe("LIQUIDADO");
      });
    });

    describe("PAGAMENTO", () => {
      it("deve mapear PAGAMENTO + DISPONIVEL → SCHEDULED ACTIVE", () => {
        const result = SituacaoMapper.mapToSituacao("PAGAMENTO", "DISPONIVEL");
        expect(result).toBe("SCHEDULED ACTIVE");
      });

      it("deve mapear PAGAMENTO + CANCELADO → CANCELLED", () => {
        const result = SituacaoMapper.mapToSituacao("PAGAMENTO", "CANCELADO");
        expect(result).toBe("CANCELLED");
      });

      it("deve mapear PAGAMENTO + PAGO → PAID", () => {
        const result = SituacaoMapper.mapToSituacao("PAGAMENTO", "PAGO");
        expect(result).toBe("PAID");
      });
    });

    describe("PIX", () => {
      it("deve mapear PIX + DISPONIVEL → ACTIVE", () => {
        const result = SituacaoMapper.mapToSituacao("PIX", "DISPONIVEL");
        expect(result).toBe("ACTIVE");
      });

      it("deve mapear PIX + CANCELADO → REJECTED", () => {
        const result = SituacaoMapper.mapToSituacao("PIX", "CANCELADO");
        expect(result).toBe("REJECTED");
      });

      it("deve mapear PIX + PAGO → LIQUIDATED", () => {
        const result = SituacaoMapper.mapToSituacao("PIX", "PAGO");
        expect(result).toBe("LIQUIDATED");
      });
    });

    describe("Validações e erros", () => {
      it("deve lançar erro para product inválido", () => {
        expect(() => {
          SituacaoMapper.mapToSituacao("INVALID" as any, "DISPONIVEL");
        }).toThrow();
      });

      it("deve lançar erro para type inválido", () => {
        expect(() => {
          SituacaoMapper.mapToSituacao("BOLETO", "INVALID" as any);
        }).toThrow();
      });

      it("deve lançar erro para combinação inválida", () => {
        expect(() => {
          SituacaoMapper.mapToSituacao("" as any, "" as any);
        }).toThrow();
      });
    });

    describe("Case sensitivity", () => {
      it("deve funcionar com valores em maiúsculo", () => {
        const result = SituacaoMapper.mapToSituacao("BOLETO", "DISPONIVEL");
        expect(result).toBe("REGISTRADO");
      });

      it("deve ser case-sensitive para product", () => {
        expect(() => {
          SituacaoMapper.mapToSituacao("boleto" as any, "DISPONIVEL");
        }).toThrow();
      });

      it("deve ser case-sensitive para type", () => {
        expect(() => {
          SituacaoMapper.mapToSituacao("BOLETO", "disponivel" as any);
        }).toThrow();
      });
    });
  });
});
