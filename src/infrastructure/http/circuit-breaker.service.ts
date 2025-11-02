import { config } from "@/infrastructure/config";
import { Logger } from "@/infrastructure/logger/logger";
import { AxiosError } from "axios";
import CircuitBreaker from "opossum";

export function buildCircuitBreakerFor<Args extends any[], Result>(
  name: string,
  action: (abortSignal: AbortSignal, ...args: Args) => Promise<Result>,
) {
  const abortController = new AbortController();
  const breaker = new CircuitBreaker(
    async (...args: Args) => action(abortController.signal, ...args),
    {
      abortController,
      timeout: config.CB_TIMEOUT_MS,
      resetTimeout: config.CB_RESET_TIMEOUT_MS,
      errorThresholdPercentage: config.CB_ERROR_THRESHOLD_PERCENT,
      volumeThreshold: config.CB_VOLUME_THRESHOLD,
      errorFilter: (error: unknown) => {
        if (error instanceof AxiosError) {
          const status = error.response?.status ?? 0;
          if (status >= 400 && status < 500) return true;
        }
        return false;
      },
    },
  );

  breaker.on("open", () => {
    Logger.warn(`Circuit breaker [${name}] state changed: open`);
  });
  breaker.on("halfOpen", () => {
    Logger.info(`Circuit breaker [${name}] state changed: halfOpen`);
  });
  breaker.on("close", () => {
    Logger.info(`Circuit breaker [${name}] state changed: close`);
  });
  breaker.on("reject", () => {
    Logger.warn(`Circuit breaker [${name}] short-circuited request`);
  });
  breaker.on("timeout", () => {
    Logger.warn(`Circuit breaker [${name}] action timed out`);
  });
  breaker.on("failure", (err: unknown) => {
    Logger.error(
      `Circuit breaker [${name}] action failed: ${(err as any)?.message || String(err)}`,
    );
  });
  breaker.on("success", () => {
    Logger.info(`Circuit breaker [${name}] action succeeded`);
  });

  return breaker;
}
