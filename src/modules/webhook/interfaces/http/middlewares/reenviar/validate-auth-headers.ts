import { UnauthorizedError } from "@/shared/errors/Unauthorized";

// TODO: Implementar a validação dos headers
export async function validateAuthHeaders(headers: Headers) {
  if (
    !headers.has("x-api-cnpj-cedente") ||
    !headers.has("x-api-token-cedente") ||
    !headers.has("x-api-cnpj-sh") ||
    !headers.has("x-api-token-sh")
  )
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
