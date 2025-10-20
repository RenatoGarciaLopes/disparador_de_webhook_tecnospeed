export class PixPresenter {
  static toPayload(
    url: string,
    headers: Record<string, string>,
    metadata: {
      webhookReprocessadoId: string;
      situacao: string;
      cedenteId: number;
      contaId: number;
      servicoId: number;
    },
  ) {
    return {
      kind: "invalid",
      method: "POST",
      url: "invalid",
      headers: "invalid",
      body: {
        type: "invalid",
        companyId: "invalid",
        event: "invalid",
        transactionId: "invalid",
        tags: ["invalid", "pix", "invalid"],
        id: {
          pixId: "invalid",
        },
      },
    };
  }
}
