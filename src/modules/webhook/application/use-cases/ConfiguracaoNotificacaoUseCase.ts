import { Logger } from "@/infrastructure/logger/logger";
import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { IServicoRepository } from "../../domain/repositories/IServicoRepository";

export type Servicos = Awaited<
  ReturnType<IServicoRepository["findAllConfiguracaoNotificacaoByCedente"]>
>;

export class ConfiguracaoNotificacaoUseCase {
  static execute(servicos: Servicos) {
    const configuracoes: any[] = [];
    const servicosSemConfiguracao: number[] = [];

    if (!servicos || servicos.length === 0) {
      Logger.info("No servicos provided");
      return [];
    }

    Logger.info(`Processing configuracoes for ${servicos.length} servicos`);

    for (const servico of servicos) {
      const conta = servico.convenio.conta;
      const cedente = conta.cedente;

      let configuracao = conta.configuracao_notificacao;
      let configSource = "conta";

      if (!configuracao) {
        configuracao = cedente.configuracao_notificacao;
        configSource = "cedente";
      }

      if (!configuracao) {
        servicosSemConfiguracao.push(servico.id);
        Logger.debug(`Servico ${servico.id} without configuracao`);
        continue;
      }

      Logger.debug(
        `Configuracao found for servico ${servico.id} (source: ${configSource})`,
      );

      configuracoes.push({
        cedenteId: cedente.id,
        servicoId: servico.id,
        contaId: conta.id,
        configuracaoNotificacao: configuracao,
      });
    }

    if (servicosSemConfiguracao.length > 0) {
      Logger.warn(
        `Servicos without configuracao found: ${servicosSemConfiguracao.length} servicos`,
      );

      const errorDetails = {
        properties: {
          id: {
            errors: servicosSemConfiguracao.map(
              (id) => `Serviço ${id} não possui configuração de notificação.`,
            ),
          },
        },
      };

      throw new InvalidFieldsError(errorDetails, "INVALID_FIELDS", 422);
    }

    Logger.info(
      `Configuracoes processed successfully: ${configuracoes.length} configuracoes from ${servicos.length} servicos`,
    );

    return configuracoes;
  }
}
