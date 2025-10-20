import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import {
  ConfiguracaoNotificacaoUseCase,
  Servicos,
} from "./ConfiguracaoNotificacaoUseCase";

describe("[WEBHOOK] ConfiguracaoNotificacaoUseCase", () => {
  describe("execute()", () => {
    describe("Casos de sucesso", () => {
      it("deve retornar configurações quando conta tem configuracao_notificacao", () => {
        const servicos: Servicos = [
          {
            id: 1,
            convenio: {
              id: 10,
              conta: {
                id: 20,
                configuracao_notificacao: {
                  url: "http://webhook.com",
                  header: true,
                  header_campo: "Authorization",
                  header_valor: "Bearer token",
                  headers_adicionais: [],
                },
                cedente: {
                  id: 5,
                  configuracao_notificacao: null,
                },
              },
            },
          },
        ] as any;

        const result = ConfiguracaoNotificacaoUseCase.execute(servicos);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          cedenteId: 5,
          servicoId: 1,
          contaId: 20,
          configuracaoNotificacao:
            servicos[0].convenio.conta.configuracao_notificacao,
        });
      });

      it("deve usar configuracao_notificacao do cedente quando conta não tem", () => {
        const servicos: Servicos = [
          {
            id: 2,
            convenio: {
              id: 11,
              conta: {
                id: 21,
                configuracao_notificacao: null,
                cedente: {
                  id: 6,
                  configuracao_notificacao: {
                    url: "http://cedente-webhook.com",
                    header: false,
                    header_campo: "",
                    header_valor: "",
                    headers_adicionais: [],
                  },
                },
              },
            },
          },
        ] as any;

        const result = ConfiguracaoNotificacaoUseCase.execute(servicos);

        expect(result).toHaveLength(1);
        expect(result[0].configuracaoNotificacao).toEqual(
          servicos[0].convenio.conta.cedente.configuracao_notificacao,
        );
      });

      it("deve priorizar configuracao_notificacao da conta sobre cedente", () => {
        const servicos: Servicos = [
          {
            id: 3,
            convenio: {
              id: 12,
              conta: {
                id: 22,
                configuracao_notificacao: {
                  url: "http://conta-webhook.com",
                  header: false,
                  header_campo: "",
                  header_valor: "",
                  headers_adicionais: [],
                },
                cedente: {
                  id: 7,
                  configuracao_notificacao: {
                    url: "http://cedente-webhook.com",
                    header: false,
                    header_campo: "",
                    header_valor: "",
                    headers_adicionais: [],
                  },
                },
              },
            },
          },
        ] as any;

        const result = ConfiguracaoNotificacaoUseCase.execute(servicos);

        expect(result[0].configuracaoNotificacao.url).toBe(
          "http://conta-webhook.com",
        );
      });

      it("deve processar múltiplos serviços", () => {
        const servicos: Servicos = [
          {
            id: 1,
            convenio: {
              id: 10,
              conta: {
                id: 20,
                configuracao_notificacao: {
                  url: "http://webhook1.com",
                  header: false,
                  header_campo: "",
                  header_valor: "",
                  headers_adicionais: [],
                },
                cedente: {
                  id: 5,
                  configuracao_notificacao: null,
                },
              },
            },
          },
          {
            id: 2,
            convenio: {
              id: 11,
              conta: {
                id: 21,
                configuracao_notificacao: {
                  url: "http://webhook2.com",
                  header: false,
                  header_campo: "",
                  header_valor: "",
                  headers_adicionais: [],
                },
                cedente: {
                  id: 5,
                  configuracao_notificacao: null,
                },
              },
            },
          },
        ] as any;

        const result = ConfiguracaoNotificacaoUseCase.execute(servicos);

        expect(result).toHaveLength(2);
        expect(result[0].servicoId).toBe(1);
        expect(result[1].servicoId).toBe(2);
      });

      it("deve retornar array vazio quando não há serviços", () => {
        const servicos: Servicos = [];

        const result = ConfiguracaoNotificacaoUseCase.execute(servicos);

        expect(result).toEqual([]);
      });
    });

    describe("Validação de configuração", () => {
      it("deve lançar InvalidFieldsError quando serviço não tem configuração", () => {
        const servicos: Servicos = [
          {
            id: 1,
            convenio: {
              id: 10,
              conta: {
                id: 20,
                configuracao_notificacao: null,
                cedente: {
                  id: 5,
                  configuracao_notificacao: null,
                },
              },
            },
          },
        ];

        expect(() => ConfiguracaoNotificacaoUseCase.execute(servicos)).toThrow(
          InvalidFieldsError,
        );
      });

      it("InvalidFieldsError deve ter status 422", () => {
        const servicos: Servicos = [
          {
            id: 1,
            convenio: {
              id: 10,
              conta: {
                id: 20,
                configuracao_notificacao: null,
                cedente: {
                  id: 5,
                  configuracao_notificacao: null,
                },
              },
            },
          },
        ];

        try {
          ConfiguracaoNotificacaoUseCase.execute(servicos);
        } catch (error) {
          expect(error).toBeInstanceOf(InvalidFieldsError);
          const invalidFieldsError = error as InvalidFieldsError;
          expect(invalidFieldsError.status).toBe(422);
        }
      });

      it("deve identificar múltiplos serviços sem configuração", () => {
        const servicos: Servicos = [
          {
            id: 1,
            convenio: {
              id: 10,
              conta: {
                id: 20,
                configuracao_notificacao: null,
                cedente: {
                  id: 5,
                  configuracao_notificacao: null,
                },
              },
            },
          },
          {
            id: 2,
            convenio: {
              id: 11,
              conta: {
                id: 21,
                configuracao_notificacao: null,
                cedente: {
                  id: 5,
                  configuracao_notificacao: null,
                },
              },
            },
          },
        ];

        try {
          ConfiguracaoNotificacaoUseCase.execute(servicos);
        } catch (error) {
          const invalidFieldsError = error as InvalidFieldsError;
          expect(invalidFieldsError.error.properties?.id.errors).toHaveLength(
            2,
          );
        }
      });

      it("deve processar serviços com e sem configuração", () => {
        const servicos: Servicos = [
          {
            id: 1,
            convenio: {
              id: 10,
              conta: {
                id: 20,
                configuracao_notificacao: {
                  url: "http://webhook.com",
                  header: false,
                  header_campo: "",
                  header_valor: "",
                  headers_adicionais: [],
                },
                cedente: {
                  id: 5,
                  configuracao_notificacao: null,
                },
              },
            },
          },
          {
            id: 2,
            convenio: {
              id: 11,
              conta: {
                id: 21,
                configuracao_notificacao: null,
                cedente: {
                  id: 5,
                  configuracao_notificacao: null,
                },
              },
            },
          },
        ] as any;

        try {
          ConfiguracaoNotificacaoUseCase.execute(servicos);
        } catch (error) {
          const invalidFieldsError = error as InvalidFieldsError;
          expect(invalidFieldsError.error.properties?.id.errors).toHaveLength(
            1,
          );
          expect(
            invalidFieldsError.error.properties?.id?.errors?.[0],
          ).toContain("2");
        }
      });
    });

    describe("Método estático", () => {
      it("execute deve ser um método estático", () => {
        expect(typeof ConfiguracaoNotificacaoUseCase.execute).toBe("function");
      });
    });
  });
});
