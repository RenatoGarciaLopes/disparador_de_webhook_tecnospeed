import { CacheService } from "@/infrastructure/cache/cache.service";
import { IKindReenvio } from "@/shared/kind-reenvios";
import { TecnospeedClient } from "../../infrastructure/tecnospeed/TecnospeedClient";
import { ReenviarDTO } from "../../interfaces/http/dtos/ReenviarDTO";
import { IServicoRepository } from "../repositories/IServicoRepository";
import { IWebhookReprocessadoRepository } from "../repositories/IWebhookReprocessadoRepository";

type IReenviarService = Record<
  IKindReenvio,
  (data: ReenviarDTO, cedente: { id: number; cnpj: string }) => Promise<any>
>;

export class ReenviarService implements IReenviarService {
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
    // 1. TODO: Gerar a chave de cache baseada no produto, ids e tipo do dado recebido
    // 2. TODO: Verificar se já existe uma informação de cache para a chave gerada
    // 3. TODO: Se houver cache, retornar essa informação já desserializada
    // 4. TODO: Buscar todos os serviços com configurações de notificação vinculados ao cedente, produto e situação enviada
    // 5. TODO: Validar se todos os ids de serviços enviados existem na base, caso contrário lançar InvalidFieldsError detalhando o que não existe
    // 6. TODO: Gerar um uuid para identificar o processamento de reenvio do webhook
    // 7. TODO: Montar as configurações de notificação para cada serviço
    // 8. TODO: Instanciar o caso de uso responsável por montar os payloads das notificações
    // 9. TODO: Montar os payloads das notificações para cada configuração
    // 10. TODO: Reenviar o webhook para o cliente (usando o client TecnospeedClient) passando os payloads montados
    // 11. TODO: Registrar o reenvio efetuado no banco de dados para futuras consultas/controle
    // 12. TODO: Gerar mensagem de sucesso contendo o protocolo retornado
    // 13. TODO: Salvar a mensagem de sucesso no cache com TTL de 1 dia
    // 14. TODO: Retornar a mensagem de sucesso gerada
  }
}
