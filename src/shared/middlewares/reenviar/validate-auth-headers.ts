import { UnauthorizedError } from "@/shared/errors/Unauthorized";

// TODO: Implementar a validação dos headers
export async function validateAuthHeaders(headers: Headers) {
  if (headers.get("x-api-cnpj-cedente") === "")
    throw new UnauthorizedError("Headers inválidos");
  return {
    softwarehouse: {
      id: 1,
      status: "ativo",
    },
    cedente: {
      id: 1,
      status: "ativo",
    },
  };
}
