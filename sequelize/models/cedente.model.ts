import { IConfiguracaoNotificacao } from "@/modules/conta/interfaces/IConfiguracaoNotificacao";
import { Optional } from "sequelize";
import {
  AutoIncrement,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
  ForeignKey,
  Unique,
} from "sequelize-typescript";

interface CedenteAtributes {
  id: number;
  data_criacao: Date;
  cnpj: string;
  token: string;
  softwarehouse_id: number;
  status: string;
  configuracao_notificacao: IConfiguracaoNotificacao | null;
}

interface CedenteCreationAttributes
  extends Optional<CedenteAtributes, "id" | "configuracao_notificacao"> {}

@Table({
  tableName: "Cedente",
  timestamps: false,
})
export class Cedente extends Model<
  CedenteAtributes,
  CedenteCreationAttributes
> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  declare id: number;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  data_criacao!: Date;

  @Unique
  @Column({ type: DataType.STRING })
  cnpj!: string;

  @Column({ type: DataType.STRING })
  token!: string;

  @Column({ type: DataType.NUMBER })
  softwarehouse_id!: number;

  @Column({ type: DataType.STRING })
  status!: string;

  @Column({ type: DataType.JSONB })
  declare configuracao_notificacao: IConfiguracaoNotificacao | null;
}
