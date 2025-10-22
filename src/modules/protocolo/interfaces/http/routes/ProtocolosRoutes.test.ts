jest.mock("@/infrastructure/config", () => ({
  config: {
    PORT: "3000",
    DB_USERNAME: "test",
    DB_PASSWORD: "test",
    DB_DATABASE: "test",
    DB_HOST: "localhost",
    DB_PORT: "5432",
    REDIS_PASSWORD: "test",
    REDIS_PORT: "6379",
    REDIS_HOST: "localhost",
  },
}));

jest.mock("@/modules/protocolo/domain/services/ProtocolosService");
jest.mock(
  "@/modules/protocolo/infrastructure/database/repositories/WebHookReprocessadoRespository",
);
jest.mock("@/infrastructure/cache/cache.service");
jest.mock("../middlewares/protocolo/body.middleware");
jest.mock("@/shared/modules/auth/interfaces/http/middlewares/auth.middleware");

const getMock = jest.fn();
jest.mock("express", () => {
  const actualExpress = jest.requireActual("express");
  return {
    ...actualExpress,
    Router: jest.fn(() => {
      const router = actualExpress.Router();
      router.get = getMock;
      return router;
    }),
  };
});

import { ProtocolosRoutes } from "./ProtocolosRoutes";
import { AuthMiddleware } from "@/shared/modules/auth/interfaces/http/middlewares/auth.middleware";
import { BodyMiddleware } from "../middlewares/protocolo/body.middleware";
import { ProtocolosController } from "../controllers/ProtocolosController";
import { CacheService } from "@/infrastructure/cache/cache.service";

describe("[PROTOCOL] ProtocolosRoutes", () => {
  let protocolosRoutes: ProtocolosRoutes;

  const mockReqResNext = (body = {}, params = {}) => {
    const req: any = { body, params };
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();
    return { req, res, next };
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (CacheService.getInstance as jest.Mock).mockReturnValue({
      get: jest.fn(),
      set: jest.fn(),
    });

    protocolosRoutes = new ProtocolosRoutes();
  });

  describe("Configuração do router", () => {
    it("deve criar uma instância do router", () => {
      expect(protocolosRoutes.router).toBeDefined();
      expect(typeof protocolosRoutes.router).toBe("function");
    });

    it("deve configurar rotas GET com middlewares e controller", () => {
      expect(getMock).toHaveBeenCalledWith(
        "/protocolos",
        expect.any(Function),
        expect.any(Function),
        expect.any(Function),
      );
      expect(getMock).toHaveBeenCalledWith(
        "/protocolos/:id",
        expect.any(Function),
        expect.any(Function),
      );
    });
  });

  describe("Middleware e Controller", () => {
    it("deve executar AuthMiddleware e BodyMiddleware na rota /protocolos", async () => {
      const routeCall = getMock.mock.calls.find((c) => c[0] === "/protocolos")!;
      const [authMiddlewareFn, bodyMiddlewareFn, controllerFn] =
        routeCall.slice(1);

      const { req, res, next } = mockReqResNext({ campo: "valor" });

      (AuthMiddleware.validate as jest.Mock).mockImplementation(
        (_req, _res, n) => n(),
      );
      (BodyMiddleware.validate as jest.Mock).mockImplementation(
        (_req, _res, n) => n(),
      );

      const controllerSpy = jest
        .spyOn(ProtocolosController.prototype, "getProtocolos")
        .mockResolvedValue(res.json([{ id: 1 }]));

      await authMiddlewareFn(req, res, next);
      await bodyMiddlewareFn(req, res, next);
      await controllerFn(req, res);

      expect(AuthMiddleware.validate).toHaveBeenCalledWith(
        req,
        res,
        expect.any(Function),
      );
      expect(BodyMiddleware.validate).toHaveBeenCalledWith(
        req,
        res,
        expect.any(Function),
      );
      expect(controllerSpy).toHaveBeenCalledWith(req, res);
      expect(res.json).toHaveBeenCalledWith([{ id: 1 }]);
    });

    it("deve executar AuthMiddleware e controller na rota /protocolos/:id", async () => {
      const routeCall = getMock.mock.calls.find(
        (c) => c[0] === "/protocolos/:id",
      )!;
      const [authMiddlewareFn, controllerFn] = routeCall.slice(1);

      const { req, res, next } = mockReqResNext({}, { id: "1" });

      (AuthMiddleware.validate as jest.Mock).mockImplementation(
        (_req, _res, n) => n(),
      );

      const controllerSpy = jest
        .spyOn(ProtocolosController.prototype, "getProtolocoById")
        .mockResolvedValue(res.json({ id: 1 }));

      await authMiddlewareFn(req, res, next);
      await controllerFn(req, res);

      expect(AuthMiddleware.validate).toHaveBeenCalledWith(
        req,
        res,
        expect.any(Function),
      );
      expect(controllerSpy).toHaveBeenCalledWith(req, res);
      expect(res.json).toHaveBeenCalledWith({ id: 1 });
    });
  });

  describe("Dependências", () => {
    it("deve ter CacheService mockado", () => {
      expect(CacheService.getInstance).toBeDefined();
    });

    it("deve ter GetProtocolosService mockado", () => {
      expect(
        require("@/modules/protocolo/domain/services/ProtocolosService"),
      ).toBeDefined();
    });

    it("deve ter WebhookReprocessadoRepository mockado", () => {
      expect(
        require("@/modules/protocolo/infrastructure/database/repositories/WebHookReprocessadoRespository"),
      ).toBeDefined();
    });
  });
});
