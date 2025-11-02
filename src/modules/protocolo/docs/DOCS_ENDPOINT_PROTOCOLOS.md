# Fluxo de Execução /protocolos

Um cliente (SH) envia através de uma requisição HTTP **GET** para a API do Disparador de Webhook com os seguintes parâmetros na **query string**:

- `start_date`: string (data de início no formato ISO ou aceito pelo JavaScript Date)
- `end_date`: string (data de fim no formato ISO ou aceito pelo JavaScript Date)
- `product`: "boleto", "pagamento" ou "pix" (ENUM, opcional) - Será transformado para UPPERCASE (BOLETO, PAGAMENTO, PIX)
- `id`: string[] (opcional) - Array de IDs numéricos de serviços (não UUIDs). Cada string deve representar um número inteiro positivo
- `kind`: "webhook" (ENUM, opcional)
- `type`: "pago", "cancelado" ou "disponivel" (ENUM, opcional)
- `page`: string (opcional) - Número inteiro positivo para paginação. Padrão: 1
- `limit`: string (opcional) - Número inteiro positivo entre 1 e 100 para paginação. Padrão: 10

E também envia nas Headers da requisição:

- `x-api-cnpj-sh`: string (CNPJ do SH sem formatação)
- `x-api-token-sh`: string (Token do SH)
- `x-api-cnpj-cedente`: string (CNPJ do Cedente sem formatação) - Nota: É string, não number
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

A API deve validar cada parâmetro enviado com base em seus tipos e valores esperados.

| Parâmetro  | Tipo     | Valores Esperados                     | Obrigatório | Validações Adicionais                    |
| ---------- | -------- | ------------------------------------- | ----------- | ---------------------------------------- |
| start_date | string   | Data válida (ISO ou formato aceito)   | Sim         | Transformado para Date                   |
| end_date   | string   | Data válida (ISO ou formato aceito)   | Sim         | Transformado para Date                   |
| product    | ENUM     | boleto, pagamento, pix (lowercase)    | Não         | Transformado para UPPERCASE              |
| id         | string[] | IDs numéricos de serviços (não UUIDs) | Não         | Cada ID deve ser número inteiro positivo |
| kind       | ENUM     | webhook                               | Não         |                                          |
| type       | ENUM     | pago, cancelado, disponivel           | Não         |                                          |
| page       | string   | Número inteiro positivo               | Não         | Padrão: 1                                |
| limit      | string   | Número inteiro positivo (1-100)       | Não         | Padrão: 10                               |

**Validações de Datas:**

Além da validação de formato, as datas devem atender:

- `end_date >= start_date` (diferença >= 0 dias)
- Diferença entre `end_date` e `start_date` <= 31 dias

Se alguma validação falhar, retorna erro 400 com mensagens específicas:

- "Data inicial inválida"
- "Data final inválida"
- "A diferença entre start_date e end_date tem quer ser >= 0 e <= 31 dias"
- "page deve ser um número inteiro positivo"
- "limit deve ser um número inteiro positivo entre 1 e 100"

## Regras de Negócio - Validação dos Parâmetros

Após a validação inicial dos tipos de dados, a API aplicará regras de negócio mais específicas para cada parâmetro opcional da query string.

### Parâmetro `product`

Se o parâmetro `product` for fornecido (aceita lowercase: `boleto`, `pagamento`, `pix`), será transformado para UPPERCASE e a busca será filtrada para incluir apenas os registros de `WebhookReprocessado` que correspondam ao produto especificado (BOLETO, PAGAMENTO ou PIX).

### Parâmetro `id`

**IMPORTANTE:** O parâmetro `id` não são UUIDs de protocolos, são **IDs numéricos de serviços**.

A busca será feita na coluna `servico_id` (tipo JSONB) usando a operação `Op.contains` do PostgreSQL. Isso significa que serão retornados apenas os registros de `WebhookReprocessado` cujo array `servico_id` contenha algum dos IDs fornecidos.

Cada ID no array deve ser um número inteiro positivo válido.

### Parâmetro `kind`

Se fornecido, o parâmetro `kind` filtrará os resultados para que correspondam ao tipo de reenvio especificado, como `webhook`.

### Parâmetro `type`

O parâmetro `type` (`pago`, `cancelado`, `disponivel`) filtrará os webhooks reprocessados pelo seu tipo de notificação. A busca considerará apenas os registros que se encaixam no tipo solicitado.

**Nota:** Os filtros são aplicados diretamente na query do banco de dados (não há validação pós-busca em memória).

## Regras de Negócio - Busca

Após as validações, o serviço buscará no banco de dados os registros de `WebhookReprocessado` que correspondam a todos os filtros fornecidos (dentro do período de `start_date` e `end_date`) e que pertençam ao `cedenteId` identificado durante a autenticação.

**Estrutura da Resposta:**

O serviço retorna objetos completos de `WebhookReprocessado` (não apenas IDs) com informações de paginação:

```json
{
  "data": [
    {
      "id": "uuid-do-registro",
      "data": {
        /* JSONB com dados das notificações */
      },
      "data_criacao": "2024-01-01T00:00:00.000Z",
      "cedente_id": 1,
      "kind": "webhook",
      "type": "pago",
      "servico_id": ["1", "2", "3"],
      "product": "BOLETO",
      "protocolo": "uuid-do-protocolo"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "total_pages": 10
  }
}
```

**Campos Retornados:**

Cada objeto no array `data` contém todos os campos do modelo `WebhookReprocessado`:

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
- Chave do cache: `protocolos:{cedenteId}:{product}:{ids_ordenados}:{type}:{kind}:{start_date_iso}:{end_date_iso}:{page}:{limit}`
- Verificação: Cache é verificado **ANTES** de consultar o banco de dados
- Armazenamento: Após busca bem-sucedida, o resultado é armazenado no cache

**Fluxo do Cache:**

1. Verificação: Ao receber a requisição, o cache é verificado primeiro
2. Cache Hit: Se encontrar no cache, retorna imediatamente o valor armazenado
3. Cache Miss: Se não encontrar, processa normalmente a requisição
4. Armazenamento: Após busca bem-sucedida, o resultado é armazenado no cache

## Paginação

O endpoint suporta paginação através dos parâmetros `page` e `limit` na query string.

**Parâmetros:**

- `page`: Número inteiro positivo (padrão: 1)
- `limit`: Número inteiro positivo entre 1 e 100 (padrão: 10)

**Cálculo:**

- `offset = (page - 1) * limit`
- `total_pages = Math.ceil(total / limit)`

**Resposta:**
A resposta inclui informações de paginação no objeto `pagination`:

- `page`: Página atual
- `limit`: Itens por página
- `total`: Total de registros encontrados
- `total_pages`: Total de páginas

## Fluxo de Execução

1. **Recebimento da requisição** GET em `/protocolos` com query parameters
2. **Validação das headers** de SH e Cedente (`AuthMiddleware`)
   - Valida CNPJ e Token da Software House
   - Valida CNPJ e Token do Cedente
   - Verifica associação entre Cedente e Software House
   - Verifica status ativo/inativo
   - Em caso de erro: retorna 401 (Unauthorized)
3. **Validação dos parâmetros** da query string (`BodyMiddleware` → `ProtocolosDTOValidator`)
   - Valida formato e tipos usando Zod
   - Transforma `product` para UPPERCASE
   - Transforma `start_date` e `end_date` para Date
   - Valida intervalo de datas (0-31 dias)
   - Valida paginação (page, limit)
   - Em caso de erro: retorna 400 (Bad Request) com mensagens específicas
4. **Verificação do cache** (`ProtocolosService`)
   - Gera chave com todos os parâmetros da busca
   - Se encontrado no cache: retorna imediatamente o valor armazenado
5. **Busca dos protocolos no banco** (`WebhookReprocessadoRepository`)
   - Busca com filtros: `cedente_id`, `data_criacao` (between), `product`, `kind`, `type`, `servico_id` (contains)
   - Aplica paginação (limit, offset)
   - Retorna dados e total de registros
6. **Cálculo de paginação** (`ProtocolosService`)
   - Calcula `total_pages = Math.ceil(total / limit)`
7. **Armazenamento no cache** (`ProtocolosService`)
   - Armazena resultado no cache com TTL de 24 horas
8. **Retorno da requisição**
   - Retorna 200 com estrutura paginada: `{ data: [...], pagination: {...} }`
   - Em caso de erro não tratado: retorna 500 (Internal Server Error)
