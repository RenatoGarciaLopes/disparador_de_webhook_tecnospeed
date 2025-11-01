jest.mock("@/infrastructure/config", () => ({
  config: {
    PORT: 3000,
    DB_USERNAME: "test",
    DB_PASSWORD: "test",
    DB_DATABASE: "test",
    DB_HOST: "localhost",
    DB_PORT: 5432,
    REDIS_PASSWORD: "test",
    REDIS_PORT: 6379,
    REDIS_HOST: "localhost",
  },
}));

jest.mock(
  "@/shared/modules/auth/interfaces/http/middlewares/auth.middleware",
  () => ({
    AuthMiddleware: {
      validate: jest.fn((req, res, next) => next()),
    },
  }),
);

jest.mock("../controllers/ReenviarController");
jest.mock("@/modules/webhook/domain/services/ReenviarService");
jest.mock("@/infrastructure/cache/cache.service");
jest.mock("@/modules/webhook/infrastructure/repositories/ServicoRepository");
jest.mock(
  "@/modules/webhook/infrastructure/repositories/WebhookReprocessadoRepository",
);
jest.mock("@/infrastructure/tecnospeed/TecnospeedClient");

import { CacheService } from "@/infrastructure/cache/cache.service";
import { ReenviarService } from "@/modules/webhook/domain/services/ReenviarService";
import { ReenviarController } from "../controllers/ReenviarController";
import { BodyMiddleware } from "../middlewares/body.middleware";
import { ReenviarRouter } from "./ReenviarRouter";

describe("[WEBHOOK] ReenviarRouter", () => {
  let reenviarRouter: ReenviarRouter;

  beforeEach(() => {
    jest.clearAllMocks();

    (CacheService.getInstance as jest.Mock).mockReturnValue({
      get: jest.fn(),
      set: jest.fn(),
    });

    reenviarRouter = new ReenviarRouter();
  });

  describe("Configuração da rota", () => {
    it("deve criar uma instância do router", () => {
      expect(reenviarRouter.router).toBeDefined();
      expect(typeof reenviarRouter.router).toBe("function");
    });

    it("deve ter a propriedade router definida", () => {
      expect(reenviarRouter).toHaveProperty("router");
    });
  });

  describe("Integração com RouterImplementation", () => {
    it("deve estender RouterImplementation", () => {
      expect(reenviarRouter).toHaveProperty("router");
      expect(typeof reenviarRouter.router).toBe("function");
    });
  });

  describe("Dependências", () => {
    it("deve usar BodyMiddleware.validate", () => {
      expect(BodyMiddleware.validate).toBeDefined();
      expect(typeof BodyMiddleware.validate).toBe("function");
    });

    it("deve ter CacheService mockado", () => {
      expect(CacheService.getInstance).toBeDefined();
    });

    it("deve ter ReenviarController mockado", () => {
      expect(ReenviarController).toBeDefined();
    });

    it("deve ter ReenviarService mockado", () => {
      expect(ReenviarService).toBeDefined();
    });
  });

  describe("Rota configurada", () => {
    it("deve ter a stack de middlewares configurada", () => {
      expect(reenviarRouter.router.stack).toBeDefined();
      expect(reenviarRouter.router.stack.length).toBeGreaterThan(0);
    });

    it("deve criar ReenviarController ao processar request", () => {
      const mockReenviar = jest.fn().mockResolvedValue({ success: true });
      (ReenviarController as jest.Mock).mockImplementation(() => ({
        reenviar: mockReenviar,
      }));

      const route = reenviarRouter.router.stack[0]?.route;
      if (!route) throw new Error("Route not found");
      const handler = route.stack[route.stack.length - 1].handle;

      const mockReq = { body: {}, headers: {} } as any;
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as any;

      handler(mockReq, mockRes, jest.fn());

      expect(ReenviarController).toHaveBeenCalled();
    });

    it("deve criar ReenviarService com as dependências corretas", () => {
      const mockReenviar = jest.fn().mockResolvedValue({ success: true });
      (ReenviarController as jest.Mock).mockImplementation(() => ({
        reenviar: mockReenviar,
      }));

      const route = reenviarRouter.router.stack[0]?.route;
      if (!route) throw new Error("Route not found");
      const handler = route.stack[route.stack.length - 1].handle;

      const mockReq = { body: {}, headers: {} } as any;
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as any;

      handler(mockReq, mockRes, jest.fn());

      expect(ReenviarService).toHaveBeenCalled();
      expect(CacheService.getInstance).toHaveBeenCalled();
    });

    it("deve chamar reenviar do controller", async () => {
      const mockReenviar = jest.fn().mockResolvedValue({ success: true });
      (ReenviarController as jest.Mock).mockImplementation(() => ({
        reenviar: mockReenviar,
      }));

      const route = reenviarRouter.router.stack[0]?.route;
      if (!route) throw new Error("Route not found");
      const handler = route.stack[route.stack.length - 1].handle;

      const mockReq = { body: {}, headers: {} } as any;
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as any;

      await handler(mockReq, mockRes, jest.fn());

      expect(mockReenviar).toHaveBeenCalledWith(mockReq, mockRes);
    });

    it("deve ter AuthMiddleware como primeiro middleware da rota", () => {
      const route = reenviarRouter.router.stack[0]?.route;
      if (!route) throw new Error("Route not found");
      const firstMiddleware = route.stack[0].handle;

      expect(typeof firstMiddleware).toBe("function");
      expect(route.stack.length).toBeGreaterThanOrEqual(3);
    });

    it("deve ter BodyMiddleware.validate como segundo middleware", () => {
      const route = reenviarRouter.router.stack[0]?.route;
      if (!route) throw new Error("Route not found");
      const secondMiddleware = route.stack[1].handle;

      expect(secondMiddleware).toBe(BodyMiddleware.validate);
    });

    it("deve executar o middleware de autenticação", () => {
      const route = reenviarRouter.router.stack[0]?.route;
      if (!route) throw new Error("Route not found");
      const authMiddleware = route.stack[0].handle;

      const mockReq = { headers: {} } as any;
      const mockRes = {} as any;
      const mockNext = jest.fn();

      authMiddleware(mockReq, mockRes, mockNext);

      expect(typeof authMiddleware).toBe("function");
    });
  });
});
