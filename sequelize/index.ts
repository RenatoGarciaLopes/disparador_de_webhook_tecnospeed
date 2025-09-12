import { Sequelize } from "sequelize-typescript";
const config = require("./config");

const configEnv = config[process.env.NODE_ENV || "development"];

export const sequelize = new Sequelize({
  ...configEnv,
  logging: false,
  models: [__dirname + "/models/**/*.model.ts"],
  modelMatch: (filename, member) => {
    // transform <model-name>.model.ts to <modelname> for match with model name in file (e.g. ModelName)
    return (
      filename.substring(0, filename.indexOf(".model")).replace("-", "") ===
      member.toLowerCase()
    );
  },
});
