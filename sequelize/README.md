# Relationships

No sistema olhamos para os produtos do Plug Boleto (Boletos, Pagamentos, Pix, etc.). Onde cada produto é um serviço dentro do sistema.

## Overview

```sh
SoftwareHouse (1) ──< Cedente (N)
Cedente (1) ──< Conta (N)
Conta (1) ──< Convenio (N)
Convenio (1) ──< Servico (N)
Cedente (1) ──< WebhookReprocessado (N)

Note: WebhookReprocessado.servico_id is a JSON string (array of service IDs) and has no FK to Servico directly.
```

### Mermaid

```mermaid
erDiagram
  SoftwareHouse ||--o{ Cedente : "has many"
  Cedente       ||--o{ Conta   : "has many"
  Conta         ||--o{ Convenio: "has many"
  Convenio      ||--o{ Servico : "has many"
  Cedente       ||--o{ WebhookReprocessado : "has many"

  %% Nota: WebhookReprocessado.servico_id guarda IDs de Servico como JSON string (sem FK)

  SoftwareHouse {
    int id
    date data_criacao
    string cnpj
    string token
    string status
  }

  Cedente {
    int id
    date data_criacao
    string cnpj
    string token
    string status
    int softwarehouse_id
    string configuracao_notificacao
  }

  Conta {
    int id
    date data_criacao
    string produto
    string banco_codigo
    string status
    string configuracao_notificacao
    int cedente_id
  }

  Convenio {
    int id
    string numero_convenio
    date data_criacao
    int conta_id
  }

  Servico {
    int id
    string produto
    date data_criacao
    string status
    int convenio_id
  }

  WebhookReprocessado {
    string id
    date data_criacao
    string data
    string kind
    string type
    int cedente_id
    string servico_id
    string protocolo
  }
```

## Nomenclatura

- `SoftwareHouse`: Software House (SH) é a empresa que vai implementar o sistema do Plug Boleto.
- `Cedente`: Cedente é quem vai emitir os boletos para o Sacado fazer o pagamento
- `Conta`: Conta é a conta do Cedente que vai receber o pagamento do Sacado
- `Convenio`: Convenio é a carteira da conta do Cedente
- `Servico`: Servico é o serviço que vai ser executado pelo Plug Boleto (Ele representa o produto: Boletos, Pagamentos, Pix, etc.)
- `WebhookReprocessado`: Webhook Reprocessado é o webhook que foi reprocessado e salvo no banco de dados junto ao protocolo de retorno.
