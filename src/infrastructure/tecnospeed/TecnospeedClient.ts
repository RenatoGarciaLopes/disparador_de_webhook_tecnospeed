import { config } from "@/infrastructure/config";
import { buildCircuitBreakerFor } from "@/infrastructure/http/circuit-breaker.service";
import { Logger } from "@/infrastructure/logger/logger";
import { ErrorResponse } from "@/shared/errors/ErrorResponse";
import axios, { AxiosError } from "axios";
import { BoletoPresenter } from "../../modules/webhook/application/presenters/boleto";
import { PagamentoPresenter } from "../../modules/webhook/application/presenters/pagamento";
import { PixPresenter } from "../../modules/webhook/application/presenters/pix";

export class TecnospeedClient {
  private baseUrl = config.TECNOSPEED_BASE_URL;
  private readonly breaker = buildCircuitBreakerFor(
    "TecnospeedClient.reenviarWebhook",
    async (
      abortSignal: AbortSignal,
      payload: {
        notifications: (BoletoPresenter | PagamentoPresenter | PixPresenter)[];
      },
    ) => {
      Logger.info(
        `Sending notifications to Tecnospeed: ${payload.notifications?.length || 0} notifications`,
      );

      const response = await axios.post(`${this.baseUrl}/`, payload, {
        timeout: config.HTTP_TIMEOUT_MS,
        signal: abortSignal,
      });
      Logger.info(`Tecnospeed response received: status=${response.status}`);
      return response.data;
    },
  );

  public async reenviarWebhook(payload: {
    notifications: (BoletoPresenter | PagamentoPresenter | PixPresenter)[];
  }): Promise<{ protocolo: string }> {
    try {
      const response = await this.breaker.fire(payload);
      return response as { protocolo: string };
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        Logger.error(
          `Tecnospeed request failed: status=${err.response?.status}, code=${err.code}, message=${err.message}`,
        );

        if (err.response?.status === 400) {
          throw ErrorResponse.internalServerErrorFromError(
            new Error(
              "Não foi possível gerar a notificação. Tente novamente mais tarde.",
            ),
          );
        }
      }

      throw ErrorResponse.internalServerErrorFromError(
        new Error("Erro ao reenviar webhook"),
      );
    }
  }
}
