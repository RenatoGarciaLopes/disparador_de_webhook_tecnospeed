import { Sequelize } from "sequelize";
const config = require("./config");

const configEnv = config[process.env.NODE_ENV || "development"];

export const sequelize = new Sequelize({
  ...configEnv,
  logging: false,
});
