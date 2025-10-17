import { Servico } from "@/sequelize/models/servico.model";
import { ReenviarSchemaDTO } from "../../../interfaces/http/validators/ReenviarSchema";

export class ConfigurarNotificacaoUseCase {
  constructor() {}

  async execute(data: ReenviarSchemaDTO, servicos: Servico[]) {
    
  }
}
