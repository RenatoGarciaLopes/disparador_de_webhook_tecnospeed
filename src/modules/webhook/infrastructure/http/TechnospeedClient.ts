import axios, { AxiosError, AxiosInstance } from "axios";

export interface TechnospeedPayload {
  kind: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body: Record<string, any>;
}

export interface TechnospeedResponse {
  protocolo: string;
}

export class TechnospeedClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = "TechnospeedClientError";
  }
}

/**
 * Client HTTP para enviar webhooks para a API da TechnoSpeed
 * API Mock: https://plug-retry.free.beeceptor.com
 * Documentação: DOCS_ENDPOINT_REENVIAR.md linhas 116-124, 266-270
 */
export class TechnospeedClient {
  private readonly client: AxiosInstance;
  private readonly baseURL: string;
  private readonly timeout: number;

  constructor(
    baseURL: string = "https://plug-retry.free.beeceptor.com",
    timeout: number = 5000,
  ) {
    this.baseURL = baseURL;
    this.timeout = timeout;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Envia webhook para a API da TechnoSpeed
   * @param payload - Payload formatado para envio
   * @returns Protocolo UUID retornado pela API
   * @throws TechnospeedClientError em caso de falha
   */
  async sendWebhook(payload: TechnospeedPayload): Promise<string> {
    // TODO: Implementar lógica de envio baseada no DOCS_ENDPOINT_REENVIAR.md
    // DOCS linhas 116-124: API Mock e retorno de protocolo
    // DOCS linhas 266-270: Envio dos payloads e recebimento de UUID

    // 1. Fazer POST para API com payload
    //    - Usar: const response = await this.client.post("/", payload)
    //    - Endpoint: "/" (raiz da baseURL)
    //    - Testes: TechnospeedClient.test.ts linhas 72-82

    // 2. Capturar erros com try/catch
    //    - Envolver a chamada HTTP em try/catch
    //    - No catch: const error = this.handleError(err)
    //    - Lançar: throw error
    //    - Testes de erro: linhas 120-176 (400, 401, 500, timeout)
    //    - Testes de rede: linhas 250-274 (ECONNREFUSED, ENOTFOUND)

    // 3. Validar resposta no bloco try
    //    - Usar: if (!this.isValidResponse(response.data))
    //    - Se inválido: throw new TechnospeedClientError("Resposta inválida")
    //    - Testes: linhas 178-206 (sem protocolo, vazia, null)

    // 4. Retornar protocolo UUID
    //    - Retornar: response.data.protocolo
    //    - DOCS linha 118-124: API retorna { "protocolo": "123e4567-e89b-12d3-a456-426614174000" }
    //    - Testes: linhas 85-96, 286-315

    // RED: Implementação vazia para os testes falharem
    throw new Error("Not implemented");
  }

  /**
   * Valida se a resposta da API tem estrutura esperada
   * @param data - Dados retornados pela API
   * @returns true se válido
   */
  private isValidResponse(data: any): data is TechnospeedResponse {
    // TODO: Implementar validação da estrutura da resposta
    // DOCS linha 118-124: Resposta esperada { "protocolo": "UUID" }

    // 1. Verificar se data existe e não é null/undefined
    //    - if (!data) return false
    //    - Teste: linha 198-206 (resposta null)

    // 2. Verificar se campo "protocolo" está presente
    //    - if (!data.protocolo) return false
    //    - Teste: linha 178-186 (campo invalidField ao invés de protocolo)

    // 3. Verificar se protocolo é string não vazia
    //    - if (typeof data.protocolo !== 'string' || data.protocolo.length === 0) return false
    //    - Teste: linha 188-196 (objeto vazio {})

    // 4. Se todas validações passarem, retornar true
    //    - return true
    //    - Testes de sucesso: linhas 72-118, 286-315

    // RED: Retorna false para os testes falharem
    return false;
  }

  /**
   * Converte erro do axios em TechnospeedClientError
   * @param error - Erro original
   * @returns TechnospeedClientError formatado
   */
  private handleError(error: unknown): TechnospeedClientError {
    // TODO: Implementar tratamento completo de erros

    // 1. Tratar erros do Axios (AxiosError)
    //    - Verificar: if (error instanceof AxiosError)
    //    - Extrair statusCode: error.response?.status
    //    - Criar mensagem descritiva baseada no status
    //    - Testes HTTP errors: linhas 120-163 (400, 401, 500)
    //    - Testes de rede: linhas 165-176 (ECONNABORTED timeout)
    //    - Testes de conexão: linhas 250-274 (ECONNREFUSED, ENOTFOUND)

    // 2. Casos específicos do AxiosError:
    //    a) Erros HTTP com response (4xx, 5xx):
    //       - Mensagem: `HTTP ${status}: ${error.message}`
    //       - StatusCode: error.response.status
    //       - Testes: linhas 218-234 (statusCode deve ser 404)
    //
    //    b) Erros de timeout (ECONNABORTED):
    //       - Code: error.code === "ECONNABORTED"
    //       - Mensagem: "Request timeout"
    //       - Teste: linhas 165-176
    //
    //    c) Erros de conexão (ECONNREFUSED, ENOTFOUND):
    //       - Code: error.code === "ECONNREFUSED" ou "ENOTFOUND"
    //       - Mensagem: "Connection error"
    //       - Testes: linhas 250-274

    // 3. Preservar erro original
    //    - Passar error como terceiro parâmetro: originalError
    //    - Teste: linhas 237-248 (originalError deve estar definido)

    // 4. Tratar erros não-Axios (erros genéricos)
    //    - Se não for AxiosError, tratar como erro desconhecido
    //    - Mensagem: error.message se disponível, senão "Unknown error"
    //    - StatusCode: undefined
    //    - OriginalError: error as Error

    // RED: Implementação básica para os testes falharem
    // (Esta implementação básica já cobre parte dos casos, mas precisa melhorias)
    if (error instanceof AxiosError) {
      return new TechnospeedClientError(
        "HTTP error",
        error.response?.status,
        error,
      );
    }
    return new TechnospeedClientError(
      "Unknown error",
      undefined,
      error as Error,
    );
  }
}
