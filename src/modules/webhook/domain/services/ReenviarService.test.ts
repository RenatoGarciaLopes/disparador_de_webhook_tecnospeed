import { CacheService } from "@/infrastructure/cache/cache.service";
import { TecnospeedClient } from "@/infrastructure/tecnospeed/TecnospeedClient";
import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { ServicoRepository } from "../../infrastructure/repositories/ServicoRepository";
import { WebhookReprocessadoRepository } from "../../infrastructure/repositories/WebhookReprocessadoRepository";
import { ReenviarService } from "./ReenviarService";

jest.mock("@/infrastructure/cache/cache.service");
jest.mock("@/infrastructure/tecnospeed/TecnospeedClient");
jest.mock("../../infrastructure/repositories/ServicoRepository");
jest.mock("../../infrastructure/repositories/WebhookReprocessadoRepository");
jest.mock("uuid", () => ({
  v4: jest.fn(() => "test-uuid-123"),
}));

jest.mock("@/infrastructure/logger/logger", () => ({
  Logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn(),
  },
}));

import { Logger } from "@/infrastructure/logger/logger";

describe("[WEBHOOK] ReenviarService", () => {
  let service: ReenviarService;
  let mockCache: jest.Mocked<CacheService>;
  let mockServicoRepository: jest.Mocked<ServicoRepository>;
  let mockTecnospeedClient: jest.Mocked<TecnospeedClient>;
  let mockWebhookReprocessadoRepository: jest.Mocked<WebhookReprocessadoRepository>;

  beforeEach(() => {
    mockCache = {
      get: jest.fn(),
      setWithTTL: jest.fn(),
    } as any;

    mockServicoRepository = {
      findAllConfiguracaoNotificacaoByCedente: jest.fn(),
    } as any;

    mockTecnospeedClient = {
      reenviarWebhook: jest.fn(),
    } as any;

    mockWebhookReprocessadoRepository = {
      create: jest.fn(),
    } as any;

    service = new ReenviarService(
      mockCache,
      mockServicoRepository,
      mockTecnospeedClient,
      mockWebhookReprocessadoRepository,
    );

    jest.clearAllMocks();
  });

  describe("webhook()", () => {
    describe("Cache hit", () => {
      it("deve retornar dados do cache quando existir", async () => {
        const cachedData = {
          message: "Notificação reenviada com sucesso",
          protocolo: "CACHED123",
        };

        mockCache.get.mockResolvedValue(JSON.stringify(cachedData));

        const data = {
          product: "BOLETO" as const,
          id: [1, 2],
          kind: "webhook" as const,
          type: "pago" as const,
        };

        const cedente = { id: 1, cnpj: "12.345.678/0001-90" };

        const result = await service.webhook(data, cedente);

        expect(Logger.info).toHaveBeenCalledWith(
          "Webhook reenvio started: product=BOLETO, type=pago, kind=webhook, idsCount=2, cedenteId=1",
        );
        expect(result).toEqual(cachedData);
        expect(
          mockServicoRepository.findAllConfiguracaoNotificacaoByCedente,
        ).not.toHaveBeenCalled();
        expect(mockTecnospeedClient.reenviarWebhook).not.toHaveBeenCalled();
      });

      it("deve verificar cache com a chave correta", async () => {
        mockCache.get.mockResolvedValue(JSON.stringify({ protocolo: "TEST" }));

        const data = {
          product: "BOLETO" as const,
          id: [3, 1, 2],
          kind: "webhook" as const,
          type: "pago" as const,
        };

        const cedente = { id: 1, cnpj: "12.345.678/0001-90" };

        await service.webhook(data, cedente);

        expect(Logger.info).toHaveBeenCalledWith(
          "Webhook reenvio started: product=BOLETO, type=pago, kind=webhook, idsCount=3, cedenteId=1",
        );
        expect(mockCache.get).toHaveBeenCalledWith(
          "reenviar:BOLETO:1,2,3:pago",
        );
      });

      it("deve logar corretamente quando id é undefined", async () => {
        mockCache.get.mockResolvedValue(null);

        const data = {
          product: "PIX" as const,
          id: undefined as any,
          kind: "webhook" as const,
          type: "disponivel" as const,
        };

        const cedente = { id: 10, cnpj: "98.765.432/0001-10" };

        try {
          await service.webhook(data, cedente);
        } catch {
          // Esperado que lance erro ao tentar usar data.id.sort()
        }

        expect(Logger.info).toHaveBeenCalledWith(
          "Webhook reenvio started: product=PIX, type=disponivel, kind=webhook, idsCount=0, cedenteId=10",
        );
      });
    });

    describe("Casos de sucesso (cache miss)", () => {
      it("deve processar reenvio completo quando não há cache", async () => {
        mockCache.get.mockResolvedValue(null);

        const mockServicos = [
          {
            id: 1,
            convenio: {
              id: 10,
              conta: {
                id: 20,
                configuracao_notificacao: {
                  url: "http://test.com",
                  header: false,
                  header_campo: "",
                  header_valor: "",
                  headers_adicionais: [],
                },
                cedente: {
                  id: 1,
                  configuracao_notificacao: null,
                },
              },
            },
          },
        ];

        mockServicoRepository.findAllConfiguracaoNotificacaoByCedente.mockResolvedValue(
          mockServicos as any,
        );

        mockTecnospeedClient.reenviarWebhook.mockResolvedValue({
          protocolo: "PROTO123",
        });

        const data = {
          product: "BOLETO" as const,
          id: [1],
          kind: "webhook" as const,
          type: "pago" as const,
        };

        const cedente = { id: 1, cnpj: "12.345.678/0001-90" };

        const result = await service.webhook(data, cedente);

        expect(Logger.info).toHaveBeenCalledWith(
          "Webhook reenvio started: product=BOLETO, type=pago, kind=webhook, idsCount=1, cedenteId=1",
        );
        expect(result).toEqual({
          message: "Notificação reenviada com sucesso",
          protocolo: "PROTO123",
        });
      });

      it("deve buscar serviços no repositório", async () => {
        mockCache.get.mockResolvedValue(null);

        mockServicoRepository.findAllConfiguracaoNotificacaoByCedente.mockResolvedValue(
          [
            {
              id: 1,
              convenio: {
                id: 10,
                conta: {
                  id: 20,
                  configuracao_notificacao: {
                    url: "http://test.com",
                    header: false,
                    header_campo: "",
                    header_valor: "",
                    headers_adicionais: [],
                  },
                  cedente: { id: 1, configuracao_notificacao: null },
                },
              },
            },
          ] as any,
        );

        mockTecnospeedClient.reenviarWebhook.mockResolvedValue({
          protocolo: "TEST",
        });

        const data = {
          product: "BOLETO" as const,
          id: [1],
          kind: "webhook" as const,
          type: "pago" as const,
        };

        const cedente = { id: 5, cnpj: "12.345.678/0001-90" };

        await service.webhook(data, cedente);

        expect(
          mockServicoRepository.findAllConfiguracaoNotificacaoByCedente,
        ).toHaveBeenCalledWith(5, [1], "BOLETO", "pago");
      });

      it("deve enviar para Tecnospeed", async () => {
        mockCache.get.mockResolvedValue(null);

        mockServicoRepository.findAllConfiguracaoNotificacaoByCedente.mockResolvedValue(
          [
            {
              id: 1,
              convenio: {
                id: 10,
                conta: {
                  id: 20,
                  configuracao_notificacao: {
                    url: "http://test.com",
                    header: false,
                    header_campo: "",
                    header_valor: "",
                    headers_adicionais: [],
                  },
                  cedente: { id: 1, configuracao_notificacao: null },
                },
              },
            },
          ] as any,
        );

        mockTecnospeedClient.reenviarWebhook.mockResolvedValue({
          protocolo: "XYZ789",
        });

        const data = {
          product: "BOLETO" as const,
          id: [1],
          kind: "webhook" as const,
          type: "pago" as const,
        };

        const cedente = { id: 1, cnpj: "12.345.678/0001-90" };

        await service.webhook(data, cedente);

        // Verifica se foi chamado com array de notifications
        expect(mockTecnospeedClient.reenviarWebhook).toHaveBeenCalledWith(
          expect.objectContaining({
            notifications: expect.any(Array),
          }),
        );
      });

      it("deve salvar no WebhookReprocessadoRepository", async () => {
        mockCache.get.mockResolvedValue(null);

        mockServicoRepository.findAllConfiguracaoNotificacaoByCedente.mockResolvedValue(
          [
            {
              id: 5,
              convenio: {
                id: 10,
                conta: {
                  id: 20,
                  configuracao_notificacao: {
                    url: "http://test.com",
                    header: false,
                    header_campo: "",
                    header_valor: "",
                    headers_adicionais: [],
                  },
                  cedente: { id: 2, configuracao_notificacao: null },
                },
              },
            },
            {
              id: 10,
              convenio: {
                id: 11,
                conta: {
                  id: 21,
                  configuracao_notificacao: {
                    url: "http://test2.com",
                    header: false,
                    header_campo: "",
                    header_valor: "",
                    headers_adicionais: [],
                  },
                  cedente: { id: 2, configuracao_notificacao: null },
                },
              },
            },
          ] as any,
        );

        mockTecnospeedClient.reenviarWebhook.mockResolvedValue({
          protocolo: "SAVE123",
        });

        const data = {
          product: "PIX" as const,
          id: [5, 10],
          kind: "webhook" as const,
          type: "disponivel" as const,
        };

        const cedente = { id: 2, cnpj: "98.765.432/0001-10" };

        await service.webhook(data, cedente);

        expect(mockWebhookReprocessadoRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            id: "test-uuid-123",
            cedente_id: 2,
            kind: "webhook",
            type: "disponivel",
            product: "PIX",
            protocolo: "SAVE123",
          }),
        );
      });

      it("deve salvar resposta no cache com TTL de 1 dia", async () => {
        mockCache.get.mockResolvedValue(null);

        mockServicoRepository.findAllConfiguracaoNotificacaoByCedente.mockResolvedValue(
          [
            {
              id: 1,
              convenio: {
                id: 10,
                conta: {
                  id: 20,
                  configuracao_notificacao: {
                    url: "http://test.com",
                    header: false,
                    header_campo: "",
                    header_valor: "",
                    headers_adicionais: [],
                  },
                  cedente: { id: 1, configuracao_notificacao: null },
                },
              },
            },
          ] as any,
        );

        mockTecnospeedClient.reenviarWebhook.mockResolvedValue({
          protocolo: "CACHE123",
        });

        const data = {
          product: "BOLETO" as const,
          id: [1],
          kind: "webhook" as const,
          type: "pago" as const,
        };

        const cedente = { id: 1, cnpj: "12.345.678/0001-90" };

        await service.webhook(data, cedente);

        expect(mockCache.setWithTTL).toHaveBeenCalledWith(
          "reenviar:BOLETO:1:pago",
          JSON.stringify({
            message: "Notificação reenviada com sucesso",
            protocolo: "CACHE123",
          }),
          86400,
        );
      });
    });

    describe("Validação de serviços encontrados", () => {
      it("deve lançar InvalidFieldsError quando nem todos os serviços foram encontrados", async () => {
        mockCache.get.mockResolvedValue(null);

        mockServicoRepository.findAllConfiguracaoNotificacaoByCedente.mockResolvedValue(
          [
            {
              id: 1,
              convenio: {
                id: 10,
                conta: {
                  id: 20,
                  configuracao_notificacao: {
                    url: "http://test.com",
                    header: false,
                    header_campo: "",
                    header_valor: "",
                    headers_adicionais: [],
                  },
                  cedente: { id: 1, configuracao_notificacao: null },
                },
              },
            },
          ] as any,
        );

        const data = {
          product: "BOLETO" as const,
          id: [1, 2, 3],
          kind: "webhook" as const,
          type: "pago" as const,
        };

        const cedente = { id: 1, cnpj: "12.345.678/0001-90" };

        try {
          await service.webhook(data, cedente);
        } catch (error) {
          expect(error).toBeInstanceOf(InvalidFieldsError);
          expect(mockTecnospeedClient.reenviarWebhook).not.toHaveBeenCalled();
        }
      });

      it("InvalidFieldsError deve ter status 422", async () => {
        mockCache.get.mockResolvedValue(null);

        mockServicoRepository.findAllConfiguracaoNotificacaoByCedente.mockResolvedValue(
          [],
        );

        const data = {
          product: "BOLETO" as const,
          id: [1],
          kind: "webhook" as const,
          type: "pago" as const,
        };

        const cedente = { id: 1, cnpj: "12.345.678/0001-90" };

        try {
          await service.webhook(data, cedente);
        } catch (error) {
          expect(error).toBeInstanceOf(InvalidFieldsError);
          const invalidFieldsError = error as InvalidFieldsError;
          expect(invalidFieldsError.status).toBe(422);
        }
      });

      it("deve identificar quais serviços não foram encontrados", async () => {
        mockCache.get.mockResolvedValue(null);

        mockServicoRepository.findAllConfiguracaoNotificacaoByCedente.mockResolvedValue(
          [
            {
              id: 1,
              convenio: {
                id: 10,
                conta: {
                  id: 20,
                  configuracao_notificacao: null,
                  cedente: { id: 1, configuracao_notificacao: null },
                },
              },
            },
          ],
        );

        const data = {
          product: "BOLETO" as const,
          id: [1, 2, 5],
          kind: "webhook" as const,
          type: "pago" as const,
        };

        const cedente = { id: 1, cnpj: "12.345.678/0001-90" };

        try {
          await service.webhook(data, cedente);
        } catch (error) {
          const invalidFieldsError = error as InvalidFieldsError;
          expect(invalidFieldsError.error.properties?.id.errors).toHaveLength(
            2,
          );
        }
      });
    });

    describe("Integração com Use Cases", () => {
      it("deve processar configuracoes dos servicos corretamente", async () => {
        mockCache.get.mockResolvedValue(null);

        const mockServicos = [
          {
            id: 1,
            convenio: {
              id: 10,
              conta: {
                id: 20,
                configuracao_notificacao: {
                  url: "http://test.com",
                  header: false,
                  header_campo: "",
                  header_valor: "",
                  headers_adicionais: [],
                },
                cedente: { id: 1, configuracao_notificacao: null },
              },
            },
          },
        ];

        mockServicoRepository.findAllConfiguracaoNotificacaoByCedente.mockResolvedValue(
          mockServicos as any,
        );

        mockTecnospeedClient.reenviarWebhook.mockResolvedValue({
          protocolo: "TEST",
        });

        const data = {
          product: "BOLETO" as const,
          id: [1],
          kind: "webhook" as const,
          type: "pago" as const,
        };

        const cedente = { id: 1, cnpj: "12.345.678/0001-90" };

        const result = await service.webhook(data, cedente);

        // Verifica se o serviço processou corretamente
        expect(result).toEqual({
          message: "Notificação reenviada com sucesso",
          protocolo: "TEST",
        });
      });

      it("deve montar notificacoes e enviar para Tecnospeed", async () => {
        mockCache.get.mockResolvedValue(null);

        mockServicoRepository.findAllConfiguracaoNotificacaoByCedente.mockResolvedValue(
          [
            {
              id: 1,
              convenio: {
                id: 10,
                conta: {
                  id: 20,
                  configuracao_notificacao: {
                    url: "http://test.com",
                    header: false,
                    header_campo: "",
                    header_valor: "",
                    headers_adicionais: [],
                  },
                  cedente: { id: 1, configuracao_notificacao: null },
                },
              },
            },
          ] as any,
        );

        mockTecnospeedClient.reenviarWebhook.mockResolvedValue({
          protocolo: "TEST",
        });

        const data = {
          product: "BOLETO" as const,
          id: [1],
          kind: "webhook" as const,
          type: "pago" as const,
        };

        const cedente = { id: 1, cnpj: "11.111.111/0001-11" };

        const result = await service.webhook(data, cedente);

        // Verifica se enviou para Tecnospeed com notificações
        expect(mockTecnospeedClient.reenviarWebhook).toHaveBeenCalledWith(
          expect.objectContaining({
            notifications: expect.any(Array),
          }),
        );
        expect(result.protocolo).toBe("TEST");
      });
    });

    describe("Fluxo completo", () => {
      it("deve executar todo o fluxo de reenvio com sucesso", async () => {
        mockCache.get.mockResolvedValue(null);

        const mockServicos = [
          {
            id: 1,
            convenio: {
              id: 10,
              conta: {
                id: 20,
                configuracao_notificacao: {
                  url: "http://test.com",
                  header: false,
                  header_campo: "",
                  header_valor: "",
                  headers_adicionais: [],
                },
                cedente: { id: 1, configuracao_notificacao: null },
              },
            },
          },
        ];

        mockServicoRepository.findAllConfiguracaoNotificacaoByCedente.mockResolvedValue(
          mockServicos as any,
        );

        mockTecnospeedClient.reenviarWebhook.mockResolvedValue({
          protocolo: "FULL123",
        });

        const data = {
          product: "BOLETO" as const,
          id: [1],
          kind: "webhook" as const,
          type: "pago" as const,
        };

        const cedente = { id: 1, cnpj: "12.345.678/0001-90" };

        const result = await service.webhook(data, cedente);

        // Verifica se todas as etapas do fluxo foram executadas
        expect(mockCache.get).toHaveBeenCalled();
        expect(
          mockServicoRepository.findAllConfiguracaoNotificacaoByCedente,
        ).toHaveBeenCalled();
        expect(mockTecnospeedClient.reenviarWebhook).toHaveBeenCalled();
        expect(mockWebhookReprocessadoRepository.create).toHaveBeenCalled();
        expect(mockCache.setWithTTL).toHaveBeenCalled();
        expect(result.protocolo).toBe("FULL123");
      });
    });
  });
});
