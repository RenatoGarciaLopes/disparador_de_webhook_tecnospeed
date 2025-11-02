import { config } from "@/infrastructure/config";
import { AxiosError } from "axios";
import CircuitBreaker from "opossum";

type AsyncAction<Args extends any[], Result> = (
  ...args: Args
) => Promise<Result>;

export function buildCircuitBreakerFor<Args extends any[], Result>(
  name: string,
  action: AsyncAction<Args, Result>,
) {
  const breaker = new CircuitBreaker(action, {
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
  });

  breaker.on("open", () => {
    console.warn(`[cb] open - ${name}`);
  });
  breaker.on("halfOpen", () => {
    console.log(`[cb] halfOpen - ${name}`);
  });
  breaker.on("close", () => {
    console.log(`[cb] close - ${name}`);
  });
  breaker.on("reject", () => {
    console.warn(`[cb] reject - ${name}`);
  });
  breaker.on("timeout", () => {
    console.warn(`[cb] timeout - ${name}`);
  });
  breaker.on("failure", (err: unknown) => {
    console.error(`[cb] failure - ${name}`, err);
  });
  breaker.on("success", () => {
    console.log(`[cb] success - ${name}`);
  });

  return breaker;
}
