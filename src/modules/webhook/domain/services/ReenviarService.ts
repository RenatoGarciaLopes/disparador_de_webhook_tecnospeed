import { ValidarServicosUseCase } from "../../application/use-cases/reenviar/ValidarServicosUseCase";
import { ReenviarSchemaDTO } from "../../interfaces/http/validators/ReenviarSchema";

export class ReenviarService {
  constructor(
    private readonly validarServicosUseCase: ValidarServicosUseCase,
  ) {}

  async reenviar(cedenteId: number, data: ReenviarSchemaDTO) {
    // TODO: Implementar lógica completa
    // 1. Gerar UUID para webhook reprocessado
    // 2. Validar serviços
    // 3. Obter configuração de notificação
    // 4. Criar presenters baseado no produto
    // 5. Chamar toPayload em cada presenter
    // 6. Enviar array de payloads prontos para envio para a technospeed

    // RED: Implementação vazia para os testes falharem
    return [];
  }
}
