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
    const ttl = 2; // 2 segundo

    await cache.setWithTTL(key, value, ttl);

    const beforeExpire = await cache.get(key);
    expect(beforeExpire).toBe(value);

    await new Promise((resolve) => setTimeout(resolve, 2500));

    const afterExpire = await cache.get(key);
    expect(afterExpire).toBeNull();
  }, 3000);
});
