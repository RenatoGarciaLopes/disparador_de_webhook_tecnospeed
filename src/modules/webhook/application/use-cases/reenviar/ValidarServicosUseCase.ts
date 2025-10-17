import { Servico } from "@/sequelize/models/servico.model";
import { ServicoRepository } from "../../../infrastructure/database/repositories/ServicoRepository";
import { ReenviarSchemaDTO } from "../../../interfaces/http/validators/ReenviarSchema";

export class ValidarServicosUseCase {
  constructor(private readonly servicoRepository: ServicoRepository) {}

  async execute(
    data: ReenviarSchemaDTO,
    cedenteId: number,
  ): Promise<Servico[]> {
    // TODO: Implementar lógica completa de validação
    // 1. Buscar todos os serviços pelos IDs via repository
    // 2. Validar se todos os IDs foram encontrados na tabela Servico
    //    - Se não, criar erro para IDs não encontrados
    // 3. Validar se o Cedente validado nas headers corresponde aos Serviços encontrados
    //    - Comparar cedenteId com servico.convenio.conta.cedente.dataValues.id
    //    - Se não, criar erro para IDs com Cedente divergente
    // 4. Validar se todos os Serviços estão ativos
    //    - Verificar servico.dataValues.status === "ativo"
    //    - Se não, criar erro para IDs inativos
    // 5. Validar se todos os IDs correspondem ao produto especificado
    //    - Comparar data.product com servico.dataValues.produto
    //    - Se não, criar erro para IDs com produto divergente
    // 6. Validar se todas as situações correspondem ao type especificado
    //    - Mapear data.type para situação esperada (DISPONIVEL -> disponivel, etc)
    //    - Comparar com servico.dataValues.situacao
    //    - Se não, criar erro para IDs com situação divergente
    // 7. Se houver erros, lançar InvalidFieldsError com todos os erros agrupados
    // 8. Retornar array de serviços validados

    // RED: Implementação vazia para os testes falharem
    // Apenas busca e retorna sem validar nada
    const servicos = await this.servicoRepository.findAllByIds(data.id);
    return servicos;
  }
}
