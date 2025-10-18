import { UnauthorizedError } from "@/shared/errors/Unauthorized";

// TODO: Implementar a validação dos headers baseada no DOCS_ENDPOINT_REENVIAR.md
// DOCS linhas 17-42: Validação de Headers de Autenticação

export async function validateAuthHeaders(headers: Headers) {
  // 1. Validar presença de todos os 4 headers obrigatórios (DOCS linhas 10-15)
  //    - x-api-cnpj-sh: CNPJ do SH sem formatação
  //    - x-api-token-sh: Token do SH
  //    - x-api-cnpj-cedente: CNPJ do Cedente sem formatação
  //    - x-api-token-cedente: Token do Cedente
  //    Se qualquer header faltar: throw new UnauthorizedError("Headers inválidos")

  if (
    !headers.has("x-api-cnpj-cedente") ||
    !headers.has("x-api-token-cedente") ||
    !headers.has("x-api-cnpj-sh") ||
    !headers.has("x-api-token-sh")
  )
    throw new UnauthorizedError("Headers inválidos");

  // 2. VALIDAÇÃO SEQUENCIAL (DOCS linha 23): SH primeiro, Cedente depois
  //    "Importante: a validação deve ser feita em sequência, ou seja,
  //     a validação da SH deve ser feita antes da validação do Cedente"

  // 3. Validar SoftwareHouse (DOCS linhas 25-31)
  //    - Instanciar: const softwareHouseRepository = new SoftwareHouseRepository()
  //    - Extrair headers: const cnpjSH = headers.get("x-api-cnpj-sh")
  //    - Extrair headers: const tokenSH = headers.get("x-api-token-sh")
  //    - Chamar: const shResult = await softwareHouseRepository.validateAuth(cnpjSH, tokenSH)
  //    - Se shResult.valid === false: throw new UnauthorizedError("Não autorizado")
  //    - Casos de falha:
  //      a) SH não encontrada (DOCS linha 29)
  //      b) SH com status "inativo" (DOCS linha 31)

  // 4. Validar Cedente (DOCS linhas 33-41)
  //    - Instanciar: const cedenteRepository = new CedenteRepository()
  //    - Extrair headers: const cnpjCedente = headers.get("x-api-cnpj-cedente")
  //    - Extrair headers: const tokenCedente = headers.get("x-api-token-cedente")
  //    - Extrair ID da SH validada: const softwarehouseId = shResult.softwareHouse.dataValues.id
  //    - Chamar: const cedenteResult = await cedenteRepository.validateAuth(cnpjCedente, tokenCedente, softwarehouseId)
  //    - Se cedenteResult.valid === false: throw new UnauthorizedError("Não autorizado")
  //    - Casos de falha:
  //      a) Cedente não encontrado (DOCS linha 35)
  //      b) Cedente com status "inativo" (DOCS linha 41)
  //      c) Cedente não pertence à SH validada (DOCS linha 39)

  // 5. Retornar objetos validados
  //    return {
  //      softwarehouse: shResult.softwareHouse,
  //      cedente: cedenteResult.cedente
  //    }

  // RED: Implementação mock para os testes falharem
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
