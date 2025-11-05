import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { ProtocoloParamDTOValidator } from "../validators/ProtocoloParamDTOValidator";
import { ProtocoloParamDTO } from "./ProtocoloParamDTO";

jest.mock("../validators/ProtocoloParamDTOValidator", () => ({
  ProtocoloParamDTOValidator: {
    safeParse: jest.fn(),
  },
}));

describe("ProtocoloParamDTO", () => {
  const mockSafeParse = ProtocoloParamDTOValidator.safeParse as jest.Mock;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("deve criar uma instância válida quando os dados são corretos", () => {
    const mockData = { id: "123" };

    mockSafeParse.mockReturnValue({
      success: true,
      data: mockData,
    });

    const dto = new ProtocoloParamDTO(mockData);

    expect(dto).toBeInstanceOf(ProtocoloParamDTO);
    expect(dto.id).toBe("123");
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

    expect(() => new ProtocoloParamDTO({})).toThrow(InvalidFieldsError);
    expect(fromZodErrorSpy).toHaveBeenCalledWith(mockError);
  });

  it("deve chamar Object.assign corretamente quando a validação for bem-sucedida", () => {
    const mockData = { id: "999" };

    mockSafeParse.mockReturnValue({
      success: true,
      data: mockData,
    });

    const assignSpy = jest.spyOn(Object, "assign");
    new ProtocoloParamDTO(mockData);

    expect(assignSpy).toHaveBeenCalledWith(expect.any(Object), mockData);
  });

  it("deve chamar o validator com o body recebido", () => {
    const mockBody = { id: "777" };

    mockSafeParse.mockReturnValue({
      success: true,
      data: mockBody,
    });

    new ProtocoloParamDTO(mockBody);

    expect(mockSafeParse).toHaveBeenCalledWith(mockBody);
  });
});
