import { IConfiguracaoNotificacao } from "@/modules/conta/interfaces/IConfiguracaoNotificacao";
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
} from "sequelize-typescript";
import { Cedente } from "./cedente.model";
import { Convenio } from "./convenio.model";

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
  extends Optional<
    ContaAttributes,
    "id" | "data_criacao" | "configuracao_notificacao"
  > {}

@Table({
  tableName: "Conta",
  timestamps: false,
})
export class Conta extends Model<ContaAttributes, ContaCreationAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  declare public id: number;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  declare public data_criacao: Date;

  @Column({ type: DataType.STRING })
  declare public produto: string;

  @Column({ type: DataType.STRING })
  declare public banco_codigo: string;

  @ForeignKey(() => Cedente)
  @Column({ type: DataType.INTEGER })
  declare public cedente_id: number;

  @Column({ type: DataType.STRING })
  declare public status: string;

  @Column({ type: DataType.JSONB })
  declare public configuracao_notificacao: IConfiguracaoNotificacao | null;

  @HasMany(() => Convenio)
  declare public convenios: Convenio[];

  @BelongsTo(() => Cedente)
  declare public cedente: Cedente;
}
