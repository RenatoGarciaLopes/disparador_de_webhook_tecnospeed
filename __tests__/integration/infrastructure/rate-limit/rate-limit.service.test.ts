import { CacheService } from "@/infrastructure/cache/cache.service";
import { RateLimitService } from "@/infrastructure/rate-limit/rate-limit.service";
import express, { Express } from "express";
import request from "supertest";

describe("[INFRA][INT] RateLimitService (com Redis real)", () => {
  let app: Express;

  beforeAll(async () => {
    // Conecta no Redis real e limpa chaves para evitar interferência entre testes
    await CacheService.getInstance().connect();
    await CacheService.getInstance().flushAll();

    app = express();
    app.use(express.json());

    // Janela curta para teste e limite baixo
    const limiter = new RateLimitService(2, 1_000).client;
    app.use("/rl", limiter);

    app.get("/rl", (_req, res) => res.status(200).json({ ok: true }));
  });

  afterAll(async () => {
    await CacheService.getInstance().flushAll();
    await CacheService.getInstance().quit();
  });

  it("deve permitir até 2 requisições e bloquear a 3ª com 429", async () => {
    const r1 = await request(app).get("/rl");
    expect(r1.status).toBe(200);

    const r2 = await request(app).get("/rl");
    expect(r2.status).toBe(200);

    const r3 = await request(app).get("/rl");
    expect(r3.status).toBe(429);
  });

  it("deve resetar a janela após windowMs e voltar a permitir requisições", async () => {
    // Aguarda a janela expirar
    await new Promise((r) => setTimeout(r, 1100));

    const r = await request(app).get("/rl");
    expect(r.status).toBe(200);
  });
});
