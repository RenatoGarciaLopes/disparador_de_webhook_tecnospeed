import { Optional } from "sequelize";
import {
  AutoIncrement,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";

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
export class SoftwareHouse extends Model<
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

  @ForeignKey(() => require("./conta.model").default)
  @Column({ type: DataType.INTEGER })
  declare conta_id: number;
}
