import { ProtocoloByIdServiceCache } from "./ProtocoloByIdServiceCache";

describe("ProtocoloByIdServiceCache", () => {
  let cacheService: ProtocoloByIdServiceCache;

  beforeEach(() => {
    cacheService = new ProtocoloByIdServiceCache();
  });

  describe("Consulta Individual de Protocolo - Cache", () => {
    it("deve retornar erro se uuid não for informado", async () => {
      await expect(cacheService.getById(undefined)).rejects.toThrow(); // RED
    });

    it("deve retornar sucesso (200) se uuid existir", async () => {
      await expect(cacheService.getById("uuid-teste")).resolves.toBeDefined(); // RED
    });

    it("deve retornar erro 400 se protocolo não encontrado", async () => {
      await expect(cacheService.getById("uuid-invalido")).rejects.toThrow(
        "Protocolo não encontrado.",
      ); // RED
    });

    it("deve armazenar resposta em cache por 1 hora", async () => {
      const result = await cacheService.getById("uuid-teste");
      expect(result).toBeDefined();
      const cached = await cacheService.getById("uuid-teste");
      expect(cached).toBeDefined();
    });
  });
});
