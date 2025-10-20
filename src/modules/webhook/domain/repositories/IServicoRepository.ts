import {
  IConfiguracaoNotificacao as IConfiguracaoNotificacaoCedente,
  IConfiguracaoNotificacao as IConfiguracaoNotificacaoConta,
} from "@/modules/conta/interfaces/IConfiguracaoNotificacao";
import { IReenviarDTO } from "../../interfaces/http/dtos/ReenviarDTO";

export interface IServicoRepository {
  findAllConfiguracaoNotificacaoByCedente(
    cedenteId: number,
    servicoIds: number[],
    produto: IReenviarDTO["product"],
    situacao: IReenviarDTO["type"],
  ): Promise<
    {
      id: number;
      convenio: {
        id: number;
        conta: {
          id: number;
          configuracao_notificacao: IConfiguracaoNotificacaoConta | null;
          cedente: {
            id: number;
            configuracao_notificacao: IConfiguracaoNotificacaoCedente | null;
          };
        };
      };
    }[]
  >;
}
