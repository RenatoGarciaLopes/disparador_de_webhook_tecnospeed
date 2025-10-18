import { ProtocolosServiceCache } from "./ProtocolosServiceCache";

describe("ProtocolosServiceCache", () => {
  let cacheService: ProtocolosServiceCache;

  beforeEach(() => {
    cacheService = new ProtocolosServiceCache();
  });

  describe("Listagem de Protocolos - Cache", () => {
    it("deve retornar erro se start_date ou end_date não forem informados", async () => {
      await expect(cacheService.getList({})).rejects.toThrow();
    });

    it("deve validar intervalo de datas permitido", async () => {
      await expect(
        cacheService.getList({
          start_date: "2025-10-10",
          end_date: "2025-09-01",
        }),
      ).rejects.toThrow(); // RED
    });

    it("deve validar campos opcionais (product, id, kind, type)", async () => {
      await expect(
        cacheService.getList({
          start_date: "2025-10-01",
          end_date: "2025-10-10",
          product: "INVALID",
          id: [1, 2],
          kind: "INVALID",
          type: "INVALID",
        }),
      ).rejects.toThrow(); // RED
    });

    it("deve armazenar resposta em cache por 1 dia", async () => {
      await expect(
        cacheService.getList({
          start_date: "2025-10-01",
          end_date: "2025-10-10",
          product: "BOLETO",
          id: [1, 2],
          kind: "webhook",
          type: "DISPONIVEL",
        }),
      ).resolves.toBeDefined(); // RED
    });

    it("deve retornar dados do cache se filtro for repetido", async () => {
      const filtros = {
        start_date: "2025-10-01",
        end_date: "2025-10-10",
        product: "BOLETO",
        id: [1, 2],
        kind: "webhook",
        type: "DISPONIVEL",
      };
      await cacheService.getList(filtros);
      await expect(cacheService.getList(filtros)).resolves.toBeDefined(); // Segunda chamada (cache)
    });
  });
});
