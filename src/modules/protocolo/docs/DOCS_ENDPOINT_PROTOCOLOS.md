# Fluxo de Execução /protocolos

Um cliente (SH) envia através de uma requisição HTTP para a API do Disparador de Webhook um payload contendo:

- `start_date`: Date (data de início)
- `end_date`: Date (data de fim)
- `product`: "BOLETO", "PAGAMENTO" ou "PIX". (ENUM, opcional)
- `id`: string[] (opcional)
- `kind`: "webhook" (ENUM, opcional)
- `type`: "pago", "cancelado" ou "disponivel". (ENUM, opcional)

E também envia nas Headers da requisição:

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

A API deve validar cada parâmetro enviado com base em seus tipos e valores esperados.

| Parâmetro  | Tipo     | Valores Esperados                     | Obrigatório |
| ---------- | -------- | ------------------------------------- | ----------- |
| start_date | Date     | Data de início da busca               | Sim         |
| end_date   | Date     | Data de fim da busca                  | Sim         |
| product    | ENUM     | BOLETO, PAGAMENTO, PIX                | Não         |
| id         | string[] | IDs dos serviços                      | Não         |
| kind       | ENUM     | webhook                               | Não         |
| type       | ENUM     | pago, cancelado, disponivel           | Não         |

Se algum parâmetro não corresponder aos valores esperados, deve ser retornado um erro 400. Com mensagem genérica "Parâmetro inválido". Junto com o campo que não correspondeu aos valores esperados.

## Regras de Negócio - Validação do Body

Após a validação inicial dos tipos de dados, a API aplicará regras de negócio mais específicas para cada parâmetro opcional do corpo da requisição.

### Parâmetro `product`

Se o parâmetro `product` for fornecido, a busca será filtrada para incluir apenas os registros de `WebhookReprocessado` que correspondam ao produto especificado (BOLETO, PAGAMENTO ou PIX).

### Parâmetro `id`

O parâmetro `id` deve ser um array de strings de UUIDs. A busca será restrita aos protocolos (`id`) que estão na lista fornecida.

### Parâmetro `kind`

Se fornecido, o parâmetro `kind` filtrará os resultados para que correspondam ao tipo de reenvio especificado, como `webhook`.

### Parâmetro `type`

O parâmetro `type` (`pago`, `cancelado`, `disponivel`) filtrará os webhooks reprocessados pelo seu tipo de notificação. A busca considerará apenas os registros que se encaixam no tipo solicitado.

Se qualquer uma dessas validações de negócio falhar para um determinado registro, ele não será incluído no resultado final. A API retornará uma lista de protocolos que atendem a todos os critérios de busca fornecidos.

## Regras de Negócio - Busca

Após as validações, o serviço buscará no banco de dados os registros de `WebhookReprocessado` que correspondam a todos os filtros fornecidos (dentro do período de `start_date` e `end_date`) e que pertençam ao `cedenteId` identificado durante a autenticação.

O serviço retornará uma lista dos protocolos (`id`) que atendem aos critérios de busca.

## Fluxo de Execução

1. Recebimento da requisição em `/protocolos`;
2. Validação das headers de SH e Cedente (Middleware);
3. Validação dos parâmetros do body;
4. Busca dos protocolos no banco de dados com base nos filtros;
5. Retorno da lista de protocolos;
