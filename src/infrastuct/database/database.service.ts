import { sequelize } from "@sequelize";

export class DatabaseService {
  async connect() {
    await sequelize
      .authenticate()
      .then(() => {
        console.log("Conexão estabelecida com sucesso");
      })
      .catch((error) => {
        console.error("Erro ao conectar ao banco de dados:", error);
      });

    await sequelize
      .sync()
      .then(() => {
        console.log("Sincronização do banco de dados realizada com sucesso");
      })
      .catch((error) => {
        console.error("Erro ao sincronizar o banco de dados:", error);
      });
  }
}
