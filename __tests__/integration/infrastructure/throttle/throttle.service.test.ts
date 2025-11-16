import { CacheService } from "@/infrastructure/cache/cache.service";
import { ThrottleService } from "@/infrastructure/throttle/throttle.service";
import express, { Express } from "express";
import request from "supertest";

describe("[INFRA][INT] ThrottleService (com Redis real)", () => {
  let app: Express;

  beforeAll(async () => {
    await CacheService.getInstance().connect();
    await CacheService.getInstance().flushAll();

    app = express();
    app.use(express.json());

    // limit=1, window=1s, delayMs=50ms => 2ª requisição no intervalo sofre ~100ms de atraso (hits=2)
    const throttle = new ThrottleService(1, 1_000, 50).client;
    app.use("/th", throttle);

    app.get("/th", (_req, res) => res.status(200).json({ ok: true }));
  });

  afterAll(async () => {
    await CacheService.getInstance().flushAll();
    await CacheService.getInstance().quit();
  });

  it("deve responder sem atraso na 1ª requisição e atrasar a 2ª no mesmo intervalo", async () => {
    const t0 = Date.now();
    const r1 = await request(app).get("/th");
    const t1 = Date.now();
    expect(r1.status).toBe(200);
    const dur1 = t1 - t0;
    // Primeira deve ser rápida (sem atraso deliberado)
    expect(dur1).toBeLessThan(80);

    const t2 = Date.now();
    const r2 = await request(app).get("/th");
    const t3 = Date.now();
    expect(r2.status).toBe(200);
    const dur2 = t3 - t2;
    // Segunda deve sofrer atraso ~100ms; usa margem para variação do ambiente
    expect(dur2).toBeGreaterThanOrEqual(80);
  });

  it("deve resetar atraso após o fim da janela", async () => {
    await new Promise((r) => setTimeout(r, 1100));
    const t0 = Date.now();
    const r = await request(app).get("/th");
    const t1 = Date.now();
    expect(r.status).toBe(200);
    const dur = t1 - t0;
    expect(dur).toBeLessThan(80);
  });
});
