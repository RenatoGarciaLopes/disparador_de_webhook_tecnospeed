import { CacheService } from "@/infrastructure/cache/cache.service";

describe("Cache TTL - Basic Expiration", () => {
  let cache: CacheService;

  beforeAll(async () => {
    cache = CacheService.getInstance();
    await cache.connect();
  });

  it("deve expirar chave após TTL", async () => {
    const key = "test:ttl:expire";
    const value = "temporary";
    const ttl = 1; // 1 segundo

    await cache.setWithTTL(key, value, ttl);

    // Verificar que existe
    const beforeExpire = await cache.get(key);
    expect(beforeExpire).toBe(value);

    // Aguardar expiração
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Verificar que expirou
    const afterExpire = await cache.get(key);
    expect(afterExpire).toBeNull();
  }, 3000);
});
