import { CacheService } from "@/infrastructure/cache/cache.service";

describe("Cache Connection - Success", () => {
  let cache: CacheService;

  beforeAll(() => {
    cache = CacheService.getInstance();
  });

  it("deve conectar ao Redis com sucesso", async () => {
    await expect(cache.connect()).resolves.not.toThrow();
  });

  it("deve manter conexão em estado aberto", async () => {
    await cache.connect();

    // Verificar se a conexão está aberta através de uma operação simples
    await expect(cache.exists("test-key")).resolves.toBeDefined();
  });

  it("deve lidar com reconexão se já conectado", async () => {
    await cache.connect();
    await expect(cache.connect()).resolves.not.toThrow();
  });
});

describe("Cache Connection - Singleton Pattern", () => {
  it("deve retornar sempre a mesma instância", () => {
    const instance1 = CacheService.getInstance();
    const instance2 = CacheService.getInstance();

    expect(instance1).toBe(instance2);
  });

  it("deve compartilhar estado entre instâncias", async () => {
    const instance1 = CacheService.getInstance();
    const instance2 = CacheService.getInstance();

    await instance1.connect();
    await instance1.setWithTTL("singleton-test", "value", 60);

    const value = await instance2.get("singleton-test");
    expect(value).toBe("value");
  });
});
