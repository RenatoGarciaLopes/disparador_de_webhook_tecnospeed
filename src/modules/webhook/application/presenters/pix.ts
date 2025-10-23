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
      kind: "webhook",
      method: "POST",
      url,
      headers,
      body: {
        type: "",
        companyId: metadata.cedenteId,
        event: metadata.situacao,
        transactionId: metadata.webhookReprocessadoId,
        tags: [metadata.contaId, "pix", new Date().getFullYear().toString()],
        id: {
          pixId: metadata.servicoId.toString(),
        },
      },
    };
  }
}
