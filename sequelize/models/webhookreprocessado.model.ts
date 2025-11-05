import { Optional } from "sequelize";
import {
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { Cedente } from "./cedente.model";

interface WebhookReprocessadoAttributes {
  id: string;
  data: object;
  data_criacao: Date;
  cedente_id: number;
  kind: string;
  type: string;
  servico_id: string[];
  product: string;
  protocolo: string;
}

export interface WebhookReprocessadoCreationAttributes
  extends Optional<WebhookReprocessadoAttributes, "id" | "data_criacao"> {}

@Table({
  tableName: "WebhookReprocessado",
  timestamps: false,
})
export class WebhookReprocessado extends Model<
  WebhookReprocessadoAttributes,
  WebhookReprocessadoCreationAttributes
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare public id: string;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
  })
  declare public data: object;

  @Default(DataType.NOW)
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare public data_criacao: Date;

  @ForeignKey(() => Cedente)
  @Column(DataType.INTEGER)
  declare public cedente_id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare public kind: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare public type: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    get() {
      const value = this.getDataValue("servico_id");
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    },
    set(value: string[] | string) {
      this.setDataValue("servico_id", JSON.stringify(value));
    },
  })
  declare public servico_id: string[];

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare public product: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare public protocolo: string;
}
