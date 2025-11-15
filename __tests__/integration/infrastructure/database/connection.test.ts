import { DatabaseService } from "@/infrastructure/database/database.service";
import { sequelize } from "@/sequelize";
import { SoftwareHouse } from "@/sequelize/models/software-house.model";

describe("Database Connection - Success", () => {
  it("deve conectar ao PostgreSQL com sucesso", async () => {
    const dbService = new DatabaseService();
    const connected = await dbService.connect();

    expect(connected).toBe(true);
  });

  it("deve autenticar com credenciais corretas", async () => {
    await expect(sequelize.authenticate()).resolves.not.toThrow();
  });
});

describe("Database Connection - Sync Models", () => {
  it("deve sincronizar todos os modelos sem erros", async () => {
    await expect(sequelize.sync()).resolves.not.toThrow();
  });

  it("deve ter todas as tabelas criadas", async () => {
    const tables = await sequelize.getQueryInterface().showAllTables();

    expect(tables).toContain("SoftwareHouse");
    expect(tables).toContain("Cedente");
    expect(tables).toContain("Conta");
    expect(tables).toContain("Convenio");
    expect(tables).toContain("Servico");
    expect(tables).toContain("WebhookReprocessado");
  });
});

describe("Database Connection - Basic Operations", () => {
  it("deve executar query SELECT básica", async () => {
    const [results] = await sequelize.query("SELECT 1 as test");

    expect(results).toBeDefined();
    expect(results[0]).toHaveProperty("test");
  });

  it("deve conseguir criar um registro simples", async () => {
    const sh = await SoftwareHouse.create({
      cnpj: "12.345.678/0001-00",
      token: "test-token",
      status: "ativo",
    });

    expect(sh.id).toBeDefined();
    expect(sh.cnpj).toBe("12.345.678/0001-00");
  });

  it("deve conseguir buscar registro criado", async () => {
    await SoftwareHouse.create({
      cnpj: "12.345.678/0001-00",
      token: "test-token",
      status: "ativo",
    });

    const found = await SoftwareHouse.findOne({
      where: { cnpj: "12.345.678/0001-00" },
    });

    expect(found).toBeDefined();
    expect(found!.token).toBe("test-token");
  });
});
