import { CacheService } from "@/infrastructure/cache/cache.service";
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

    const cachedResult = await this.cache.get(cacheKey);

    if (cachedResult) {
      return JSON.parse(cachedResult);
    }

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

    return paginatedResponse;
  }

  async getProtocoloById(cedenteId: number, data: IProtocoloParamDTO) {
    const cacheKey = `protocolo:${cedenteId}:${data.id}`;

    const cachedResult = await this.cache.get(cacheKey);

    if (cachedResult) {
      return JSON.parse(cachedResult);
    }

    const protocolo = await this.webhookReprocessadoRepository.findById(
      data.id,
      cedenteId,
    );

    if (!protocolo) {
      throw new ErrorResponse("NOT_FOUND.", 400, {
        errors: ["Protocolo não encontrado."],
      });
    }

    await this.cache.setWithTTL(
      cacheKey,
      JSON.stringify(protocolo),
      60 * 60 * 24,
    );

    return protocolo;
  }
}
