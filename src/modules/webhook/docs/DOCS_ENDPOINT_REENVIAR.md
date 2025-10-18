# Fluxo de Execução /reenviar

Um cliente (SH) envia através de uma requisição HTTP para a API do Disparador de Webhook um payload contendo:

- `product`: boleto, pagamento ou pix. (ENUM)
- `id`: string[]
- `kind`: webhook
- `type`: disponível, cancelado ou pago. (ENUM)

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

| Parâmetro | Tipo     | Valores Esperados           | Obrigatório | Máximo de Valores |
| --------- | -------- | --------------------------- | ----------- | ----------------- |
| product   | ENUM     | boleto, pagamento, pix      | Sim         | 1                 |
| id        | string[] | IDs dos serviços            | Sim         | 30                |
| kind      | ENUM     | webhook                     | Sim         | 1                 |
| type      | ENUM     | disponível, cancelado, pago | Sim         | 1                 |

Se algum parâmetro não corresponder aos valores esperados, deve ser retornado um erro 400. Com mensagem genérica "Parâmetro inválido". Junto com o campo que não correspondeu aos valores esperados.

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

Ao receber o array de IDs, devemos:

1. Verificar se todos os IDs existem na tabela `Servico`.

2. Verificar se todos os `Servico`s encontrados estão `ativo`s.

3. Verificar se todos os IDs correspondem ao `produto` especificado no parâmetro `product`.

Se alguma das validações falhar, deve ser retornado um erro 400. Com mensagem genérica "Parâmetro inválido". Junto com o campo que não correspondeu aos valores esperados.

1. Verificar se todos os `Servico`s encontrados estão `disponível`, `cancelado` ou `pago` de acordo com o `situacao` especificado no parâmetro `type`.

Caso a validação falhe em sua **quarta etapa** (a etapa acima), então deve ser agrupado os IDs que estão errados e um map com os IDs errados como chave e a mensagem de erro como valor: Não foi possível gerar a notificação. A situação do `product` diverge do tipo de notificação solicitado.

Onde `product` é o `produto` especificado no parâmetro `product`.

## Regras de Negócio - Configuração da Notificação

Como a mesma configuração estará presente na Conta e no Cedente, será necessário criar uma lógica para priorizar sempre a configuração da conta. Caso a configuração na Conta não exista, então será utilizada a configuração do Cedente.

Para isso, deve se primeiro identificar todas as contas e cedentes que estão associados aos `Servico`s que estão sendo processados. Então deve ser feita uma consulta na tabela `Conta` e na tabela `Cedente` para buscar as configurações de notificação.

Caso a configuração na Conta não exista, então será utilizada a configuração do Cedente.

### Regras de Negócio - Processamento da Notificação

Após a validação dos parâmetros, é realizado o processamento da notificação.

Para cada grupo de `Servico`s (por Conta ou, se não houver, por Cedente) deve ser gerado um UUID — chamado aqui de `webhook_reprocessado`. Com base no `product` enviado na requisição, o payload a ser enviado para a TechnoSpeed será montado seguindo um dos modelos abaixo.

#### Tabela de Situações para mapeamento do type

| type       | boleto     | pagamento        | pix        |
| ---------- | ---------- | ---------------- | ---------- |
| disponível | REGISTRADO | SCHEDULED ACTIVE | ACTIVE     |
| cancelado  | BAIXADO    | CANCELLED        | REJECTED   |
| pago       | LIQUIDADO  | PAID             | LIQUIDATED |

#### Mapeamento do payload para api da TechnoSpeed

Para simular a api utilize a url de envio: ([https://plug-retry.free.beeceptor.com](https://plug-retry.free.beeceptor.com)) A api aceita apenas o método POST. E retorna um UUID de protocolo.

```json
{
  "protocolo": "123e4567-e89b-12d3-a456-426614174000"
}
```

##### Boleto

O mapeamento do serviço de boleto para o payload da api da TechnoSpeed é:

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
    "dataHoraEnvio": "dd/mm/aaaa hh:mm:ss",
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

| Parâmetro | Tipo   | Descrição                                                 |
| --------- | ------ | --------------------------------------------------------- |
| kind      | ENUM   | webhook                                                   |
| method    | ENUM   | POST                                                      |
| url       | string | url encontrada dentro da configuração da notificação      |
| headers   | object | headers encontrados dentro da configuração da notificação |
| body      | object | body do payload da api da TechnoSpeed                     |

**Objeto body:**

| Parâmetro                | Tipo   | Descrição                                                                 |
| ------------------------ | ------ | ------------------------------------------------------------------------- |
| tipoWH                   | string | tipo de notificação (e.g: notifica_liquidou). Deixar em branco            |
| dataHoraEnvio            | string | data e hora de envio                                                      |
| CpfCnpjCedente           | string | CNPJ do Cedente                                                           |
| titulo                   | object | objeto titulo                                                             |
| titulo.situacao          | string | situação do boleto mapeada na tabela de situações para mapeamento do type |
| titulo.idintegracao      | string | ID webhook reprocessado (UUID gerado para o `WebhookReprocessado`)        |
| titulo.TituloNossoNumero | string | Nosso Número do título (Deixar em branco)                                 |
| titulo.TituloMovimentos  | object | objeto movimentos do título (Objeto vazio)                                |

##### Pagamento

O mapeamento do serviço de pagamento para o payload da api da TechnoSpeed é:

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

| Parâmetro | Tipo   | Descrição                                                 |
| --------- | ------ | --------------------------------------------------------- |
| kind      | ENUM   | webhook                                                   |
| method    | ENUM   | POST                                                      |
| url       | string | url encontrada dentro da configuração da notificação      |
| headers   | object | headers encontrados dentro da configuração da notificação |
| body      | object | body do payload da api da TechnoSpeed                     |

**Objeto body:**

| Parâmetro   | Tipo   | Descrição                                                                    |
| ----------- | ------ | ---------------------------------------------------------------------------- |
| status      | string | situação do pagamento mapeada na tabela de situações para mapeamento do type |
| uniqueid    | string | ID webhook reprocessado (UUID gerado para o `WebhookReprocessado`)           |
| createdAt   | string | data e hora de criação do pagamento                                          |
| ocurrences  | array  | array de objetos de ocorrências (Objeto vazio)                               |
| accountHash | string | ID da Conta                                                                  |
| occurrences | array  | array de objetos de ocorrências (Objeto vazio)                               |

##### Pix

O mapeamento do serviço de pix para o payload da api da TechnoSpeed é:

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

| Parâmetro | Tipo   | Descrição                                                 |
| --------- | ------ | --------------------------------------------------------- |
| kind      | ENUM   | webhook                                                   |
| method    | ENUM   | POST                                                      |
| url       | string | url encontrada dentro da configuração da notificação      |
| headers   | object | headers encontrados dentro da configuração da notificação |
| body      | object | body do payload da api da TechnoSpeed                     |

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

#### Envio dos payloads para a API da TechnoSpeed

Os payloads acima devem ser enviados para a API da TechnoSpeed para processamento. Como retorno, a API enviará um UUID de protocolo. Esse UUID deve ser salvo na tabela `WebhookReprocessado` na coluna `protocolo`. Caso existam múltiplos grupos (por Conta/Cedente), serão enviados múltiplos payloads e recebidos múltiplos protocolos.

Então deve ser salvo o objeto no banco de dados na tabela `WebhookReprocessado` como JSON através da coluna `data`. Junto ao dados da requisição e o protocolo.

Em caso de falha geral no processamento, retornar um erro 400 Bad Request com a mensagem: "Não foi possível gerar a notificação. Tente novamente mais tarde."

Após o processamento das notificações, deve ser retornado uma mensagem de sucesso dizendo que a notificação foi gerada com sucesso.

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
- type: disponível

Então deve ser montado apenas um `WebhookReprocessado` com um único UUID.

---

Os payloads acima devem ser enviados para a API da Technopeed para processamento. Como retorno, a API enviará um UUID de protocolo. Esse UUID deve ser salvo na tabela `WebhookReprocessado` na coluna `protocolo`.

Então deve ser salvo o objeto no banco de dados na tabela `WebhookReprocessado` como JSON através da coluna `data`. Junto ao dados da requisição e o protocolo.

Em caso de falha geral no processamento, retornar um erro 400 Bad Request com a mensagem: "Não foi possível gerar a notificação. Tente novamente mais tarde."

Após o processamento das notificações, deve ser retornado uma mensagem de sucesso dizendo que a notificação foi gerada com sucesso.

## Regras de Negócio - Cache de Requisições

Deve ser criado um cache de requisições para evitar requisições duplicadas. Para isso deve ser utilizado os parâmetros da requisição como chave e retorno final, caso já tenha sido processado e tenha sucesso, como valor.

O cache deve ter uma validade de 1 hora.

`product:ids:kind:type` - retorno final, caso já tenha sido processado e tenha sucesso.

---

**Exemplo:**

Se a requisição for feita com os seguintes parâmetros:

- product: boleto
- id: [1, 2, 3, 4]
- kind: webhook
- type: disponível

Então a chave gerada deve ser:

`boleto:1,2,3,4:webhook:disponível`

E o valor deve ser o retorno final de sucesso da requisição.

---

Somente caso a requisição já tenha sido processada e tenha sucesso, então deve ser criado o cache com a chave e o valor.

No caso de achar o cache, então deve ser retornado o valor do cache pois esse já foi processado e tem sucesso.

## Fluxo de Execução

1. Recebimento da requisição em `/reenviar`;
2. Validação das headers de SH e Cedente (Middleware);
3. Validação dos parâmetros;
4. Validação da regra de negócio;
5. Processamento da notificação;
6. Cache de requisições;
7. Retorno da requisição;
