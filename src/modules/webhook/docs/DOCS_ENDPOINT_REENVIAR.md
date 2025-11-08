# Fluxo de Execução /reenviar

Um cliente (SH) envia através de uma requisição HTTP para a API do Disparador de Webhook um payload contendo:

- `product`: boleto, pagamento ou pix. (ENUM) - Será transformado para UPPERCASE (BOLETO, PAGAMENTO, PIX)
- `id`: string[] - Array de strings que representam números inteiros positivos. Será transformado para number[] após validação.
- `kind`: webhook
- `type`: disponivel, cancelado ou pago. (ENUM) - Nota: "disponivel" é sem acento

E também envia nas Headers da requisição:

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

A API deve validar cada parâmetro enviado com base em seus tipos e valores esperados.

| Parâmetro | Tipo     | Valores Esperados           | Obrigatório | Máximo de Valores | Status Code de Erro |
| --------- | -------- | --------------------------- | ----------- | ----------------- | ------------------- |
| product   | ENUM     | boleto, pagamento, pix      | Sim         | 1                 | 400                 |
| id        | string[] | IDs dos serviços            | Sim         | 30                | 400                 |
| kind      | ENUM     | webhook                     | Sim         | 1                 | 400 ou 501          |
| type      | ENUM     | disponivel, cancelado, pago | Sim         | 1                 | 400                 |

**Status Codes de Erro:**

- `400`: Parâmetros inválidos na requisição (validação de formato/tipo)
- `409`: Requisição duplicada já processada anteriormente (cache)
- `422`: Validação de regras de negócio (serviços não encontrados, sem configuração, etc.)
- `501`: `kind` não suportado (retorna "NOT_IMPLEMENTED")
- `500`: Erro interno do servidor

Se algum parâmetro não corresponder aos valores esperados, deve ser retornado um erro 400 com mensagens específicas de validação. As mensagens de erro são detalhadas e incluem informações sobre qual campo está incorreto.

### Parâmetro `id`

O parâmetro `id` deve ser um array de strings.

O array deve corresponder a IDs válidos dentro da tabela `Servico`. Portanto, deve ser validado se os valores enviados dentro do array são string de números inteiros positivos. Já que o tipo da coluna `id` da tabela `Servico` é `INTEGER`.

Se algum valor do array não corresponder aos valores esperados, deve ser retornado um erro 400. Com mensagem genérica "Parâmetro inválido". Junto com o campo que não correspondeu aos valores esperados.

Após a validação, deve ser feita uma transformação do array de strings para um array de números inteiros positivos.

## Regras de Negócio - Validação dos Parâmetros

Após as validações das headers e dos parâmetros, deve ser feito a validação da regra de negócio.

### Update da Tabela `Servico`

Como a tabela `Servico` é igual ao `produto` precisamos de alguma forma identificar qual o `produto` que o serviço em questão se refere. Por isso, agora na tabela `Servico` temos uma nova coluna `produto` que será o `produto` que o serviço em questão se refere (BOLETO, PAGAMENTO ou PIX).

Também temos uma coluna `situacao` que será a situação do serviço em questão (Seguindo a 'Tabela de Situações'). Já que agora temos o `produto` e precisamos verificar se o `Servico` está `disponível`, `cancelado` ou `pago`.

### Validação do Parâmetro `id`

Ao receber o array de IDs, todas as validações são realizadas em uma única consulta ao banco de dados:

1. Verificar se todos os IDs existem na tabela `Servico`
2. Verificar se todos os `Servico`s encontrados estão `ativo`s (`status = 'ativo'`)
3. Verificar se todos os IDs correspondem ao `produto` especificado no parâmetro `product` (transformado para UPPERCASE)
4. Verificar se todos os `Servico`s encontrados estão com a `situacao` correspondente ao parâmetro `type` especificado
5. Verificar se todos os `Servico`s estão associados ao `Cedente` validado no middleware

Se alguma das validações falhar, deve ser retornado um erro **422** (não 400) com a seguinte mensagem:

```text
"Alguns serviços não foram encontrados ou estão inativos para este cedente. Verifique se o serviço está ativo, se o produto é o mesmo do solicitado e se a situação é a mesma da solicitada."
```

Cada ID inválido terá uma mensagem específica: `"O serviço {id} não foi encontrado ou está inativo para este cedente."`

## Regras de Negócio - Configuração da Notificação

Como a mesma configuração estará presente na Conta e no Cedente, será necessário criar uma lógica para priorizar sempre a configuração da conta. Caso a configuração na Conta não exista, então será utilizada a configuração do Cedente.

Para isso, deve se primeiro identificar todas as contas e cedentes que estão associados aos `Servico`s que estão sendo processados. Então deve ser feita uma consulta na tabela `Conta` e na tabela `Cedente` para buscar as configurações de notificação.

Caso a configuração na Conta não exista, então será utilizada a configuração do Cedente.

**Validação de Configuração Ausente:**

Se algum serviço não possuir configuração de notificação (nem na Conta nem no Cedente), será retornado um erro **422** com mensagem específica:

```text
"Serviço {id} não possui configuração de notificação."
```

**Headers Adicionais:**

Além dos headers padrão (`header`, `header_campo`, `header_valor`), a configuração de notificação suporta também `headers_adicionais`, que é um array de objetos `Record<string, string>` que serão mesclados aos headers do payload.

### Regras de Negócio - Processamento da Notificação

Após a validação dos parâmetros, é realizado o processamento da notificação.

**IMPORTANTE:** Um único UUID é gerado para toda a requisição (não há agrupamento por Conta/Cedente). Cada serviço que possuir configuração de notificação gerará um payload individual, mas todos compartilharão o mesmo UUID (`webhook_reprocessado`).

Com base no `product` enviado na requisição (transformado para UPPERCASE), o payload a ser enviado para a Tecnospeed será montado seguindo um dos modelos abaixo.

#### Tabela de Situações para mapeamento do type

| type       | boleto     | pagamento        | pix        |
| ---------- | ---------- | ---------------- | ---------- |
| disponivel | REGISTRADO | SCHEDULED ACTIVE | ACTIVE     |
| cancelado  | BAIXADO    | CANCELLED        | REJECTED   |
| pago       | LIQUIDADO  | PAID             | LIQUIDATED |

**Nota:** O valor do parâmetro `type` usa "disponivel" sem acento.

#### Mapeamento do payload para api da Tecnospeed

Para simular a api utilize a url de envio: ([https://plug-retry.free.beeceptor.com](https://plug-retry.free.beeceptor.com)) A api aceita apenas o método POST. E retorna um UUID de protocolo.

```json
{
  "protocolo": "123e4567-e89b-12d3-a456-426614174000"
}
```

##### Boleto

O mapeamento do serviço de boleto para o payload da api da Tecnospeed é:

```json
{
  "kind": "webhook",
  "method": "POST",
  "url": "https://webhook.site/<ID do webhook>",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "tipoWH": "",
    "dataHoraEnvio": "01/01/2024 14:30:00",
    "CpfCnpjCedente": "<CNPJ do Cedente>",
    "titulo": {
      "situacao": "<SITUAÇÃO DO BOLETO>",
      "idintegracao": "<ID webhook reprocessado>",
      "TituloNossoNumero": "",
      "TituloMovimentos": {}
    }
  }
}
```

**Onde:**

| Parâmetro | Tipo   | Descrição                                                                                                                                                                                    |
| --------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| kind      | ENUM   | webhook                                                                                                                                                                                      |
| method    | ENUM   | POST                                                                                                                                                                                         |
| url       | string | url encontrada dentro da configuração da notificação                                                                                                                                         |
| headers   | object | headers encontrados dentro da configuração da notificação. Inclui `Content-Type: application/json` por padrão, além de `header_campo: header_valor` e `headers_adicionais` (se configurados) |
| body      | object | body do payload da api da Tecnospeed                                                                                                                                                         |

**Objeto body:**

| Parâmetro                | Tipo   | Descrição                                                                                                                                              |
| ------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| tipoWH                   | string | tipo de notificação (e.g: notifica_liquidou). Deixar em branco                                                                                         |
| dataHoraEnvio            | string | data e hora de envio no formato gerado por `toLocaleString("pt-BR")` com `dateStyle: "short"` e `timeStyle: "medium"` (exemplo: "01/01/2024 14:30:00") |
| CpfCnpjCedente           | string | CNPJ do Cedente                                                                                                                                        |
| titulo                   | object | objeto titulo                                                                                                                                          |
| titulo.situacao          | string | situação do boleto mapeada na tabela de situações para mapeamento do type                                                                              |
| titulo.idintegracao      | string | ID webhook reprocessado (UUID gerado para o `WebhookReprocessado`)                                                                                     |
| titulo.TituloNossoNumero | string | Nosso Número do título (Deixar em branco)                                                                                                              |
| titulo.TituloMovimentos  | object | objeto movimentos do título (Objeto vazio)                                                                                                             |

##### Pagamento

O mapeamento do serviço de pagamento para o payload da api da Tecnospeed é:

```json
{
  "kind": "webhook",
  "method": "POST",
  "url": "https://webhook.site/<ID do webhook>",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "status": "<SITUAÇÃO DO PAGAMENTO>",
    "uniqueid": "<ID webhook reprocessado>",
    "createdAt": "yyyy-mm-ddThh:mm:ssZ",
    "ocurrences": [],
    "accountHash": "<ID da Conta>",
    "occurrences": []
  }
}
```

**Onde:**

| Parâmetro | Tipo   | Descrição                                                                                                                                                                                    |
| --------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| kind      | ENUM   | webhook                                                                                                                                                                                      |
| method    | ENUM   | POST                                                                                                                                                                                         |
| url       | string | url encontrada dentro da configuração da notificação                                                                                                                                         |
| headers   | object | headers encontrados dentro da configuração da notificação. Inclui `Content-Type: application/json` por padrão, além de `header_campo: header_valor` e `headers_adicionais` (se configurados) |
| body      | object | body do payload da api da Tecnospeed                                                                                                                                                         |

**Objeto body:**

| Parâmetro   | Tipo   | Descrição                                                                                         |
| ----------- | ------ | ------------------------------------------------------------------------------------------------- |
| status      | string | situação do pagamento mapeada na tabela de situações para mapeamento do type                      |
| uniqueid    | string | ID webhook reprocessado (UUID gerado para o `WebhookReprocessado`)                                |
| createdAt   | string | data e hora de criação no formato ISO 8601 (`toISOString()`, exemplo: "2024-01-01T14:30:00.000Z") |
| ocurrences  | array  | array de objetos de ocorrências (Objeto vazio)                                                    |
| accountHash | string | ID da Conta                                                                                       |
| occurrences | array  | array de objetos de ocorrências (Objeto vazio)                                                    |

##### Pix

O mapeamento do serviço de pix para o payload da api da Tecnospeed é:

```json
{
  "kind": "webhook",
  "method": "POST",
  "url": "https://webhook.site/<ID do webhook>",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "type": "",
    "companyId": "<ID do Cedente>",
    "event": "<SITUAÇÃO DO PIX>",
    "transactionId": "<ID webhook reprocessado>",
    "tags": ["<ID da Conta>", "pix", "<ANO ATUAL>"],
    "id": {
      "pixId": "<ID do Servico>"
    }
  }
}
```

**Onde:**

| Parâmetro | Tipo   | Descrição                                                                                                                                                                                    |
| --------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| kind      | ENUM   | webhook                                                                                                                                                                                      |
| method    | ENUM   | POST                                                                                                                                                                                         |
| url       | string | url encontrada dentro da configuração da notificação                                                                                                                                         |
| headers   | object | headers encontrados dentro da configuração da notificação. Inclui `Content-Type: application/json` por padrão, além de `header_campo: header_valor` e `headers_adicionais` (se configurados) |
| body      | object | body do payload da api da Tecnospeed                                                                                                                                                         |

**Objeto body:**

| Parâmetro     | Tipo   | Descrição                                                                   |
| ------------- | ------ | --------------------------------------------------------------------------- |
| type          | string | tipo de notificação (e.g: notifica_pix). Deixar em branco                   |
| companyId     | string | ID do Cedente                                                               |
| event         | string | situação do pix mapeada na tabela de situações para mapeamento do type      |
| transactionId | string | ID webhook reprocessado (UUID gerado para o `WebhookReprocessado`)          |
| tags          | array  | array de strings de tags (e.g: ["\<ID da Conta\>", "pix", "\<ANO ATUAL\>"]) |
| id            | object | objeto id                                                                   |
| id.pixId      | string | ID do Servico                                                               |

#### Envio dos payloads para a API da Tecnospeed

Todos os payloads acima devem ser enviados para a API da Tecnospeed **em uma única requisição** com a seguinte estrutura:

```json
{
  "notifications": [
    {
      /* payload 1 */
    },
    {
      /* payload 2 */
    },
    {
      /* ... */
    }
  ]
}
```

Como retorno, a API enviará um **único UUID de protocolo** para todos os payloads:

```json
{
  "protocolo": "123e4567-e89b-12d3-a456-426614174000"
}
```

Esse UUID deve ser salvo na tabela `WebhookReprocessado` na coluna `protocolo`.

**Estrutura da Tabela WebhookReprocessado:**

| Campo        | Tipo      | Descrição                                                 |
| ------------ | --------- | --------------------------------------------------------- |
| id           | UUID      | UUID gerado automaticamente (chave primária)              |
| cedente_id   | INTEGER   | ID do Cedente (foreign key)                               |
| kind         | STRING    | Tipo de reenvio (ex: "webhook")                           |
| type         | STRING    | Tipo da situação (ex: "pago", "cancelado", "disponivel")  |
| servico_id   | JSONB     | Array de strings com os IDs dos serviços processados      |
| product      | ENUM      | Produto (BOLETO, PAGAMENTO, PIX)                          |
| protocolo    | STRING    | UUID do protocolo retornado pela Tecnospeed               |
| data         | JSONB     | Objeto JSON contendo `notifications: [array de payloads]` |
| data_criacao | TIMESTAMP | Data de criação (timestamp automático)                    |

O objeto deve ser salvo no banco de dados na tabela `WebhookReprocessado` como JSON através da coluna `data`. Junto aos dados da requisição e o protocolo.

Em caso de falha na comunicação com a Tecnospeed (erro 400 da API), será lançado um erro interno (500) com a mensagem: "Não foi possível gerar a notificação. Tente novamente mais tarde."

Após o processamento das notificações, deve ser retornado a seguinte resposta de sucesso:

```json
{
  "message": "Notificação reenviada com sucesso",
  "protocolo": "123e4567-e89b-12d3-a456-426614174000"
}
```

---

### Exemplo

Para SH com ID 1 e Cedente com ID 1 e Conta com ID 1 possui os seguintes `Servico`s:

- Servico com ID 1
- Servico com ID 2

Para SH com ID 1 e Cedente com ID 1 e Conta com ID 2 possui os seguintes `Servico`s:

- Servico com ID 3
- Servico com ID 4

Se for feito uma requisição para o endpoint com os seguintes parâmetros:

- product: boleto
- id: [1, 2, 3, 4]
- kind: webhook
- type: disponivel

Será gerado:

- Um único UUID (`webhook_reprocessado`)
- Quatro payloads individuais (um para cada serviço)
- Todos os payloads serão enviados em uma única requisição para a Tecnospeed
- Um único protocolo será retornado
- Um único registro será salvo na tabela `WebhookReprocessado` contendo todos os payloads no campo `data.notifications`

---

## Regras de Negócio - Cache de Requisições

Deve ser criado um cache de requisições para evitar requisições duplicadas. Para isso deve ser utilizado os parâmetros da requisição como chave e retorno final, caso já tenha sido processado e tenha sucesso, como valor.

**IMPORTANTE:** A verificação do cache é feita **ANTES** de processar a requisição, não depois.

O cache deve ter uma validade de **24 horas (1 dia)**.

**Formato da Chave do Cache:**

```text
reenviar:{PRODUCT}:{ids_ordenados}:{type}
```

Onde:

- `{PRODUCT}` é o valor do parâmetro `product` transformado para **UPPERCASE** (BOLETO, PAGAMENTO, PIX)
- `{ids_ordenados}` são os IDs ordenados numericamente e separados por vírgula (ex: "1,2,3,4")
- `{type}` é o valor do parâmetro `type` (pago, cancelado, disponivel)

**Nota:** O parâmetro `kind` **não é incluído** na chave do cache.

---

**Exemplo:**

Se a requisição for feita com os seguintes parâmetros:

- product: boleto
- id: [4, 2, 1, 3]
- kind: webhook
- type: disponivel

Então a chave gerada deve ser:

```text
reenviar:BOLETO:1,2,3,4:disponivel
```

E o valor armazenado no cache será:

```text
"1"
```

---

**Fluxo do Cache:**

1. **Verificação:** Ao receber a requisição, o cache é verificado **ANTES** de processar qualquer validação de regra de negócio
2. **Cache Hit:** Se encontrar no cache, retorna 409 (ALREADY_PROCESSED) com mensagem: "Você já processou esses serviços."
3. **Cache Miss:** Se não encontrar, processa normalmente a requisição
4. **Armazenamento:** Somente após o processamento bem-sucedido (criação no banco e envio para Tecnospeed), armazena a flag "1" no cache com TTL de 24 horas

## Fluxo de Execução

1. **Recebimento da requisição** em `/reenviar`
2. **Validação das headers** de SH e Cedente (`AuthMiddleware`)
   - Valida CNPJ e Token da Software House
   - Valida CNPJ e Token do Cedente
   - Verifica associação entre Cedente e Software House
   - Verifica status ativo/inativo
   - Em caso de erro: retorna 401 (Unauthorized)
3. **Validação dos parâmetros** (`BodyMiddleware`)
   - Valida formato e tipos usando `ReenviarDTOValidator`
   - Transforma `product` para UPPERCASE
   - Transforma `id` de string[] para number[]
   - Em caso de erro: retorna 400 (Bad Request)
4. **Validação do `kind`** (`ReenviarController`)
   - Verifica se `kind` está em `KINDS_REENVIOS` (atualmente apenas "webhook")
   - Em caso de erro: retorna 501 (NOT_IMPLEMENTED)
5. **Verificação do cache** (`ReenviarService`)
   - Gera chave: `reenviar:{PRODUCT}:{ids_ordenados}:{type}`
   - Se encontrado no cache: retorna 409 (ALREADY_PROCESSED) com mensagem: "Você já processou esses serviços."
6. **Busca e validação dos serviços** (`ReenviarService` → `ServicoRepository`)
   - Busca serviços que atendam: `id IN (ids)`, `produto = product`, `situacao = type`, `status = 'ativo'`, `cedente_id = cedenteId`
   - Verifica se todos os IDs foram encontrados
   - Em caso de erro: retorna 422 (Unprocessable Entity)
7. **Geração do UUID** (`ReenviarService`)
   - Gera um único UUID para toda a requisição (chamado de `processamentoId` ou `webhook_reprocessado`)
8. **Busca de configurações de notificação** (`ConfiguracaoNotificacaoUseCase`)
   - Para cada serviço, busca configuração na Conta (prioridade)
   - Se não encontrar, busca no Cedente
   - Em caso de serviço sem configuração: retorna 422 (Unprocessable Entity)
9. **Montagem dos payloads** (`MontarNotificacaoUseCase`)
   - Gera um payload individual para cada configuração de notificação encontrada
   - Monta headers incluindo `headers_adicionais` se configurado
   - Aplica mapeamento de situação conforme `product` e `type`
10. **Envio para Tecnospeed** (`TecnospeedClient`)
    - Envia todos os payloads em uma única requisição: `{ notifications: [...] }`
    - Recebe um único protocolo como resposta
    - Em caso de erro 400 da API: retorna 500 com mensagem genérica
11. **Salvamento no banco** (`WebhookReprocessadoRepository`)
    - Salva registro na tabela `WebhookReprocessado` com:
      - `id`: UUID gerado
      - `cedente_id`: ID do cedente
      - `kind`, `type`, `product`: valores da requisição
      - `servico_id`: array de strings com IDs dos serviços
      - `protocolo`: protocolo retornado pela Tecnospeed
      - `data`: JSON com array de notificações enviadas
12. **Armazenamento no cache** (`ReenviarService`)
    - Armazena a flag "1" no cache com TTL de 24 horas
13. **Retorno da requisição**
    - Retorna 200 com: `{ message: "Notificação reenviada com sucesso", protocolo: "..." }`
    - Se cache identificar requisição duplicada: retorna 409 (ALREADY_PROCESSED)
    - Em caso de erro não tratado: retorna 500 (Internal Server Error)
