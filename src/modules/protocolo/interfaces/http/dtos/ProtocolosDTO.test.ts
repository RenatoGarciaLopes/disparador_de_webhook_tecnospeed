import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { ProtocolosDTOValidator } from "../validators/ProtocolosDTOValidator";
import { ProtocolosDTO } from "./ProtocolosDto";

jest.mock("../validators/ProtocolosDTOValidator", () => ({
  ProtocolosDTOValidator: {
    safeParse: jest.fn(),
  },
}));

describe("ProtocolosDTO", () => {
  const mockSafeParse = ProtocolosDTOValidator.safeParse as jest.Mock;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("deve criar uma instância válida quando os dados são corretos", () => {
    const mockData = {
      start_date: new Date("2025-01-01"),
      end_date: new Date("2025-01-05"),
      product: "PIX",
      id: ["123", "456"],
      kind: "webhook",
      type: "pago",
    };

    mockSafeParse.mockReturnValue({
      success: true,
      data: mockData,
    });

    const dto = new ProtocolosDTO(mockData);

    expect(dto).toBeInstanceOf(ProtocolosDTO);
    expect(dto.start_date).toEqual(mockData.start_date);
    expect(dto.end_date).toEqual(mockData.end_date);
    expect(dto.product).toBe("PIX");
    expect(dto.id).toEqual(["123", "456"]);
    expect(dto.kind).toBe("webhook");
    expect(dto.type).toBe("pago");
  });

  it("deve lançar InvalidFieldsError quando os dados são inválidos", () => {
    const mockError = { message: "Erro de validação" };
    mockSafeParse.mockReturnValue({
      success: false,
      error: mockError,
    });

    const fromZodErrorSpy = jest
      .spyOn(InvalidFieldsError, "fromZodError")
      .mockReturnValue(new InvalidFieldsError(mockError as any));

    expect(() => new ProtocolosDTO({})).toThrow(InvalidFieldsError);
    expect(fromZodErrorSpy).toHaveBeenCalledWith(mockError);
  });

  it("deve chamar Object.assign corretamente quando a validação for bem-sucedida", () => {
    const mockData = { start_date: new Date(), end_date: new Date() };

    mockSafeParse.mockReturnValue({
      success: true,
      data: mockData,
    });

    const assignSpy = jest.spyOn(Object, "assign");
    new ProtocolosDTO(mockData);
    expect(assignSpy).toHaveBeenCalledWith(expect.any(Object), mockData);
  });

  it("deve chamar o validator com o body recebido", () => {
    const mockBody = { start_date: new Date(), end_date: new Date() };
    mockSafeParse.mockReturnValue({ success: true, data: mockBody });

    new ProtocolosDTO(mockBody);

    expect(mockSafeParse).toHaveBeenCalledWith(mockBody);
  });
});
