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
} from "sequelize-typescript";

interface ContaAttributes {
  id: number;
  data_criacao: Date;
  produto: string;
  banco_codigo: string;
  cedente_id: number;
  status: string;
  configuracao_notificacao: IConfiguracaoNotificacao | null;
}

interface ContaCreationAttributes
  extends Optional<ContaAttributes, "id" | "configuracao_notificacao"> {}

@Table({
  tableName: "Conta",
  timestamps: false,
})
export class Conta extends Model<ContaAttributes, ContaCreationAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  declare id: number;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  data_criacao!: Date;

  @Column({ type: DataType.STRING })
  produto!: string;

  @Column({ type: DataType.STRING })
  banco_codigo!: string;

  @ForeignKey(() => require("./cedente.model").default)
  @Column({ type: DataType.INTEGER })
  cedente_id!: number;

  @Column({ type: DataType.STRING })
  status!: string;

  @Column({ type: DataType.JSONB })
  declare configuracao_notificacao: IConfiguracaoNotificacao | null;
}
