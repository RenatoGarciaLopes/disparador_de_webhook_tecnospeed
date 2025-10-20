import { ErrorResponse } from "@/shared/errors/ErrorResponse";
import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { UnauthorizedError } from "@/shared/errors/Unauthorized";
import { validateAuthHeaders } from "../middlewares/protocolo/validate-auth-headers";
import { validateBody } from "../middlewares/protocolo/validate-body";
import { ProtocolosController } from "../controllers/ProtocolosController";
import { ProtocolosRoutes } from "./ProtocolosRoutes";

jest.mock("../middlewares/protocolo/validate-auth-headers");
jest.mock("../middlewares/protocolo/validate-body");

describe("ProtocoloRoutes unitário", () => {
  let controllerMock: ProtocolosController;
  let getMock: jest.Mock;

  beforeEach(() => {
    controllerMock = {
      getProtolocoById: jest.fn(),
    } as unknown as ProtocolosController;

    getMock = jest.fn();
    jest.spyOn(require("express"), "Router").mockImplementation(() => ({
      get: getMock,
    }));
  });

  it("deve configurar a rota GET /:id e chamar middlewares", async () => {
    new ProtocolosRoutes(controllerMock);

    expect(getMock).toHaveBeenCalled();

    const middlewares = getMock.mock.calls[1].slice(1);
    expect(middlewares.length).toBe(2);

    const [middlewareFn, controllerFn] = middlewares;

    const req: any = { headers: {} };
    const res: any = {};
    const next = jest.fn();

    (validateAuthHeaders as unknown as jest.Mock).mockResolvedValue({
      cedente: { id: 123 },
    });

    await middlewareFn(req, res, next);
    expect(validateAuthHeaders).toHaveBeenCalledWith(new Headers(req.headers));

    expect(next).toHaveBeenCalled();

    await controllerFn(req, res);
    expect(controllerMock.getProtolocoById).toHaveBeenCalledWith(req, res);
  });

  it("deve retornar 401 se os headers não forem válidos", async () => {
    new ProtocolosRoutes(controllerMock);

    const mockError = new UnauthorizedError("Headers inválidos");
    (validateAuthHeaders as jest.Mock).mockRejectedValue(mockError);

    const req: any = { headers: {}, body: { campo: "valor" } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    const middlewares = getMock.mock.calls[0].slice(1);
    const [middlewareFn] = middlewares;

    await middlewareFn(req, res, next);

    expect(next).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalled();
  });

  it("deve retornar 500 se ocorrer um erro interno", async () => {
    new ProtocolosRoutes(controllerMock);

    const mockError = new Error("Erro interno");
    (validateBody as jest.Mock).mockRejectedValue(mockError);
    (validateAuthHeaders as jest.Mock).mockResolvedValue({
      cedente: { id: 123 },
    });

    const req: any = { headers: {}, body: { campo: "valor" } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    const middlewares = getMock.mock.calls[0].slice(1);
    const [middlewareFn] = middlewares;

    await middlewareFn(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      new ErrorResponse("Erro interno do servidor", 500, {
        errors: ["Erro interno"],
      }),
    );
  });

  it("deve retornar 500 com mensagem padrão se o erro não tiver message", async () => {
    new ProtocolosRoutes(controllerMock);

    const mockError = { message: undefined } as any;
    (validateBody as jest.Mock).mockRejectedValue(mockError);
    (validateAuthHeaders as jest.Mock).mockResolvedValue({
      cedente: { id: 123 },
    });

    const req: any = { headers: {}, body: { campo: "valor" } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    const middlewares = getMock.mock.calls[0].slice(1);
    const [middlewareFn] = middlewares;

    await middlewareFn(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      new ErrorResponse("Erro interno do servidor", 500, {
        errors: ["Erro interno do servidor"],
      }),
    );
  });
});
