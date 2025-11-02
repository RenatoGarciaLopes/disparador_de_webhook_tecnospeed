import { Logger } from "@/infrastructure/logger/logger";
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
      Logger.error(`Redis connection error: ${err.message}`);
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
        Logger.info("Connecting to Redis cache");
        await this.client.connect();
        Logger.info("Redis cache connected successfully");
      } else {
        Logger.debug("Redis cache already connected");
      }
    } catch (err) {
      Logger.error(
        `Failed to connect to Redis cache: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err;
    }
  }

  public async setWithTTL(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<void> {
    try {
      await this.client.set(key, value, { EX: ttlSeconds, NX: true });
      Logger.debug(`Cache set with TTL: ${key.substring(0, 50)}...`);
    } catch (err) {
      Logger.error(
        `Failed to set cache value: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err;
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (err) {
      Logger.error(
        `Failed to check cache existence: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err;
    }
  }

  public async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (err) {
      Logger.error(
        `Failed to get cache value: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err;
    }
  }

  public async flushAll(): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      await this.client.flushAll();
      Logger.warn("Cache flushed (all keys removed)");
    } catch (err) {
      Logger.error(
        `Failed to flush cache: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err;
    }
  }

  public async quit(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.quit();
      Logger.info("Redis cache connection closed");
    }
  }
}
