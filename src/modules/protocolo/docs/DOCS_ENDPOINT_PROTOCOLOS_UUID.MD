# Fluxo de Execução /protocolos/:id

Um cliente (SH) envia através de uma requisição HTTP para a API do Disparador de Webhook as seguintes informações:

**Parâmetros da URL:**

- `id`: string (UUID do protocolo)

**Headers da requisição:**

- `x-api-cnpj-sh`: string (CNPJ do SH com formatação)
- `x-api-token-sh`: string (Token do SH)
- `x-api-cnpj-cedente`: string (CNPJ do Cedente com formatação) - Nota: É string, não number
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

| Parâmetro | Tipo   | Descrição         | Obrigatório |
| --------- | ------ | ----------------- | ----------- |
| id        | string | UUID do protocolo | Sim         |

Se o `id` não for um UUID válido, deve ser retornado um erro 400. A validação utiliza `z.uuid()` do Zod para garantir formato UUID rigoroso. As mensagens de erro são específicas e detalhadas através de `InvalidFieldsError.fromZodError()`.

## Regras de Negócio

**IMPORTANTE:** O parâmetro `id` da URL é usado para buscar na coluna `protocolo` da tabela `WebhookReprocessado`, não no campo `id`.

Após as validações, o serviço buscará no banco de dados o registro de `WebhookReprocessado` que corresponda ao campo `protocolo` (usando o `id` fornecido na URL) e ao `cedenteId` associado ao token.

Se o protocolo não for encontrado ou não pertencer ao cedente, o serviço retornará um erro **400 (Bad Request)**, não 404.

**Estrutura do Erro:**

```json
{
  "code": "NOT_FOUND.",
  "statusCode": 400,
  "errors": ["Protocolo não encontrado."]
}
```

Caso seja encontrado, o serviço retornará o objeto completo do protocolo com todos os campos.

**Estrutura da Resposta de Sucesso:**

A resposta contém todos os campos do modelo `WebhookReprocessado`:

| Campo        | Tipo     | Descrição                                   |
| ------------ | -------- | ------------------------------------------- |
| id           | UUID     | UUID do registro                            |
| data         | JSONB    | Objeto JSON com dados das notificações      |
| data_criacao | Date     | Data de criação                             |
| cedente_id   | number   | ID do Cedente                               |
| kind         | string   | Tipo de reenvio (ex: "webhook")             |
| type         | string   | Tipo da situação (ex: "pago")               |
| servico_id   | string[] | Array de IDs dos serviços                   |
| product      | ENUM     | Produto (BOLETO, PAGAMENTO, PIX)            |
| protocolo    | string   | UUID do protocolo retornado pela Tecnospeed |

## Cache de Requisições

O endpoint possui sistema de cache para otimizar performance.

**Características:**

- TTL: 24 horas (1 dia)
- Chave do cache: `protocolo:{cedenteId}:{id}`
- Verificação: Cache é verificado **ANTES** de consultar o banco de dados
- Armazenamento: Após busca bem-sucedida, o resultado é armazenado no cache

**Fluxo do Cache:**

1. Verificação: Ao receber a requisição, o cache é verificado primeiro
2. Cache Hit: Se encontrar no cache, retorna imediatamente o valor armazenado
3. Cache Miss: Se não encontrar, processa normalmente a requisição
4. Armazenamento: Após busca bem-sucedida, o resultado é armazenado no cache

## Fluxo de Execução

1. **Recebimento da requisição** GET em `/protocolos/:id`
2. **Validação das headers** de SH e Cedente (`AuthMiddleware`)
   - Valida CNPJ e Token da Software House
   - Valida CNPJ e Token do Cedente
   - Verifica associação entre Cedente e Software House
   - Verifica status ativo/inativo
   - Em caso de erro: retorna 401 (Unauthorized)
3. **Validação do parâmetro `id`** (`ProtocoloParamDTOValidator`)
   - Valida formato UUID rigoroso usando `z.uuid()`
   - Em caso de erro: retorna 400 (Bad Request) com mensagens específicas
4. **Verificação do cache** (`ProtocolosService`)
   - Gera chave: `protocolo:{cedenteId}:{id}`
   - Se encontrado no cache: retorna imediatamente o valor armazenado
5. **Busca do protocolo no banco** (`WebhookReprocessadoRepository`)
   - Busca na coluna `protocolo` usando o `id` fornecido
   - Filtra por `cedente_id` do cedente autenticado
   - Em caso de não encontrado: retorna 400 (Bad Request) com código "NOT_FOUND."
6. **Armazenamento no cache** (`ProtocolosService`)
   - Armazena resultado no cache com TTL de 24 horas
7. **Retorno da requisição**
   - Retorna 200 com objeto completo do protocolo
   - Em caso de erro não tratado: retorna 500 (Internal Server Error)
