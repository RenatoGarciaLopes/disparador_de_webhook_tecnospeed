import { slowDown, type SlowDownRequestHandler } from "express-slow-down";
import RedisStore from "rate-limit-redis";
import { CacheService } from "../cache/cache.service";

export class ThrottleService {
  private static instance: ThrottleService | null = null;
  public client: SlowDownRequestHandler;

  constructor(
    private readonly limit: number = 5,
    private readonly interval: number = 1 * 60 * 1000,
    private readonly delayMs: number = 100,
  ) {
    this.client = slowDown({
      windowMs: this.interval,
      delayAfter: this.limit,
      ipv6Subnet: 56,
      delayMs: (hits) => {
        console.log("hits", hits);
        return hits * this.delayMs;
      },
      store: new RedisStore({
        sendCommand: (...args) =>
          CacheService.getInstance().client.sendCommand(args),
        prefix: "throttle",
      }),
    });
  }

  public static getInstance() {
    if (!ThrottleService.instance) {
      ThrottleService.instance = new ThrottleService();
    }
    return ThrottleService.instance;
  }
}
