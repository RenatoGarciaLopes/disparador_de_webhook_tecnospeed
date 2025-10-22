# Fluxo de Execução /protocolos/:id

Um cliente (SH) envia através de uma requisição HTTP para a API do Disparador de Webhook as seguintes informações:

**Parâmetros da URL:**
- `id`: string (UUID do protocolo)

**Headers da requisição:**
- `x-api-cnpj-sh`: string (CNPJ do SH sem formatação)
- `x-api-token-sh`: string (Token do SH)
- `x-api-cnpj-cedente`: number (CNPJ do Cedente sem formatação)
- `x-api-token-cedente`: string (Token do Cedente)

## Validação das Headers (Middleware)

Deve ser criado um middleware para validar as Headers.

Para erros de validação, deve ser retornado um erro 401. Com mensagem genérica "Não autorizado".

**Importante**: a validação deve ser feita em sequência, ou seja, a validação da SH deve ser feita antes da validação do Cedente.

### SH - Software House

1. O middleware deve validar se o CNPJ e o TOKEN enviados para a SH estão cadastrados na tabela `SoftwareHouse`.

2. Se o CNPJ ou o TOKEN não estão cadastrados, ou não são correspondentes, a mesma Software House então deve ser retornado um erro 401.

3. Se a Software House encontrada está `inativo`, então deve ser retornado um erro 401.

### Cedente

1. O middleware deve validar se o CNPJ e o TOKEN enviados para o Cedente estão cadastrados na tabela `Cedente`.

2. Se o CNPJ ou o TOKEN não estão cadastrados, ou não são correspondentes, o Cedente então deve ser retornado um erro 401.

3. Se o CNPJ do Cedente não está associado a Software House validada anteriormente, então deve ser retornado um erro 401.

4. Se o Cedente encontrado está `inativo`, então deve ser retornado um erro 401.

## Validação dos Parâmetros

A API deve validar o parâmetro `id` enviado na URL.

| Parâmetro | Tipo   | Descrição        | Obrigatório |
| --------- | ------ | ---------------- | ----------- |
| id        | string | UUID do protocolo | Sim         |

Se o `id` não for um UUID válido, deve ser retornado um erro 400 com a mensagem "Parâmetro inválido".

## Regras de Negócio

Após as validações, o serviço buscará no banco de dados o registro de `WebhookReprocessado` que corresponda ao `id` (protocolo) fornecido e ao `cedenteId` associado ao token.

Se o protocolo não for encontrado ou não pertencer ao cedente, o serviço retornará um erro apropriado (por exemplo, 404 Not Found).

Caso seja encontrado, o serviço retornará o objeto do protocolo.

## Fluxo de Execução

1. Recebimento da requisição em `/protocolos/:id`;
2. Validação das headers de SH e Cedente (Middleware);
3. Validação do parâmetro `id` na URL;
4. Busca do protocolo no banco de dados pelo `id` e `cedenteId`;
5. Retorno do protocolo encontrado ou um erro 404;
