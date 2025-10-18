import { ErrorResponse } from "@/shared/errors/ErrorResponse";
import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { UnauthorizedError } from "@/shared/errors/Unauthorized";
import { validateAuthHeaders } from "../middlewares/protocolo/validate-auth-headers";
import { validateBody } from "../middlewares/protocolo/validate-body";
import { ProtocolosController } from "../controllers/ProtocolosController";
import { ProtocoloRoutes } from "./ProtocolosRoutes";

jest.mock("@/shared/middlewares/reenviar/validate-auth-headers");
jest.mock("@/shared/middlewares/reenviar/validate-body");

describe("ProtocoloRoutes unitário", () => {
  let controllerMock: ProtocolosController;
  let getMock: jest.Mock;

  beforeEach(() => {
    controllerMock = { protocolo: jest.fn() } as any;

    // Mock do router.get
    getMock = jest.fn();
    jest.spyOn(require("express"), "Router").mockImplementation(() => ({
      get: getMock,
    }));
  });

  it("deve configurar a rota GET e chamar middlewares", async () => {
    // Instancia a rota
    new ProtocoloRoutes(controllerMock);

    // Verifica se router.post foi chamado
    expect(getMock).toHaveBeenCalled();

    // Pega os middlewares passados na chamada
    const middlewares = getMock.mock.calls[0].slice(1); // slice(1) remove o path

    // Deve ter 2 middlewares: valida headers + controller
    expect(middlewares.length).toBe(2);

    const [middlewareFn, controllerFn] = middlewares;

    // Mock do req, res, next
    const req: any = { headers: {}, body: { campo: "valor" } };
    const res: any = {};
    const next = jest.fn();

    (validateAuthHeaders as unknown as jest.Mock).mockResolvedValue({
      cedente: { id: 123 },
    });
    (validateBody as jest.Mock).mockResolvedValue({ campo: "valor" });

    await middlewareFn(req, res, next);
    expect(validateAuthHeaders).toHaveBeenCalledWith(new Headers(req.headers));
    expect(validateBody).toHaveBeenCalledWith(req.body);

    expect(next).toHaveBeenCalled();

    await controllerFn(req, res);
    expect(controllerMock.getProtoloco).toHaveBeenCalledWith(req, res);
  });

  it("deve retornar 401 se os headers não forem válidos", async () => {
    new ProtocoloRoutes(controllerMock);

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
    new ProtocoloRoutes(controllerMock);

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
    new ProtocoloRoutes(controllerMock);

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
