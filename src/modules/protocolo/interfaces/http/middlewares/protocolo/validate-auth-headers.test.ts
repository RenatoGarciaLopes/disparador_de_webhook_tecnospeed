import { Cedente } from "@/sequelize/models/cedente.model";
import { SoftwareHouse } from "@/sequelize/models/software-house.model";
import { UnauthorizedError } from "@/shared/errors/Unauthorized";
import { validateAuthHeaders } from "./validate-auth-headers";

describe("[HTTP Middleware] /protocolo - validateAuthHeaders", () => {
  const mockHeaders = new Headers({
    "x-api-cnpj-sh": "1234567890",
    "x-api-token-sh": "1234567890",
    "x-api-cnpj-cedente": "1234567890",
    "x-api-token-cedente": "1234567890",
  });

  it("deve lançar um erro se algum dos headers não forem enviados", async () => {
    const headersNenhumaHeaderEnviada = new Headers();
    await expect(
      validateAuthHeaders(headersNenhumaHeaderEnviada),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    const requiredHeaders = [
      "x-api-cnpj-sh",
      "x-api-token-sh",
      "x-api-cnpj-cedente",
      "x-api-token-cedente",
    ];

    for (const header of requiredHeaders) {
      // Monta um objeto Headers só com o header atual
      const partialHeaders = new Headers();
      partialHeaders.set(header, "1234567890");

      await expect(validateAuthHeaders(partialHeaders)).rejects.toBeInstanceOf(
        UnauthorizedError,
      );
    }
  });

  it("deve lançar um erro se o cnpj e token da sh não estiver cadastrado", async () => {
    jest.spyOn(SoftwareHouse, "findOne").mockResolvedValue(null);

    const headers = new Headers(mockHeaders);
    await expect(validateAuthHeaders(headers)).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it("deve lançar um erro se a software house estiver inativa", async () => {
    jest.spyOn(SoftwareHouse, "findOne").mockResolvedValue({
      dataValues: {
        status: "inativo",
      },
    } as SoftwareHouse);

    const headers = new Headers(mockHeaders);
    await expect(validateAuthHeaders(headers)).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it("deve lançar um erro se o cnpj e token do cedente não estiver cadastrado", async () => {
    jest.spyOn(SoftwareHouse, "findOne").mockResolvedValue({
      dataValues: {
        id: 1,
        status: "ativo",
      },
    } as SoftwareHouse);
    jest.spyOn(Cedente, "findOne").mockResolvedValue(null);

    const headers = new Headers(mockHeaders);
    await expect(validateAuthHeaders(headers)).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it("deve lançar um erro se o cnpj do cedente não estiver cadastrado", async () => {
    jest.spyOn(SoftwareHouse, "findOne").mockResolvedValue({
      dataValues: {
        id: 1,
        status: "ativo",
      },
    } as SoftwareHouse);
    jest.spyOn(Cedente, "findOne").mockResolvedValue({
      dataValues: {
        id: 1,
        status: "inativo",
      },
    } as Cedente);

    const headers = new Headers(mockHeaders);
    await expect(validateAuthHeaders(headers)).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it("deve lançar um erro se o cedente não estiver vinculado à software house", async () => {
    jest.spyOn(SoftwareHouse, "findOne").mockResolvedValue({
      dataValues: {
        id: 1,
        status: "ativo",
      },
    } as SoftwareHouse);

    jest.spyOn(Cedente, "findOne").mockResolvedValue({
      dataValues: {
        id: 1,
        status: "ativo",
        softwarehouse_id: 2,
      },
    } as Cedente);

    const headers = new Headers(mockHeaders);
    await expect(validateAuthHeaders(headers)).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it("deve não lançar um erro e retornar true se todos os headers forem enviados e válidos", async () => {
    jest.spyOn(SoftwareHouse, "findOne").mockResolvedValue({
      dataValues: {
        id: 1,
        status: "ativo",
      },
    } as SoftwareHouse);
    jest.spyOn(Cedente, "findOne").mockResolvedValue({
      dataValues: {
        id: 1,
        status: "ativo",
        softwarehouse_id: 1,
      },
    } as Cedente);

    const headers = new Headers(mockHeaders);
    await expect(validateAuthHeaders(headers)).resolves.toEqual({
      softwarehouse: {
        id: 1,
        status: "ativo",
      },
      cedente: {
        id: 1,
        status: "ativo",
      },
    });
  });
});
