import { createClient, RedisClientType } from "redis";
import { config } from "../config";

export class CacheService {
  private static instance: CacheService | null = null;
  private client: RedisClientType;

  private constructor() {
    this.client = createClient({
      socket: {
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
      },
      password: config.REDIS_PASSWORD,
    });
    this.client.on("error", (err) => {
      console.error("[error] Cache connection error:", err);
    });
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  public async connect(): Promise<void> {
    try {
      if (!this.client.isOpen) {
        console.log("[debug] Connecting to Cache");
        await this.client.connect();
        console.log("[debug] Cache connected");
      }
    } catch (err) {
      console.error("[error] Cache connection error:", err);
      throw err;
    }
  }

  public async setWithTTL(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<void> {
    await this.client.set(key, value, { EX: ttlSeconds, NX: true });
  }

  public async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  public async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }
}
