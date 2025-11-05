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
      kind: "webhook",
      method: "POST",
      url,
      headers,
      body: {
        tipoWH: "",
        dataHoraEnvio: new Date()
          .toLocaleString("pt-BR", {
            dateStyle: "short",
            timeStyle: "medium",
          })
          .replace(",", ""),
        CpfCnpjCedente: metadata.cnpjCedente,
        titulo: {
          situacao: metadata.situacao,
          idintegracao: metadata.webhookReprocessadoId,
          TituloNossoNumero: "",
          TituloMovimentos: {},
        },
      },
    };
  }
}
