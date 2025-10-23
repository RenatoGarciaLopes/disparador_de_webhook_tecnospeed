import { CacheService } from "@/infrastructure/cache/cache.service";
import { IKindReenvio } from "@/shared/kind-reenvios";
import { TecnospeedClient } from "../../infrastructure/tecnospeed/TecnospeedClient";
import { ReenviarDTO } from "../../interfaces/http/dtos/ReenviarDTO";
import { IServicoRepository } from "../repositories/IServicoRepository";
import { IWebhookReprocessadoRepository } from "../repositories/IWebhookReprocessadoRepository";
import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { v4 as uuidv4 } from "uuid";
import { ConfiguracaoNotificacaoUseCase } from "../../application/use-cases/ConfiguracaoNotificacaoUseCase";
import { MontarNotificacaoUseCase } from "../../application/use-cases/MontarNotificacaoUseCase";

type IReenviarService = Record<
  IKindReenvio,
  (data: ReenviarDTO, cedente: { id: number; cnpj: string }) => Promise<any>
>;

export class ReenviarService implements IReenviarService {
  private readonly CACHE_TTL = 24 * 60 * 60; // 1 dia em segundos

  constructor(
    private readonly cache: CacheService,
    private readonly servicoRepository: IServicoRepository,
    private readonly TecnospeedClient: TecnospeedClient,
    private readonly webhookReprocessadoRepository: IWebhookReprocessadoRepository,
  ) {}

  public async webhook(
    data: ReenviarDTO,
    cedente: {
      id: number;
      cnpj: string;
    },
  ) {
    // 1. chave de cache
    const cacheKey = `reenviar:${data.product}:${data.id
      .sort()
      .join(",")}:${data.type}`;

    // 2/3. checar cache (uso 'any' para evitar erros de tipagem caso CacheService tenha nomes diferentes)
    const cached = await (this.cache as any).get?.(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // se desserializar falhar, prosseguir com o fluxo
      }
    }

    // 4. buscar serviços (assinatura espera argumentos separados)
    const servicos =
      await this.servicoRepository.findAllConfiguracaoNotificacaoByCedente(
        cedente.id,
        data.id,
        data.product,
        data.type,
      );

    // 5. validar ids enviados
    const existingIds = (servicos ?? []).map((s: any) => s.id);
    const invalidIds = data.id.filter(
      (id: number) => !existingIds.includes(id),
    );
    if (invalidIds.length > 0) {
      throw new InvalidFieldsError(
        {
          errors: [
            `Não foi possível gerar a notificação. A situação do ${data.product} diverge do tipo de notificação solicitado.`,
          ],
          properties: {
            id: {
              errors: invalidIds.map(
                (id) => `O serviço não foi encontrado: ${id}`,
              ),
            },
          },
        },
        "INVALID_FIELDS",
        422,
      );
    }

    // 6. gerar uuid de processamento
    const processamentoId = uuidv4();

    // 7. montar configurações de notificação (assumindo campos comuns em 'servico')
    const configuracoes = ConfiguracaoNotificacaoUseCase.execute(
      servicos,
    ) as any;
    // 8/9. montar payloads - presenter genérico com os
    const payloads = new MontarNotificacaoUseCase(
      processamentoId,
      {
        kind: data.kind,
        product: data.product,
        type: data.type,
      },
      configuracoes,
    ).execute({ cnpjCedente: cedente.cnpj }) as any;

    // 10. reenviar via TecnospeedClient — o client espera um objeto { notifications: [...] }
    const sendResult = await this.TecnospeedClient.reenviarWebhook({
      notifications: payloads,
    });

    // 11. registrar reenvios no repositório
    // espera-se que sendResult seja um array com { protocolo, servicoId, status? }

    await this.webhookReprocessadoRepository.create({
      id: processamentoId,
      cedente_id: cedente.id,
      kind: data.kind,
      type: data.type,
      protocolo: sendResult.protocolo,
      servico_id: data.id.map(String),
      product: data.product,
      data: {
        notifications: payloads,
      },
    });

    // 12. mensagem de sucesso
    const successMessage = {
      message: "Notificação reenviada com sucesso",
      protocolo: sendResult.protocolo,
    };

    // 13. salvar no cache (usa 'any' para compatibilidade com implementação concreta)
    await this.cache.setWithTTL(
      cacheKey,
      JSON.stringify(successMessage),
      this.CACHE_TTL,
    );

    // 14. retornar
    return successMessage;
  }
}
