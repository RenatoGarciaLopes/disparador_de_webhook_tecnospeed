import { config } from "@/infrastructure/config";
import { ErrorResponse } from "@/shared/errors/ErrorResponse";
import axios, { AxiosError } from "axios";
import { BoletoPresenter } from "../../modules/webhook/application/presenters/boleto";
import { PagamentoPresenter } from "../../modules/webhook/application/presenters/pagamento";
import { PixPresenter } from "../../modules/webhook/application/presenters/pix";

export class TecnospeedClient {
  private baseUrl = config.TECNOSPEED_BASE_URL;

  public async reenviarWebhook(payload: {
    notifications: (BoletoPresenter | PagamentoPresenter | PixPresenter)[];
  }): Promise<{ protocolo: string }> {
    const response = await axios
      .post(`${this.baseUrl}/`, payload)
      .then((res) => res.data)
      .catch((err) => {
        if (err instanceof AxiosError) {
          if (err.response?.status === 400) {
            throw new ErrorResponse("INTERNAL_SERVER_ERROR", 500, {
              errors: [
                "Não foi possível gerar a notificação. Tente novamente mais tarde.",
                err.response?.data,
              ],
            });
          }
        }

        throw new ErrorResponse("INTERNAL_SERVER_ERROR", 500, {
          errors: ["Erro ao reenviar webhook"],
        });
      });

    return response;
  }
}
