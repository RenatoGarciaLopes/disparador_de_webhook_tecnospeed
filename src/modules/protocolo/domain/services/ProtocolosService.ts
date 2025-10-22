import { ErrorResponse } from "@/shared/errors/ErrorResponse";
import { CacheService } from "@/infra/cache/cache.service";
import { IProtocoloParamDTO } from "../../interfaces/http/dtos/ProtocoloParamDTO";
import { WebhookReprocessadoRepository } from "../../infrastructure/database/repositories/WebHookReprocessadoRespository";
import { IProtocolosDTO } from "../../interfaces/http/dtos/ProtocolosDto";

export class ProtocolosService {
  constructor(
    private readonly webhookReprocessadoRepository: WebhookReprocessadoRepository,
    private readonly cache: CacheService,
  ) {}

  async getProtocolos(cedenteId: number, data: IProtocolosDTO) {
    const cacheKey = `protocolos:${cedenteId}:${data.product}:${data.id?.sort().join(",")}:${data.type}:${data.kind}:${data.start_date.toISOString()}:${data.end_date.toISOString()}`;

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
    );

    await this.cache.setWithTTL(cacheKey, JSON.stringify(result), 60 * 60 * 24);

    return result;
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
