export interface IConfiguracaoNotificacao {
  url: string;
  email: string | null;
  tipos: Record<string, any>;
  cancelado: boolean;
  pago: boolean;
  disponivel: boolean;
  header: boolean;
  ativado: boolean;
  header_campo: string;
  header_valor: string;
  headers_adicionais: Record<string, string>[];
}
