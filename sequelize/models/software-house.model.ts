import { Optional } from "sequelize";
import {
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from "sequelize-typescript";

interface SoftwareHouseAttributes {
  id: number;
  data_criacao: Date;
  cnpj: string;
  token: string;
  status: string;
}

interface SoftwareHouseCreationAttributes
  extends Optional<SoftwareHouseAttributes, "id"> {}

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
  declare id: number;

  @CreatedAt
  data_criacao!: Date;

  @Unique
  @Column({ type: DataType.STRING })
  cnpj!: string;

  @Column({ type: DataType.STRING })
  token!: string;

  @Column({ type: DataType.STRING })
  status!: string;
}
