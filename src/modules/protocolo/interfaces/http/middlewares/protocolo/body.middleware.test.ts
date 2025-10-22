import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { BodyMiddleware } from "./body.middleware";

describe("[HTTP Middleware] /protocolo - BodyMiddleware.validate", () => {
  const fake = new InvalidFieldsError({ errors: ["teste"] }, "INVALID_FIELDS");
  const spy = jest
    .spyOn(InvalidFieldsError, "fromZodError")
    .mockReturnValue(fake);

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMocks = (query: any) => {
    const req: any = { query };
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();
    return { req, res, next };
  };

  describe("Erros manuais (pré-Zod)", () => {
    it("deve retornar 400 se nenhum campo for enviado", () => {
      const { req, res, next } = createMocks({});
      BodyMiddleware.validate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("deve retornar 400 se start_date > end_date", () => {
      const { req, res, next } = createMocks({
        start_date: "2021-01-10",
        end_date: "2021-01-01",
      });
      BodyMiddleware.validate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("deve retornar 400 se diferença entre start_date e end_date > 31 dias", () => {
      const { req, res, next } = createMocks({
        start_date: "2021-01-01",
        end_date: "2021-02-02",
      });
      BodyMiddleware.validate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("deve retornar 400 se id não for um array", () => {
      const { req, res, next } = createMocks({
        start_date: "2021-01-01",
        end_date: "2021-01-10",
        id: "1",
      });
      BodyMiddleware.validate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("deve retornar 400 se id contiver valores inválidos", () => {
      const { req, res, next } = createMocks({
        start_date: "2021-01-01",
        end_date: "2021-01-10",
        id: ["1", "2", "-3", "a"],
      });
      BodyMiddleware.validate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("deve retornar 400 se campos extras forem enviados", () => {
      const { req, res, next } = createMocks({
        start_date: "2021-01-01",
        end_date: "2021-01-10",
        extra: "not allowed",
      });
      BodyMiddleware.validate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("deve retornar 400 se start_date ou end_date forem inválidas", () => {
      const { req, res, next } = createMocks({
        start_date: "abc",
        end_date: "2021-01-10",
      });
      BodyMiddleware.validate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("Erros via Zod (fromZodError)", () => {
    it("deve retornar 400 se product for inválido", () => {
      const { req, res, next } = createMocks({
        start_date: "2021-01-01",
        end_date: "2021-01-10",
        product: "invalid",
      });
      BodyMiddleware.validate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("deve retornar 400 se kind for inválido", () => {
      const { req, res, next } = createMocks({
        start_date: "2021-01-01",
        end_date: "2021-01-10",
        kind: "invalid",
      });
      BodyMiddleware.validate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("deve retornar 400 se type for inválido", () => {
      const { req, res, next } = createMocks({
        start_date: "2021-01-01",
        end_date: "2021-01-10",
        type: "invalid",
      });
      BodyMiddleware.validate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe("Validação e transformação do body", () => {
    it("deve chamar next() e normalizar body corretamente", () => {
      const { req, res, next } = createMocks({
        start_date: "2021-01-01",
        end_date: "2021-01-10",
        product: "boleto",
        id: ["1", "2"],
        kind: "webhook",
        type: "disponivel",
      });

      BodyMiddleware.validate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body.start_date).toBeInstanceOf(Date);
      expect(req.body.end_date).toBeInstanceOf(Date);
      expect(req.body.product).toBe("BOLETO");
      expect(req.body.id).toEqual(["1", "2"]);
      expect(req.body.kind).toBe("webhook");
      expect(req.body.type).toBe("disponivel");
    });

    it("deve aceitar datas iguais (start_date = end_date)", () => {
      const { req, res, next } = createMocks({
        start_date: "2021-01-01",
        end_date: "2021-01-01",
      });
      BodyMiddleware.validate(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.body.start_date.getTime()).toBe(req.body.end_date.getTime());
    });

    it("deve aceitar diferença de 31 dias (limite máximo)", () => {
      const { req, res, next } = createMocks({
        start_date: "2021-01-01",
        end_date: "2021-02-01",
      });
      BodyMiddleware.validate(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("deve aceitar body com campos opcionais ausentes", () => {
      const { req, res, next } = createMocks({
        start_date: "2021-01-01",
        end_date: "2021-01-02",
      });
      BodyMiddleware.validate(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.body.product).toBeUndefined();
      expect(req.body.kind).toBeUndefined();
      expect(req.body.type).toBeUndefined();
      expect(req.body.id).toBeUndefined();
    });
  });

  describe("Erro inesperado", () => {
    it("deve retornar 500 se ocorrer erro desconhecido", () => {
      const { req, res, next } = createMocks({
        start_date: "2021-01-01",
        end_date: "2021-01-02",
      });

      const mockDTO = jest
        .spyOn(require("../../dtos/ProtocolosDto"), "ProtocolosDTO" as any)
        .mockImplementationOnce(() => {
          throw new Error("Erro desconhecido");
        });

      BodyMiddleware.validate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();

      mockDTO.mockRestore();
    });
  });
});
