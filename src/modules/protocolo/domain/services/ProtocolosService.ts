import { CacheService } from "@/infrastructure/cache/cache.service";
import { Logger } from "@/infrastructure/logger/logger";
import { ErrorResponse } from "@/shared/errors/ErrorResponse";
import { WebhookReprocessadoRepository } from "../../infrastructure/database/repositories/WebHookReprocessadoRespository";
import { IProtocoloParamDTO } from "../../interfaces/http/dtos/ProtocoloParamDTO";
import { IProtocolosDTO } from "../../interfaces/http/dtos/ProtocolosDTO";

export class ProtocolosService {
  constructor(
    private readonly webhookReprocessadoRepository: WebhookReprocessadoRepository,
    private readonly cache: CacheService,
  ) {}

  async getProtocolos(cedenteId: number, data: IProtocolosDTO) {
    const page = data.page ?? 1;
    const limit = data.limit ?? 10;
    const offset = (page - 1) * limit;

    const cacheKey = `protocolos:${cedenteId}:${data.product}:${data.id?.sort().join(",")}:${data.type}:${data.kind}:${data.start_date.toISOString()}:${data.end_date.toISOString()}:${page}:${limit}`;

    Logger.debug("Checking cache for protocolos");

    const cachedResult = await this.cache.get(cacheKey);

    if (cachedResult) {
      Logger.info(
        `Cache hit for protocolos: cedenteId=${cedenteId}, page=${page}`,
      );
      return JSON.parse(cachedResult);
    }

    Logger.debug(
      `Cache miss, querying database: cedenteId=${cedenteId}, page=${page}`,
    );

    const result = await this.webhookReprocessadoRepository.findAll(
      cedenteId,
      data.start_date,
      data.end_date,
      data.product,
      data.id,
      data.kind,
      data.type,
      limit,
      offset,
    );

    Logger.debug(
      `Protocolos retrieved from database: cedenteId=${cedenteId}, total=${result.total}`,
    );

    const totalPages = Math.ceil(result.total / limit);

    const paginatedResponse = {
      data: result.data,
      pagination: {
        page,
        limit,
        total: result.total,
        total_pages: totalPages,
      },
    };

    await this.cache.setWithTTL(
      cacheKey,
      JSON.stringify(paginatedResponse),
      60 * 60 * 24,
    );

    Logger.info(
      `Protocolos retrieved and cached: cedenteId=${cedenteId}, total=${result.total}, pages=${totalPages}`,
    );

    return paginatedResponse;
  }

  async getProtocoloById(cedenteId: number, data: IProtocoloParamDTO) {
    const cacheKey = `protocolo:${cedenteId}:${data.id}`;

    Logger.debug(`Checking cache for protocolo: id=${data.id}`);

    const cachedResult = await this.cache.get(cacheKey);

    if (cachedResult) {
      Logger.info(
        `Cache hit for protocolo: id=${data.id}, cedenteId=${cedenteId}`,
      );
      return JSON.parse(cachedResult);
    }

    Logger.debug(
      `Cache miss, querying database: id=${data.id}, cedenteId=${cedenteId}`,
    );

    const protocolo = await this.webhookReprocessadoRepository.findById(
      data.id,
      cedenteId,
    );

    if (!protocolo) {
      Logger.warn(`Protocolo not found: id=${data.id}, cedenteId=${cedenteId}`);
      throw new ErrorResponse("NOT_FOUND", 404, {
        errors: ["Protocolo não encontrado."],
      });
    }

    await this.cache.setWithTTL(
      cacheKey,
      JSON.stringify(protocolo),
      60 * 60 * 24,
    );

    Logger.info(
      `Protocolo retrieved and cached: id=${data.id}, product=${protocolo.product}`,
    );

    return protocolo;
  }
}
