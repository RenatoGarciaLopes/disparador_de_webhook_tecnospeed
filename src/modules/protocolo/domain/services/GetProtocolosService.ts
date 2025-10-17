import { GetProtocolosUseCase } from "../../application/use-cases/protocolo/GetProtocolosUseCase";

export class GetProtocolosService {
  constructor(private readonly getProtocoloUseCase: GetProtocolosUseCase) {}

  async getProtocolos(cedenteId: number, data: GetProtocolosUseCase) {
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
