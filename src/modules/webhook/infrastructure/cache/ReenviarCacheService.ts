/**
 * Serviço de cache para o endpoint /reenviar
 *
 * DOCS linha 309-339:
 * - Cache deve usar chave no formato: product:ids:kind:type
 * - Validade de 1 hora
 * - Apenas requisições bem-sucedidas devem ser cacheadas
 */
export class ReenviarCacheService {
  private cache: Map<string, { data: any; expiresAt: number }>;

  constructor() {
    this.cache = new Map();
  }

  /**
   * Gera chave de cache no formato: product:ids:kind:type
   * Exemplo: boleto:1,2,3,4:webhook:disponível
   */
  generateKey(
    product: string,
    ids: number[],
    kind: string,
    type: string,
  ): string {
    const sortedIds = [...ids].sort((a, b) => a - b);
    return `${product}:${sortedIds.join(",")}:${kind}:${type}`;
  }

  /**
   * Armazena valor no cache com TTL de 1 hora
   */
  set(key: string, value: any): void {
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hora
    this.cache.set(key, { data: value, expiresAt });
  }

  /**
   * Recupera valor do cache se ainda válido
   * Retorna null se não encontrado ou expirado
   */
  get(key: string): any | null {
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Remove item do cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Retorna quantidade de itens no cache
   */
  size(): number {
    return this.cache.size;
  }
}
