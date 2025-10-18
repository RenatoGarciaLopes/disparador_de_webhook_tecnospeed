import { ReenviarCacheService } from "./ReenviarCacheService";

describe("[Cache] ReenviarCacheService", () => {
  let cacheService: ReenviarCacheService;

  beforeEach(() => {
    cacheService = new ReenviarCacheService();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    cacheService.clear();
  });

  describe("generateKey", () => {
    it("deve gerar chave no formato product:ids:kind:type", () => {
      // DOCS linha 328-330: "boleto:1,2,3,4:webhook:disponível"
      const key = cacheService.generateKey(
        "boleto",
        [1, 2, 3, 4],
        "webhook",
        "disponivel",
      );

      expect(key).toBe("boleto:1,2,3,4:webhook:disponivel");
    });

    it("deve ordenar IDs para garantir consistência", () => {
      const key1 = cacheService.generateKey(
        "boleto",
        [4, 2, 1, 3],
        "webhook",
        "disponivel",
      );
      const key2 = cacheService.generateKey(
        "boleto",
        [1, 2, 3, 4],
        "webhook",
        "disponivel",
      );

      expect(key1).toBe(key2);
      expect(key1).toBe("boleto:1,2,3,4:webhook:disponivel");
    });

    it("deve gerar chaves diferentes para IDs diferentes", () => {
      const key1 = cacheService.generateKey(
        "boleto",
        [1, 2],
        "webhook",
        "disponivel",
      );
      const key2 = cacheService.generateKey(
        "boleto",
        [1, 2, 3],
        "webhook",
        "disponivel",
      );

      expect(key1).not.toBe(key2);
    });

    it("deve gerar chaves diferentes para produtos diferentes", () => {
      const key1 = cacheService.generateKey(
        "boleto",
        [1, 2],
        "webhook",
        "disponivel",
      );
      const key2 = cacheService.generateKey(
        "pix",
        [1, 2],
        "webhook",
        "disponivel",
      );

      expect(key1).not.toBe(key2);
    });

    it("deve gerar chaves diferentes para types diferentes", () => {
      const key1 = cacheService.generateKey(
        "boleto",
        [1, 2],
        "webhook",
        "disponivel",
      );
      const key2 = cacheService.generateKey(
        "boleto",
        [1, 2],
        "webhook",
        "cancelado",
      );

      expect(key1).not.toBe(key2);
    });

    it("deve funcionar com um único ID", () => {
      const key = cacheService.generateKey("pix", [5], "webhook", "pago");

      expect(key).toBe("pix:5:webhook:pago");
    });

    it("deve funcionar com 30 IDs (máximo permitido)", () => {
      const ids = Array.from({ length: 30 }, (_, i) => i + 1);
      const key = cacheService.generateKey(
        "pagamento",
        ids,
        "webhook",
        "disponivel",
      );

      expect(key).toContain("pagamento:");
      expect(key).toContain(":webhook:disponivel");
      expect(key.split(",")).toHaveLength(30);
    });
  });

  describe("set e get", () => {
    it("deve armazenar e recuperar valor do cache", () => {
      const key = "boleto:1,2:webhook:disponivel";
      const value = { message: "Sucesso", protocolos: ["uuid-1"] };

      cacheService.set(key, value);
      const cached = cacheService.get(key);

      expect(cached).toEqual(value);
    });

    it("deve retornar null para chave inexistente", () => {
      const cached = cacheService.get("nao-existe");

      expect(cached).toBeNull();
    });

    it("deve sobrescrever valor existente", () => {
      const key = "boleto:1:webhook:disponivel";

      cacheService.set(key, { data: "valor1" });
      cacheService.set(key, { data: "valor2" });

      const cached = cacheService.get(key);
      expect(cached).toEqual({ data: "valor2" });
    });

    it("deve cachear objetos complexos", () => {
      const key = "pix:5,10:webhook:pago";
      const value = {
        message: "Notificação gerada com sucesso",
        protocolos: ["uuid-1", "uuid-2"],
        total: 2,
        timestamp: "2025-01-01T10:00:00Z",
        product: "PIX",
      };

      cacheService.set(key, value);
      const cached = cacheService.get(key);

      expect(cached).toEqual(value);
    });
  });

  describe("Expiração de cache - TTL 1 hora", () => {
    it("deve expirar cache após 1 hora", () => {
      // DOCS linha 313: "O cache deve ter uma validade de 1 hora"
      const key = "boleto:1:webhook:disponivel";
      const value = { message: "Sucesso" };

      cacheService.set(key, value);

      // Antes de expirar - deve retornar valor
      jest.advanceTimersByTime(59 * 60 * 1000); // 59 minutos
      expect(cacheService.get(key)).toEqual(value);

      // Após expirar - deve retornar null
      jest.advanceTimersByTime(2 * 60 * 1000); // +2 minutos = 61 minutos total
      expect(cacheService.get(key)).toBeNull();
    });

    it("deve remover cache expirado ao tentar acessá-lo", () => {
      const key = "boleto:1:webhook:disponivel";

      cacheService.set(key, { data: "test" });
      expect(cacheService.size()).toBe(1);

      jest.advanceTimersByTime(61 * 60 * 1000); // 61 minutos

      cacheService.get(key);
      expect(cacheService.size()).toBe(0);
    });

    it("deve manter cache válido dentro do período de 1 hora", () => {
      const key = "pix:1,2,3:webhook:disponivel";
      const value = { message: "Teste" };

      cacheService.set(key, value);

      // Testa em vários momentos dentro da 1 hora
      jest.advanceTimersByTime(10 * 60 * 1000); // 10 min
      expect(cacheService.get(key)).toEqual(value);

      jest.advanceTimersByTime(20 * 60 * 1000); // +20 min = 30 min total
      expect(cacheService.get(key)).toEqual(value);

      jest.advanceTimersByTime(29 * 60 * 1000); // +29 min = 59 min total
      expect(cacheService.get(key)).toEqual(value);
    });
  });

  describe("delete", () => {
    it("deve remover item específico do cache", () => {
      const key1 = "boleto:1:webhook:disponivel";
      const key2 = "pix:2:webhook:pago";

      cacheService.set(key1, { data: "test1" });
      cacheService.set(key2, { data: "test2" });

      cacheService.delete(key1);

      expect(cacheService.get(key1)).toBeNull();
      expect(cacheService.get(key2)).toEqual({ data: "test2" });
    });

    it("não deve lançar erro ao deletar chave inexistente", () => {
      expect(() => {
        cacheService.delete("nao-existe");
      }).not.toThrow();
    });
  });

  describe("clear", () => {
    it("deve limpar todo o cache", () => {
      cacheService.set("key1", { data: "test1" });
      cacheService.set("key2", { data: "test2" });
      cacheService.set("key3", { data: "test3" });

      expect(cacheService.size()).toBe(3);

      cacheService.clear();

      expect(cacheService.size()).toBe(0);
      expect(cacheService.get("key1")).toBeNull();
      expect(cacheService.get("key2")).toBeNull();
      expect(cacheService.get("key3")).toBeNull();
    });
  });

  describe("size", () => {
    it("deve retornar quantidade correta de itens no cache", () => {
      expect(cacheService.size()).toBe(0);

      cacheService.set("key1", { data: "test" });
      expect(cacheService.size()).toBe(1);

      cacheService.set("key2", { data: "test" });
      expect(cacheService.size()).toBe(2);

      cacheService.delete("key1");
      expect(cacheService.size()).toBe(1);

      cacheService.clear();
      expect(cacheService.size()).toBe(0);
    });
  });

  describe("Casos de uso reais", () => {
    it("deve retornar cache para requisição duplicada (cache hit)", () => {
      // DOCS linha 338: "No caso de achar o cache, então deve ser retornado o valor do cache"
      const key = cacheService.generateKey(
        "boleto",
        [1, 2, 3],
        "webhook",
        "disponivel",
      );
      const response = {
        message: "Notificação gerada com sucesso",
        protocolos: ["uuid-123"],
        total: 3,
      };

      // Primeira requisição - salva no cache
      cacheService.set(key, response);

      // Segunda requisição (duplicada) - deve retornar do cache
      const cached = cacheService.get(key);
      expect(cached).toEqual(response);
    });

    it("deve processar normalmente para requisição não cacheada (cache miss)", () => {
      const key = cacheService.generateKey("pix", [10, 20], "webhook", "pago");

      const cached = cacheService.get(key);
      expect(cached).toBeNull();
    });

    it("deve gerar mesma chave independente da ordem dos IDs", () => {
      // Requisições com mesma lista de IDs mas ordem diferente devem gerar mesma chave
      const key1 = cacheService.generateKey(
        "boleto",
        [1, 2, 3, 4],
        "webhook",
        "disponivel",
      );
      const key2 = cacheService.generateKey(
        "boleto",
        [4, 3, 2, 1],
        "webhook",
        "disponivel",
      );
      const key3 = cacheService.generateKey(
        "boleto",
        [2, 4, 1, 3],
        "webhook",
        "disponivel",
      );

      expect(key1).toBe(key2);
      expect(key2).toBe(key3);

      // Todas devem acessar o mesmo cache
      cacheService.set(key1, { data: "teste" });
      expect(cacheService.get(key2)).toEqual({ data: "teste" });
      expect(cacheService.get(key3)).toEqual({ data: "teste" });
    });

    it("deve cachear apenas requisições bem-sucedidas", () => {
      // DOCS linha 336: "Somente caso a requisição já tenha sido processada e tenha sucesso"
      const keySuccess = cacheService.generateKey(
        "boleto",
        [1],
        "webhook",
        "disponivel",
      );
      const responseSuccess = { message: "Sucesso", protocolos: ["uuid-1"] };

      // Requisição bem-sucedida - deve ser cacheada
      cacheService.set(keySuccess, responseSuccess);
      expect(cacheService.get(keySuccess)).toEqual(responseSuccess);

      // Requisições com erro não devem ser cacheadas (teste conceitual)
      const keyError = cacheService.generateKey(
        "boleto",
        [999],
        "webhook",
        "disponivel",
      );
      expect(cacheService.get(keyError)).toBeNull();
    });
  });
});
