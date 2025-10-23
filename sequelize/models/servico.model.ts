import { Optional } from "sequelize";
import {
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { Convenio } from "./convenio.model";

interface ServicoAttributes {
  id: number;
  produto: "BOLETO" | "PAGAMENTO" | "PIX";
  data_criacao: Date;
  convenio_id: number;
  status: string;
  situacao: "disponivel" | "cancelado" | "pago";
}

interface ServicoCreationAttributes
  extends Optional<ServicoAttributes, "id" | "data_criacao"> {}

@Table({
  tableName: "Servico",
  timestamps: false,
})
export class Servico extends Model<
  ServicoAttributes,
  ServicoCreationAttributes
> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  declare public id: number;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  declare public data_criacao: Date;

  @ForeignKey(() => Convenio)
  @Column({ type: DataType.INTEGER })
  declare public convenio_id: number;

  @Column({
    type: DataType.ENUM("BOLETO", "PAGAMENTO", "PIX"),
    allowNull: false,
  })
  declare public produto: "BOLETO" | "PAGAMENTO" | "PIX";

  @Column({ type: DataType.STRING, allowNull: false })
  declare public status: string;

  @Column({
    type: DataType.ENUM("disponivel", "cancelado", "pago"),
    allowNull: false,
  })
  declare public situacao: "disponivel" | "cancelado" | "pago";

  @BelongsTo(() => Convenio)
  declare public convenio: Convenio;
}
