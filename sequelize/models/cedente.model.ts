import { IConfiguracaoNotificacao } from "@/modules/cedente/interfaces/IConfiguracaoNotificacao";
import { Optional } from "sequelize";
import {
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from "sequelize-typescript";
import { Conta } from "./conta.model";
import { SoftwareHouse } from "./software-house.model";

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
  extends Optional<
    CedenteAtributes,
    "id" | "data_criacao" | "configuracao_notificacao"
  > {}

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
  declare public id: number;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  declare public data_criacao: Date;

  @Unique
  @Column({ type: DataType.STRING })
  declare public cnpj: string;

  @Column({ type: DataType.STRING })
  declare public token: string;

  @ForeignKey(() => SoftwareHouse)
  @Column({ type: DataType.INTEGER })
  declare public softwarehouse_id: number;

  @Column({ type: DataType.STRING })
  declare public status: string;

  @Column({ type: DataType.JSONB })
  declare public configuracao_notificacao: IConfiguracaoNotificacao | null;

  @HasMany(() => Conta)
  declare public contas: Conta[];

  @BelongsTo(() => SoftwareHouse)
  declare public softwarehouse: SoftwareHouse;
}
