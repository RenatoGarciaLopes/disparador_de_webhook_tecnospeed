export class PagamentoPresenter {
  static toPayload(
    url: string,
    headers: Record<string, string>,
    metadata: {
      situacao: string;
      webhookReprocessadoId: string;
      contaId: number;
    },
  ) {
    return {
      kind: "webhook",
      method: "POST",
      url,
      headers,
      body: {
        status: metadata.situacao,
        uniqueid: metadata.webhookReprocessadoId,
        createdAt: new Date().toISOString(),
        accountHash: metadata.contaId,
        ocurrences: [],
        occurrences: [],
      },
    };
  }
}
