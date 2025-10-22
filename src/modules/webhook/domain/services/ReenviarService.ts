import { CacheService } from "@/infrastructure/cache/cache.service";
import { IKindReenvio } from "@/shared/kind-reenvios";
import { TecnospeedClient } from "../../infrastructure/tecnospeed/TecnospeedClient";
import { ReenviarDTO } from "../../interfaces/http/dtos/ReenviarDTO";
import { IServicoRepository } from "../repositories/IServicoRepository";
import { IWebhookReprocessadoRepository } from "../repositories/IWebhookReprocessadoRepository";
import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { v4 as uuidv4 } from "uuid";

type IReenviarService = Record<
  IKindReenvio,
  (
    data: ReenviarDTO,
    cedenteId: number,
    softwareHouseId: number,
  ) => Promise<any>
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
    cedenteId: number,
    softwareHouseId: number,
  ) {
    // adaptações defensivas para nomes possíveis do DTO
    const produto = (data as any).produto ?? (data as any).product;
    const situacao = (data as any).situacao ?? (data as any).type;
    const servicoIds: number[] =
      (data as any).servicoIds ??
      (data as any).ids ??
      (data as any).servicos ??
      [];

    // 1. chave de cache
    const cacheKey = `reenvio:webhook:${cedenteId}:${produto}:${situacao}:${servicoIds
      .slice()
      .sort()
      .join(",")}`;

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
        cedenteId,
        servicoIds,
        produto,
        situacao,
      );

    // 5. validar ids enviados
    const existingIds = (servicos ?? []).map((s: any) => s.id);
    const invalidIds = servicoIds.filter(
      (id: number) => !existingIds.includes(id),
    );
    if (invalidIds.length > 0) {
      throw new InvalidFieldsError(
        {
          details: {
            code: "SERVICOS_NAO_ENCONTRADOS",
            details: { servicosInvalidos: invalidIds },
          },
        } as any, // ou defina a interface IFError com o formato adequado
        "SERVICOS_NAO_ENCONTRADOS", // code
        400, // status
      );
    }

    // 6. gerar uuid de processamento
    const processamentoId = uuidv4();

    // 7. montar configurações de notificação (assumindo campos comuns em 'servico')
    const configuracoes = (servicos as any[])
      .filter((s: any) => servicoIds.includes(s.id))
      .map((s: any) => ({
        servicoId: s.id,
        url: s.webhookUrl ?? s.webhook_url,
        headers: s.webhookHeaders ?? s.webhook_headers ?? {},
      }));

    // 8/9. montar payloads - presenter genérico com os campos mínimos esperados
    const payloads = configuracoes.map((c) => ({
      protocolo: processamentoId, // protocolo temporário; se a API externa retornar protocolo diferente, ajustar depois
      servicoId: c.servicoId,
      cedenteCnpj:
        (data as any).cedenteCnpj ?? (data as any).cedente?.cnpj ?? "",
      produto,
      situacao,
      original: data, // mantém o payload original para referência
    }));

    // 10. reenviar via TecnospeedClient — o client espera um objeto { notifications: [...] }
    const sendResult = await this.TecnospeedClient.reenviarWebhook({
      notifications: payloads,
    });

    // 11. registrar reenvios no repositório
    // espera-se que sendResult seja um array com { protocolo, servicoId, status? }
    const registros = (sendResult as unknown as any[]).map((r: any) => ({
      processamentoId,
      cedenteId,
      softwareHouseId,
      servicoId: r.servicoId ?? r.servicoIdSent ?? null,
      payload: data,
      protocolo: r.protocolo ?? r.protocol ?? processamentoId,
      status: r.status ?? "unknown",
      sentAt: new Date(),
    }));
    if (registros.length > 0) {
      await this.webhookReprocessadoRepository.create(registros);
    }

    // 12. mensagem de sucesso
    const successMessage = {
      processamentoId,
      resultados: sendResult,
      mensagem: "Webhooks reenviados com sucesso",
    };

    // 13. salvar no cache (usa 'any' para compatibilidade com implementação concreta)
    if (typeof (this.cache as any).set === "function") {
      await (this.cache as any).set(
        cacheKey,
        JSON.stringify(successMessage),
        this.CACHE_TTL,
      );
    } else if (typeof (this.cache as any).save === "function") {
      await (this.cache as any).save(
        cacheKey,
        JSON.stringify(successMessage),
        this.CACHE_TTL,
      );
    }

    // 14. retornar
    return successMessage;
  }
}
