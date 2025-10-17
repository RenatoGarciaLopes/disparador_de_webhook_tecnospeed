import { Servico } from "@/sequelize/models/servico.model";
import { ServicoRepository } from "../../../infrastructure/database/repositories/ServicoRepository";
import { ReenviarSchemaDTO } from "../../../interfaces/http/validators/ReenviarSchema";

export class ValidarServicosUseCase {
  constructor(private readonly servicoRepository: ServicoRepository) {}

  async execute(data: ReenviarSchemaDTO, cedenteId: number): Promise<Servico[]> {
    const servicos = await this.servicoRepository.findAllByIds(data.id);
    // servicos[0].convenio.conta.cedente.dataValues.configuracao_notificacao;
    return servicos;
  }
}
