import { ProtocolosService } from "./ProtocolosService";
import { WebhookReprocessadoRepository } from "../../infrastructure/database/repositories/WebHookReprocessadoRespository";
import { CacheService } from "@/infrastructure/cache/cache.service";
import { ErrorResponse } from "@/shared/errors/ErrorResponse";
import { WebhookReprocessado } from "@/sequelize/models/webhookreprocessado.model";
import { ProtocoloParamDTO } from "../../interfaces/http/dtos/ProtocoloParamDTO";
import { IProtocolosDTO } from "../../interfaces/http/dtos/ProtocolosDTO";

describe("[Service] ProtocolosService", () => {
  let repository: jest.Mocked<WebhookReprocessadoRepository>;
  let cache: jest.Mocked<CacheService>;
  let service: ProtocolosService;

  beforeEach(() => {
    repository = {
      findAll: jest.fn<Promise<WebhookReprocessado[]>, any>(),
      findById: jest.fn<Promise<WebhookReprocessado | null>, any>(), // <- permitir null
    } as unknown as jest.Mocked<WebhookReprocessadoRepository>;

    cache = {
      get: jest.fn(),
      setWithTTL: jest.fn(),
    } as unknown as jest.Mocked<CacheService>;

    service = new ProtocolosService(repository, cache);
  });

  it("deve retornar dados do repositório quando filtros válidos forem fornecidos", async () => {
    const dto: IProtocolosDTO = {
      start_date: new Date("2025-01-01"),
      end_date: new Date("2025-01-20"),
      product: "PIX",
      id: ["1", "2"],
      kind: "webhook",
      type: "disponivel",
    };

    const mockResult = [{ id: "1" }] as WebhookReprocessado[];

    cache.get.mockResolvedValue(null);
    repository.findAll.mockResolvedValue(mockResult);

    const result = await service.getProtocolos(1, dto);

    expect(repository.findAll).toHaveBeenCalledWith(
      1,
      dto.start_date,
      dto.end_date,
      dto.product,
      dto.id,
      dto.kind,
      dto.type,
    );
    expect(cache.setWithTTL).toHaveBeenCalled();
    expect(result).toEqual(mockResult);
  });

  it("deve retornar resultado em cache se existir", async () => {
    const dto: IProtocolosDTO = {
      start_date: new Date("2025-01-01"),
      end_date: new Date("2025-01-20"),
      product: "PIX",
      id: ["1", "2"],
      kind: "webhook",
      type: "disponivel",
    };

    const cachedData = JSON.stringify([{ id: "cached" }]);
    cache.get.mockResolvedValue(cachedData);

    const result = await service.getProtocolos(1, dto);

    expect(repository.findAll).not.toHaveBeenCalled();
    expect(result).toEqual(JSON.parse(cachedData));
  });

  it("deve retornar protocolo individual se encontrado", async () => {
    const dto: ProtocoloParamDTO = { id: "uuid-123" };
    const mockResult = { id: "uuid-123" } as WebhookReprocessado;

    cache.get.mockResolvedValue(null);
    repository.findById.mockResolvedValue(mockResult);

    const result = await service.getProtocoloById(1, dto);

    expect(repository.findById).toHaveBeenCalledWith(dto.id, 1);
    expect(cache.setWithTTL).toHaveBeenCalled();
    expect(result).toEqual(mockResult);
  });

  it("deve retornar protocolo do cache se existir", async () => {
    const dto: ProtocoloParamDTO = { id: "uuid-123" };
    const cached = JSON.stringify({ id: "uuid-123" });

    cache.get.mockResolvedValue(cached);

    const result = await service.getProtocoloById(1, dto);

    expect(repository.findById).not.toHaveBeenCalled();
    expect(result).toEqual(JSON.parse(cached));
  });

  it("deve lançar erro se protocolo não for encontrado", async () => {
    const dto: ProtocoloParamDTO = { id: "uuid-123" };

    cache.get.mockResolvedValue(null);
    repository.findById.mockResolvedValue(null as any);

    await expect(service.getProtocoloById(1, dto)).rejects.toBeInstanceOf(
      ErrorResponse,
    );
  });

  it("deve propagar erro do repositório", async () => {
    const dto: IProtocolosDTO = {
      start_date: new Date(),
      end_date: new Date(),
      product: "PIX",
      id: [] as string[],
      kind: "webhook",
      type: "disponivel",
    };

    const erroMock = new Error("Banco fora do ar");
    repository.findAll.mockRejectedValue(erroMock);

    await expect(service.getProtocolos(1, dto)).rejects.toThrow(erroMock);
  });

  it("deve gerar cache key igual independentemente da ordem dos IDs", async () => {
    const dto1: IProtocolosDTO = {
      start_date: new Date("2025-01-01"),
      end_date: new Date("2025-01-20"),
      product: "PIX",
      id: ["2", "1"],
      kind: "webhook",
      type: "disponivel",
    };

    const dto2: IProtocolosDTO = { ...dto1, id: ["1", "2"] };
    const mockResult: WebhookReprocessado[] = [{ id: "1" }] as any;

    repository.findAll.mockResolvedValue(mockResult);
    cache.get.mockResolvedValue(null);

    await service.getProtocolos(1, dto1);
    await service.getProtocolos(1, dto2);

    const firstCallKey = cache.setWithTTL.mock.calls[0][0];
    const secondCallKey = cache.setWithTTL.mock.calls[1][0];

    expect(firstCallKey).toEqual(secondCallKey);
  });

  it("deve funcionar mesmo sem product, kind ou type", async () => {
    const dto: IProtocolosDTO = {
      start_date: new Date("2025-01-01"),
      end_date: new Date("2025-01-20"),
      id: ["1"],
    };

    const mockResult: WebhookReprocessado[] = [{ id: "1" }] as any;
    repository.findAll.mockResolvedValue(mockResult);
    cache.get.mockResolvedValue(null);

    const result = await service.getProtocolos(1, dto);

    expect(repository.findAll).toHaveBeenCalledWith(
      1,
      dto.start_date,
      dto.end_date,
      undefined,
      dto.id,
      undefined,
      undefined,
    );
    expect(result).toEqual(mockResult);
  });

  it("deve passar TTL correto para cache", async () => {
    const dto: IProtocolosDTO = {
      start_date: new Date("2025-01-01"),
      end_date: new Date("2025-01-20"),
      id: ["1"],
    };

    const mockResult: WebhookReprocessado[] = [{ id: "1" }] as any;
    repository.findAll.mockResolvedValue(mockResult);
    cache.get.mockResolvedValue(null);

    await service.getProtocolos(1, dto);

    expect(cache.setWithTTL).toHaveBeenCalledWith(
      expect.any(String),
      JSON.stringify(mockResult),
      60 * 60 * 24,
    );
  });
});
