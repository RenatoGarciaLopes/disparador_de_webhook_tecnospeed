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
      return [];
    }

    for (const servico of servicos) {
      const conta = servico.convenio.conta;
      const cedente = conta.cedente;

      let configuracao = conta.configuracao_notificacao;

      if (!configuracao) {
        configuracao = cedente.configuracao_notificacao;
      }

      if (!configuracao) {
        servicosSemConfiguracao.push(servico.id);
        continue;
      }

      configuracoes.push({
        cedenteId: cedente.id,
        servicoId: servico.id,
        contaId: conta.id,
        configuracaoNotificacao: configuracao,
      });
    }

    if (servicosSemConfiguracao.length > 0) {
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

    return configuracoes;
  }
}
