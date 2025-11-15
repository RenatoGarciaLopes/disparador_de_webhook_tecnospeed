import { CacheService } from "@/infrastructure/cache/cache.service";

describe("Cache Operations - Set and Get", () => {
  let cache: CacheService;

  beforeAll(async () => {
    cache = CacheService.getInstance();
    await cache.connect();
  });

  it("deve armazenar e recuperar valor", async () => {
    const key = "test:basic:key";
    const value = "test-value";

    await cache.setWithTTL(key, value, 60);
    const retrieved = await cache.get(key);

    expect(retrieved).toBe(value);
  });

  it("deve retornar null para chave inexistente", async () => {
    const value = await cache.get("test:nonexistent");
    expect(value).toBeNull();
  });

  it("deve armazenar JSON serializado", async () => {
    const key = "test:json";
    const data = { protocolo: "PROTO-001", message: "Success" };
    const value = JSON.stringify(data);

    await cache.setWithTTL(key, value, 60);
    const retrieved = await cache.get(key);

    expect(JSON.parse(retrieved!)).toEqual(data);
  });
});

describe("Cache Operations - Exists", () => {
  let cache: CacheService;

  beforeAll(async () => {
    cache = CacheService.getInstance();
    await cache.connect();
  });

  it("deve retornar true para chave existente", async () => {
    const key = "test:exists:true";
    await cache.setWithTTL(key, "value", 60);

    const exists = await cache.exists(key);
    expect(exists).toBe(true);
  });

  it("deve retornar false para chave inexistente", async () => {
    const exists = await cache.exists("test:exists:false");
    expect(exists).toBe(false);
  });
});
