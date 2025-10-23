import { Optional } from "sequelize";
import { Cedente } from "./cedente.model";
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
} from "sequelize-typescript"; // ajuste o caminho conforme o seu projeto

interface WebhookReprocessadoAttributes {
  id: string;
  data: object; // JSON completo da requisição
  data_criacao: Date;
  cedente_id: number;
  kind: string;
  protocolo: string;
  type: string;
  servico_id: string[]; // array de IDs (armazenado como JSON string)
}

interface WebhookReprocessadoCreationAttributes
  extends Optional<WebhookReprocessadoAttributes, "id" | "data_criacao"> {}

@Table({
  tableName: "WebhookReprocessado",
  timestamps: false,
})
export class WebhookReprocessado extends Model<
  WebhookReprocessadoAttributes,
  WebhookReprocessadoCreationAttributes
> {
  // 🔹 Chave primária UUID
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  // 🔹 Dados originais da requisição
  @Column({
    type: DataType.JSONB, // se estiver usando PostgreSQL; use JSON no MySQL
    allowNull: false,
  })
  declare data: object;

  // 🔹 Data e hora de criação
  @Default(DataType.NOW)
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare data_criacao: Date;

  // 🔹 Chave estrangeira para Cedente.id
  @ForeignKey(() => Cedente)
  @Column(DataType.INTEGER)
  declare cedente_id: number;

  // 🔹 Tipo de notificação (ex: "webhook")
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare kind: string;

  // 🔹 Situação da notificação (ex: "pago", "cancelado")
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare type: string;

  // 🔹 IDs dos serviços envolvidos — armazenados como JSON string
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
  declare servico_id: string[];

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare protocolo: string;
}
