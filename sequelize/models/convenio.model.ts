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
import { Conta } from "./conta.model";
import { Servico } from "./servico.model";

interface ConvenioAttributes {
  id: number;
  numero_convenio: string;
  data_criacao: Date;
  conta_id: number;
}

interface ConvenioCreationAttributes
  extends Optional<ConvenioAttributes, "id" | "data_criacao"> {}

@Table({
  tableName: "Convenio",
  timestamps: false,
})
export class Convenio extends Model<
  ConvenioAttributes,
  ConvenioCreationAttributes
> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  declare public id: number;

  @Column({ type: DataType.STRING })
  declare public numero_convenio: string;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  declare public data_criacao: Date;

  @ForeignKey(() => Conta)
  @Column({ type: DataType.INTEGER })
  declare public conta_id: number;

  @HasMany(() => Servico)
  declare public servicos: Servico[];

  @BelongsTo(() => Conta)
  declare public conta: Conta;
}
