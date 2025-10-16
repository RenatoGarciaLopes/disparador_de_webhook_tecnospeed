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
  declare id: number;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  declare data_criacao: Date;

  @ForeignKey(() => Convenio)
  @Column({ type: DataType.INTEGER })
  declare convenio_id: number;

  @Column({
    type: DataType.ENUM("BOLETO", "PAGAMENTO", "PIX"),
    allowNull: false,
  })
  declare produto: "BOLETO" | "PAGAMENTO" | "PIX";

  @Column({ type: DataType.STRING, allowNull: false })
  declare status: string;

  @Column({
    type: DataType.ENUM("disponivel", "cancelado", "pago"),
    allowNull: false,
  })
  declare situacao: "disponivel" | "cancelado" | "pago";

  @BelongsTo(() => Convenio)
  declare convenio: Convenio;
}
