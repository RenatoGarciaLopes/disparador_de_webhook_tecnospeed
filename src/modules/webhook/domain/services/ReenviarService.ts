import { CacheService } from "@/infrastructure/cache/cache.service";
import { Logger } from "@/infrastructure/logger/logger";
import { TecnospeedClient } from "@/infrastructure/tecnospeed/TecnospeedClient";
import { AlreadyProcessedError } from "@/shared/errors/AlreadyProcessed";
import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { IKindReenvio } from "@/shared/utils/kind-reenvios";
import { v4 as uuidv4 } from "uuid";
import { ConfiguracaoNotificacaoUseCase } from "../../application/use-cases/ConfiguracaoNotificacaoUseCase";
import { MontarNotificacaoUseCase } from "../../application/use-cases/MontarNotificacaoUseCase";
import { ReenviarDTO } from "../../interfaces/http/dtos/ReenviarDTO";
import { IServicoRepository } from "../repositories/IServicoRepository";
import { IWebhookReprocessadoRepository } from "../repositories/IWebhookReprocessadoRepository";

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
    Logger.info(
      `Webhook reenvio started: product=${data.product}, type=${data.type}, kind=${data.kind}, idsCount=${data.id?.length || 0}, cedenteId=${cedente.id}`,
    );

    const cacheKey = `reenviar:${data.product}:${data.id
      .sort()
      .join(",")}:${data.type}`;

    const cached = await this.cache.get(cacheKey);
    if (cached) {
      Logger.info("Cache hit");
      throw new AlreadyProcessedError();
    }

    Logger.debug("Cache miss");

    const servicos =
      await this.servicoRepository.findAllConfiguracaoNotificacaoByCedente(
        cedente.id,
        data.id,
        data.product,
        data.type,
      );

    Logger.debug(
      `Servicos retrieved from repository: ${servicos?.length || 0} servicos`,
    );

    const existingIds = servicos.map((s) => s.id);
    const invalidIds = data.id.filter(
      (id: number) => !existingIds.includes(id),
    );
    if (invalidIds.length > 0) {
      Logger.warn(`Invalid servicos found: ${invalidIds.length} invalid ids`);
      throw new InvalidFieldsError(
        {
          errors: [
            "Alguns serviços não foram encontrados ou estão inativos para este cedente. Verifique se o serviço está ativo, se o produto é o mesmo do solicitado e se a situação é a mesma da solicitada.",
          ],
          properties: {
            id: {
              errors: invalidIds.map(
                (id) =>
                  `O serviço ${id} não foi encontrado ou está inativo para este cedente.`,
              ),
            },
          },
        },
        "INVALID_FIELDS",
        422,
      );
    }

    const processamentoId = uuidv4();
    Logger.debug(`Generating processamento ID: ${processamentoId}`);

    const configuracoes = ConfiguracaoNotificacaoUseCase.execute(servicos);

    const payloads = new MontarNotificacaoUseCase(
      processamentoId,
      {
        kind: data.kind,
        product: data.product,
        type: data.type,
      },
      configuracoes,
    ).execute({ cnpjCedente: cedente.cnpj }) as any;

    const sendResult = await this.TecnospeedClient.reenviarWebhook({
      notifications: payloads,
    });

    Logger.info(
      `Tecnospeed response received: protocolo=${sendResult.protocolo}`,
    );

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

    Logger.debug(
      `WebhookReprocessado created in database: processamentoId=${processamentoId}, protocolo=${sendResult.protocolo}`,
    );

    const successMessage = {
      message: "Notificação reenviada com sucesso",
      protocolo: sendResult.protocolo,
    };

    await this.cache.setWithTTL(cacheKey, "1", this.CACHE_TTL);

    Logger.debug("Result cached");

    Logger.info(
      `Webhook reenvio completed successfully: protocolo=${sendResult.protocolo}`,
    );

    return successMessage;
  }
}
