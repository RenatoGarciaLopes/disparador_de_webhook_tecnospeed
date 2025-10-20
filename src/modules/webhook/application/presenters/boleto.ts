export class BoletoPresenter {
  static toPayload(
    url: string,
    headers: Record<string, string>,
    metadata: {
      webhookReprocessadoId: string;
      situacao: string;
      cnpjCedente: string;
    },
  ) {
    return {
      kind: "invalid",
      method: "invalid",
      url: "invalid",
      headers: "invalid",
      body: {
        tipoWH: "invalid",
        dataHoraEnvio: "invalid",
        CpfCnpjCedente: "invalid",
        titulo: {
          situacao: "invalid",
          idintegracao: "invalid",
          TituloNossoNumero: "invalid",
          TituloMovimentos: "invalid",
        },
      },
    };
  }
}
