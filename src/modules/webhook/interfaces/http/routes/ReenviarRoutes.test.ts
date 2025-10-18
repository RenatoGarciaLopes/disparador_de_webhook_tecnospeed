import { validateAuthHeaders } from "@/modules/webhook/interfaces/http/middlewares/reenviar/validate-auth-headers";
import { validateBody } from "@/modules/webhook/interfaces/http/middlewares/reenviar/validate-body";
import { RouterImplementation } from "@/shared/RouterImplementation";
import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { UnauthorizedError } from "@/shared/errors/Unauthorized";
import { ReenviarController } from "../controllers/ReenviarController";
import { ReenviarRoutes } from "../routes/ReenviarRoutes";

jest.mock(
  "@/modules/webhook/interfaces/http/middlewares/reenviar/validate-auth-headers",
);
jest.mock(
  "@/modules/webhook/interfaces/http/middlewares/reenviar/validate-body",
);

describe("ReenviarRoutes", () => {
  let controllerMock: ReenviarController;
  let postMock: jest.Mock;

  beforeEach(() => {
    controllerMock = { reenviar: jest.fn() } as any;

    postMock = jest.fn();
    jest.spyOn(require("express"), "Router").mockImplementation(() => ({
      post: postMock,
    }));
  });

  describe("Configuração da rota", () => {
    it("deve ter PATH '/reenviar' e estender RouterImplementation", () => {
      expect(ReenviarRoutes.PATH).toBe("/reenviar");
      const routes = new ReenviarRoutes(controllerMock);
      expect(routes).toBeInstanceOf(RouterImplementation);
      expect(routes.router).toBeDefined();
    });

    it("deve configurar rota POST com middlewares corretos", () => {
      new ReenviarRoutes(controllerMock);

      expect(postMock).toHaveBeenCalled();
      const middlewares = postMock.mock.calls[0].slice(1);
      expect(middlewares.length).toBe(2);
    });
  });

  describe("Execução de middlewares", () => {
    it("deve executar validateAuthHeaders e validateBody na ordem correta", async () => {
      new ReenviarRoutes(controllerMock);

      const callOrder: string[] = [];
      (validateAuthHeaders as jest.Mock).mockImplementation(async () => {
        callOrder.push("headers");
        return { cedente: { id: 123 } };
      });
      (validateBody as jest.Mock).mockImplementation(async () => {
        callOrder.push("body");
        return { campo: "valor" };
      });

      const req: any = { headers: {}, body: { campo: "valor" } };
      const res: any = {};
      const next = jest.fn();

      const middlewares = postMock.mock.calls[0].slice(1);
      const [middlewareFn] = middlewares;

      await middlewareFn(req, res, next);

      expect(callOrder).toEqual(["headers", "body"]);
      expect(next).toHaveBeenCalled();
    });

    it("deve atribuir cedenteId ao request e chamar controller", async () => {
      new ReenviarRoutes(controllerMock);

      (validateAuthHeaders as jest.Mock).mockResolvedValue({
        cedente: { id: 789 },
      });
      (validateBody as jest.Mock).mockResolvedValue({ campo: "validado" });

      const req: any = { headers: {}, body: { campo: "original" } };
      const res: any = {};
      const next = jest.fn();

      const middlewares = postMock.mock.calls[0].slice(1);
      const [middlewareFn, controllerFn] = middlewares;

      await middlewareFn(req, res, next);

      expect(req.cedenteId).toBe(789);
      expect(req.body).toEqual({ campo: "validado" });
      expect(next).toHaveBeenCalled();

      await controllerFn(req, res);
      expect(controllerMock.reenviar).toHaveBeenCalledWith(req, res);
    });

    it("não deve chamar validateBody se validateAuthHeaders falhar", async () => {
      new ReenviarRoutes(controllerMock);

      (validateAuthHeaders as jest.Mock).mockRejectedValue(new Error());

      const req: any = { headers: {}, body: { campo: "valor" } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      const middlewares = postMock.mock.calls[0].slice(1);
      const [middlewareFn] = middlewares;

      await middlewareFn(req, res, next);

      expect(validateBody).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("Tratamento de erros", () => {
    it("deve retornar 401 quando validateAuthHeaders lançar UnauthorizedError", async () => {
      new ReenviarRoutes(controllerMock);

      const unauthorizedError = new UnauthorizedError(
        "Token inválido",
        "INVALID_TOKEN",
      );
      (validateAuthHeaders as jest.Mock).mockRejectedValue(unauthorizedError);

      const req: any = { headers: {}, body: { campo: "valor" } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      const middlewares = postMock.mock.calls[0].slice(1);
      const [middlewareFn] = middlewares;

      await middlewareFn(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        code: "INVALID_TOKEN",
        statusCode: 401,
        error: "Token inválido",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("deve retornar 400 quando validateBody lançar InvalidFieldsError", async () => {
      new ReenviarRoutes(controllerMock);

      const invalidFieldsError = new InvalidFieldsError(
        {
          errors: ["Campo obrigatório"],
          properties: { campo: { errors: ["Campo inválido"] } },
        },
        "INVALID_FIELDS",
      );

      (validateAuthHeaders as jest.Mock).mockResolvedValue({
        cedente: { id: 123 },
      });
      (validateBody as jest.Mock).mockRejectedValue(invalidFieldsError);

      const req: any = { headers: {}, body: { campo: "valor" } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      const middlewares = postMock.mock.calls[0].slice(1);
      const [middlewareFn] = middlewares;

      await middlewareFn(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        code: "INVALID_FIELDS",
        statusCode: 400,
        error: {
          errors: ["Campo obrigatório"],
          properties: { campo: { errors: ["Campo inválido"] } },
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("deve retornar 500 quando ocorrer erro genérico", async () => {
      new ReenviarRoutes(controllerMock);

      const genericError = new Error("Erro inesperado");
      (validateAuthHeaders as jest.Mock).mockRejectedValue(genericError);

      const req: any = { headers: {}, body: { campo: "valor" } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      const middlewares = postMock.mock.calls[0].slice(1);
      const [middlewareFn] = middlewares;

      await middlewareFn(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        code: "INTERNAL_SERVER_ERROR",
        statusCode: 500,
        error: {
          errors: ["Erro inesperado"],
        },
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
