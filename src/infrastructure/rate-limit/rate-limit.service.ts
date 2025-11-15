import { ErrorResponse } from "@/shared/errors/ErrorResponse";
import rateLimit, { RateLimitRequestHandler } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { CacheService } from "../cache/cache.service";

export class RateLimitService {
  private static instance: RateLimitService | null = null;
  public client: RateLimitRequestHandler;

  constructor(
    private readonly limit: number = 100,
    private readonly interval: number = 15 * 60 * 1000,
  ) {
    this.client = rateLimit({
      windowMs: this.interval,
      limit: this.limit,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      ipv6Subnet: 56,
      store: new RedisStore({
        sendCommand: (...args) =>
          CacheService.getInstance().client.sendCommand(args),
        prefix: "rate-limit",
      }),
      handler: (_, res) => {
        const error = new ErrorResponse("TOO_MANY_REQUESTS", 429, {
          errors: [
            "Você atingiu o limite de requisições. Tente novamente mais tarde.",
          ],
        });
        res.status(error.statusCode).json(error.json());
      },
    });
  }

  public static getInstance() {
    if (!RateLimitService.instance) {
      RateLimitService.instance = new RateLimitService();
    }
    return RateLimitService.instance;
  }
}
