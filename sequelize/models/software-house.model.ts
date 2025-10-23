import { Optional } from "sequelize";
import {
  AutoIncrement,
  Column,
  DataType,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from "sequelize-typescript";
import { Cedente } from "./cedente.model";

interface SoftwareHouseAttributes {
  id: number;
  data_criacao: Date;
  cnpj: string;
  token: string;
  status: string;
}

interface SoftwareHouseCreationAttributes
  extends Optional<SoftwareHouseAttributes, "id" | "data_criacao"> {}

@Table({
  tableName: "SoftwareHouse",
  timestamps: false,
})
export class SoftwareHouse extends Model<
  SoftwareHouseAttributes,
  SoftwareHouseCreationAttributes
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

  @Column({ type: DataType.STRING })
  declare public status: string;

  @HasMany(() => Cedente)
  declare public cedente: Cedente[];
}
