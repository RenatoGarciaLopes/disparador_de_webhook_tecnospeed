import { Optional } from "sequelize";
import {
  BelongsTo,
  AutoIncrement,
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
  extends Optional<ConvenioAttributes, "id"> {}

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
  declare id: number;

  @Column({ type: DataType.STRING })
  numero_convenio!: string;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  data_criacao!: Date;

  @ForeignKey(() => Conta)
  @Column({ type: DataType.INTEGER })
  declare conta_id: number;

  @HasMany(() => Servico)
  declare servicos: Servico[];

  @BelongsTo(() => Conta)
  declare conta: Conta;
}
