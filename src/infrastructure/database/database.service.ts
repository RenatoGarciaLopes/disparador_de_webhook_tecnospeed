import { sequelize } from "@/sequelize";

export class DatabaseService {
  async connect(): Promise<boolean> {
    const cantAuthenticate = await sequelize
      .authenticate()
      .then(() => {
        console.log("[debug] Conexão estabelecida com sucesso");
        return false;
      })
      .catch((error) => {
        console.error("[error] Erro ao conectar ao banco de dados:", error);
        return true;
      });

    if (cantAuthenticate) return false;

    const cantSync = await sequelize
      .sync()
      .then(() => {
        console.log(
          "[debug] Sincronização do banco de dados realizada com sucesso",
        );
        return false;
      })
      .catch((error) => {
        console.error("[error] Erro ao sincronizar o banco de dados:", error);
        return true;
      });

    if (cantSync) return false;

    return true;
  }
}
