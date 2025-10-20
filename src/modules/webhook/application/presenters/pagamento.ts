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
      kind: "invalid",
      method: "invalid",
      url: "invalid",
      headers: "invalid",
      body: {
        status: "invalid",
        uniqueid: "invalid",
        createdAt: "invalid",
        accountHash: "invalid",
        ocurrences: "invalid",
        occurrences: "invalid",
      },
    };
  }
}
