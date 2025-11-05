import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { ProtocolosDTOValidator } from "../validators/ProtocolosDTOValidator";
import { ProtocolosDTO } from "./ProtocolosDTO";

describe("ProtocolosDTO", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("deve criar uma instância válida quando os dados são corretos", () => {
    const mockData = {
      start_date: new Date("2025-01-01").toISOString(),
      end_date: new Date("2025-01-05").toISOString(),
      product: "pix",
      id: "123,456",
      kind: "webhook",
      type: "pago",
      page: "1",
      limit: "10",
    };

    const dto = new ProtocolosDTO(mockData);

    expect(dto).toBeInstanceOf(ProtocolosDTO);
    expect(dto.start_date).toEqual(new Date(mockData.start_date));
    expect(dto.end_date).toEqual(new Date(mockData.end_date));
    expect(dto.product).toBe("PIX");
    expect(dto.id).toEqual(["123", "456"]);
    expect(dto.kind).toBe("webhook");
    expect(dto.type).toBe("pago");
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(10);
  });

  it("deve lançar InvalidFieldsError quando os dados são inválidos", () => {
    const mockError = { message: "Erro de validação" };
    jest
      .spyOn(ProtocolosDTOValidator, "safeParse")
      .mockReturnValue({ success: false, error: mockError as any } as any);

    const fromZodErrorSpy = jest
      .spyOn(InvalidFieldsError, "fromZodError")
      .mockReturnValue(new InvalidFieldsError(mockError as any));

    expect(() => new ProtocolosDTO({})).toThrow(InvalidFieldsError);
    expect(fromZodErrorSpy).toHaveBeenCalledWith(mockError);
  });

  it("deve chamar Object.assign corretamente quando a validação for bem-sucedida", () => {
    const mockData = { start_date: new Date(), end_date: new Date() };
    jest
      .spyOn(ProtocolosDTOValidator, "safeParse")
      .mockReturnValue({ success: true, data: mockData as any } as any);

    const assignSpy = jest.spyOn(Object, "assign");
    new ProtocolosDTO(mockData);
    expect(assignSpy).toHaveBeenCalledWith(expect.any(Object), mockData);
  });

  it("deve chamar o validator com o body recebido", () => {
    const mockBody = { start_date: new Date(), end_date: new Date() };
    jest
      .spyOn(ProtocolosDTOValidator, "safeParse")
      .mockReturnValue({ success: true, data: mockBody as any } as any);

    new ProtocolosDTO(mockBody);

    expect(ProtocolosDTOValidator.safeParse).toHaveBeenCalledWith(mockBody);
  });
});
