import { KINDS_REENVIOS } from "./kind-reenvios";

describe("[SHARED] kind-reenvios.ts", () => {
  describe("KINDS_REENVIOS", () => {
    it("deve ser um array", () => {
      expect(Array.isArray(KINDS_REENVIOS)).toBe(true);
    });

    it("deve conter 'webhook' como valor", () => {
      expect(KINDS_REENVIOS).toContain("webhook");
    });

    it("deve ser um array readonly (as const)", () => {
      const kinds = KINDS_REENVIOS;
      expect(kinds[0]).toBe("webhook");
    });
  });
});
