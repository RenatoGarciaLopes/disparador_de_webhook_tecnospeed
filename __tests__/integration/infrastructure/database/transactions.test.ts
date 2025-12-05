import { DatabaseService } from "@/infrastructure/database/database.service";
import { sequelize } from "@/sequelize";
import { Cedente } from "@/sequelize/models/cedente.model";
import { Conta } from "@/sequelize/models/conta.model";
import { Convenio } from "@/sequelize/models/convenio.model";
import { Servico } from "@/sequelize/models/servico.model";
import { SoftwareHouse } from "@/sequelize/models/software-house.model";
import { WebhookReprocessado } from "@/sequelize/models/webhookreprocessado.model";

describe("Database Transactions - Integration Tests", () => {
  let dbService: DatabaseService;

  beforeAll(async () => {
    dbService = new DatabaseService();
    await dbService.connect();
  });

  beforeEach(async () => {
    await WebhookReprocessado.destroy({ where: {}, force: true });
    await Servico.destroy({ where: {}, force: true });
    await Convenio.destroy({ where: {}, force: true });
    await Conta.destroy({ where: {}, force: true });
    await Cedente.destroy({ where: {}, force: true });
    await SoftwareHouse.destroy({ where: {}, force: true });
  });

  afterAll(async () => {
    await WebhookReprocessado.destroy({ where: {}, force: true });
    await Servico.destroy({ where: {}, force: true });
    await Convenio.destroy({ where: {}, force: true });
    await Conta.destroy({ where: {}, force: true });
    await Cedente.destroy({ where: {}, force: true });
    await SoftwareHouse.destroy({ where: {}, force: true });
  });

  describe("Transaction Rollback", () => {
    it("deve fazer rollback quando ocorre erro em transação", async () => {
      const transaction = await sequelize.transaction();

      try {
        const softwareHouse = await SoftwareHouse.create(
          {
            cnpj: "12345678000195",
            token: "test-sh-token",
            status: "ativo",
          },
          { transaction },
        );

        await Cedente.create(
          {
            cnpj: "98765432000123",
            token: "test-cedente-token",
            softwarehouse_id: softwareHouse.id,
            status: "ativo",
          },
          { transaction },
        );

        throw new Error("Erro simulado");
      } catch {
        await transaction.rollback();
      }

      const softwareHouseCount = await SoftwareHouse.count();
      const cedenteCount = await Cedente.count();

      expect(softwareHouseCount).toBe(0);
      expect(cedenteCount).toBe(0);
    });

    it("deve fazer rollback quando foreign key constraint falha", async () => {
      const transaction = await sequelize.transaction();

      try {
        await Cedente.create(
          {
            cnpj: "98765432000123",
            token: "test-cedente-token",
            softwarehouse_id: 99999,
            status: "ativo",
          },
          { transaction },
        );

        await transaction.commit();
      } catch {
        await transaction.rollback();
      }

      const cedenteCount = await Cedente.count();
      expect(cedenteCount).toBe(0);
    });
  });

  describe("Transaction Commit", () => {
    it("deve fazer commit quando transação é bem-sucedida", async () => {
      const transaction = await sequelize.transaction();

      try {
        const softwareHouse = await SoftwareHouse.create(
          {
            cnpj: "12345678000195",
            token: "test-sh-token",
            status: "ativo",
          },
          { transaction },
        );

        const cedente = await Cedente.create(
          {
            cnpj: "98765432000123",
            token: "test-cedente-token",
            softwarehouse_id: softwareHouse.id,
            status: "ativo",
          },
          { transaction },
        );

        const conta = await Conta.create(
          {
            cedente_id: cedente.id,
            produto: "BOLETO",
            banco_codigo: "001",
            status: "ativo",
          },
          { transaction },
        );

        const convenio = await Convenio.create(
          {
            numero_convenio: "convenio-test",
            conta_id: conta.id,
          },
          { transaction },
        );

        await Servico.create(
          {
            convenio_id: convenio.id,
            produto: "BOLETO",
            situacao: "disponivel",
            status: "ativo",
          },
          { transaction },
        );

        await transaction.commit();

        const softwareHouseCount = await SoftwareHouse.count();
        const cedenteCount = await Cedente.count();
        const contaCount = await Conta.count();
        const convenioCount = await Convenio.count();
        const servicoCount = await Servico.count();

        expect(softwareHouseCount).toBe(1);
        expect(cedenteCount).toBe(1);
        expect(contaCount).toBe(1);
        expect(convenioCount).toBe(1);
        expect(servicoCount).toBe(1);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    });
  });

  describe("Concurrent Transactions", () => {
    it("deve lidar com transações concorrentes", async () => {
      const transaction1 = await sequelize.transaction();
      const transaction2 = await sequelize.transaction();

      try {
        await SoftwareHouse.create(
          {
            cnpj: "11111111000111",
            token: "test-sh-token-1",
            status: "ativo",
          },
          { transaction: transaction1 },
        );

        await SoftwareHouse.create(
          {
            cnpj: "22222222000222",
            token: "test-sh-token-2",
            status: "ativo",
          },
          { transaction: transaction2 },
        );

        await transaction1.commit();
        await transaction2.commit();

        const softwareHouseCount = await SoftwareHouse.count();
        expect(softwareHouseCount).toBe(2);
      } catch (error) {
        await transaction1.rollback();
        await transaction2.rollback();
        throw error;
      }
    });

    it("deve lidar com deadlock", async () => {
      const transaction1 = await sequelize.transaction();
      const transaction2 = await sequelize.transaction();

      try {
        const softwareHouse1 = await SoftwareHouse.create(
          {
            cnpj: "11111111000111",
            token: "test-sh-token-1",
            status: "ativo",
          },
          { transaction: transaction1 },
        );

        const softwareHouse2 = await SoftwareHouse.create(
          {
            cnpj: "22222222000222",
            token: "test-sh-token-2",
            status: "ativo",
          },
          { transaction: transaction2 },
        );

        await Cedente.create(
          {
            cnpj: "33333333000333",
            token: "test-cedente-token-1",
            softwarehouse_id: softwareHouse1.id,
            status: "ativo",
          },
          { transaction: transaction1 },
        );

        await Cedente.create(
          {
            cnpj: "44444444000444",
            token: "test-cedente-token-2",
            softwarehouse_id: softwareHouse2.id,
            status: "ativo",
          },
          { transaction: transaction2 },
        );

        await transaction1.commit();
        await transaction2.commit();

        const softwareHouseCount = await SoftwareHouse.count();
        const cedenteCount = await Cedente.count();

        expect(softwareHouseCount).toBe(2);
        expect(cedenteCount).toBe(2);
      } catch (error) {
        await transaction1.rollback();
        await transaction2.rollback();
        throw error;
      }
    });
  });

  describe("Bulk Operations", () => {
    it("deve criar múltiplos registros em uma transação", async () => {
      const transaction = await sequelize.transaction();

      try {
        const softwareHouse = await SoftwareHouse.create(
          {
            cnpj: "12345678000195",
            token: "test-sh-token",
            status: "ativo",
          },
          { transaction },
        );

        await Cedente.bulkCreate(
          [
            {
              cnpj: "11111111000111",
              token: "test-cedente-token-1",
              softwarehouse_id: softwareHouse.id,
              status: "ativo",
            },
            {
              cnpj: "22222222000222",
              token: "test-cedente-token-2",
              softwarehouse_id: softwareHouse.id,
              status: "ativo",
            },
            {
              cnpj: "33333333000333",
              token: "test-cedente-token-3",
              softwarehouse_id: softwareHouse.id,
              status: "ativo",
            },
          ],
          { transaction },
        );

        await transaction.commit();

        const softwareHouseCount = await SoftwareHouse.count();
        const cedenteCount = await Cedente.count();

        expect(softwareHouseCount).toBe(1);
        expect(cedenteCount).toBe(3);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    });

    it("deve fazer rollback de bulk operations quando há erro", async () => {
      const transaction = await sequelize.transaction();

      try {
        const softwareHouse = await SoftwareHouse.create(
          {
            cnpj: "12345678000195",
            token: "test-sh-token",
            status: "ativo",
          },
          { transaction },
        );

        await Cedente.bulkCreate(
          [
            {
              cnpj: "11111111000111",
              token: "test-cedente-token-1",
              softwarehouse_id: softwareHouse.id,
              status: "ativo",
            },
            {
              cnpj: "22222222000222",
              token: "test-cedente-token-2",
              softwarehouse_id: 99999,
              status: "ativo",
            },
          ],
          { transaction },
        );

        await transaction.commit();
      } catch {
        await transaction.rollback();
      }

      const softwareHouseCount = await SoftwareHouse.count();
      const cedenteCount = await Cedente.count();

      expect(softwareHouseCount).toBe(0);
      expect(cedenteCount).toBe(0);
    });
  });

  describe("Database Constraints", () => {
    it("deve respeitar unique constraint em transação", async () => {
      const transaction = await sequelize.transaction();

      try {
        await SoftwareHouse.create(
          {
            cnpj: "12345678000195",
            token: "test-sh-token",
            status: "ativo",
          },
          { transaction },
        );

        await SoftwareHouse.create(
          {
            cnpj: "12345678000195",
            token: "test-sh-token-2",
            status: "ativo",
          },
          { transaction },
        );

        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        expect(error).toBeDefined();
      }

      const softwareHouseCount = await SoftwareHouse.count();
      expect(softwareHouseCount).toBe(0);
    });

    it("deve respeitar foreign key constraint em transação", async () => {
      const transaction = await sequelize.transaction();

      try {
        await Cedente.create(
          {
            cnpj: "98765432000123",
            token: "test-cedente-token",
            softwarehouse_id: 99999,
            status: "ativo",
          },
          { transaction },
        );

        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        expect(error).toBeDefined();
      }

      const cedenteCount = await Cedente.count();
      expect(cedenteCount).toBe(0);
    });
  });
});
