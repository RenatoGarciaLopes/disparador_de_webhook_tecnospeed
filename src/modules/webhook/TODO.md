## 📊 RELATÓRIO DE IMPLEMENTAÇÃO - Endpoint /reenviar

### ✅ **O QUE JÁ ESTÁ PRONTO** (com testes unitários)

#### 1. **Estrutura Base**

- ✅ Estrutura de pastas (domain, application, infrastructure, interfaces)
- ✅ Rota configurada (`ReenviarRoutes.ts` + testes)
- ✅ Esqueleto dos arquivos principais criados

#### 2. **Middlewares Parcialmente Implementados**

- ⚠️ `validate-auth-headers.ts` - Tem estrutura mas **TODO indica lógica incompleta**
  - Não valida SH (Software House) no banco
  - Não valida Cedente no banco
  - Não verifica se estão inativos
  - Retorna valores mockados (hardcoded)
- ✅ `validate-body.ts` - Funciona mas depende do schema incompleto

#### 3. **Presenters com Valores Hardcoded**

- ⚠️ `boleto.ts` + testes - Implementado mas com valores fixos
- ⚠️ `pagamentos.ts` + testes - Implementado mas com valores fixos
- ⚠️ `pix.ts` + testes - Implementado mas com valores fixos
- **Problema**: Não usam dados reais do `Servico` e `configuracaoNotificacao`

#### 4. **Repository**

- ✅ `ServicoRepository.ts` + testes - Parece completo

---

### ❌ **O QUE FALTA IMPLEMENTAR/COMPLETAR**

#### 🔴 **CRÍTICO - Completar Lógica de Negócio (RED/TODO)**

##### 1. **ReenviarSchema.ts** ⚠️ INCOMPLETO

```typescript
// ATUAL: Usa z.any() em tudo
// FALTA: Validações completas conforme doc
```

**Precisa:**

- Validar `product` como enum (boleto, pagamento, pix)
- Validar `id` como array de strings numéricas (max 30 itens)
- Validar `kind` como enum (webhook)
- Validar `type` como enum (disponível, cancelado, pago)

##### 2. **validate-auth-headers.ts** ⚠️ TODO

**Precisa implementar:**

- Buscar SH no banco por CNPJ e TOKEN
- Validar se SH está ativo
- Buscar Cedente no banco por CNPJ e TOKEN
- Validar se Cedente está ativo
- Validar se Cedente pertence à SH
- Testes de integração com banco de dados

##### 3. **ValidarServicosUseCase.ts** ⚠️ RED/TODO

**Precisa implementar:**

- Validar se todos IDs existem na tabela Servico
- Validar se todos Serviços estão ativos
- Validar se Cedente corresponde aos Serviços
- Validar se produto corresponde ao `data.product`
- Validar se situação corresponde ao `data.type` (usando Tabela de Situações)
- Agrupar erros e lançar `InvalidFieldsError`
- Testes unitários para todas validações

##### 4. **ConfiguracaoNotificacaoService.ts** ⚠️ RED/TODO

**Precisa implementar:**

- Priorizar configuração da Conta sobre Cedente
- Lógica correta de fallback
- Testes unitários

##### 5. **ConfigurarNotificacaoUseCase.ts** ⚠️ RED/TODO

**Precisa implementar:**

- Agrupar serviços por configuração de notificação
- Usar `ConfiguracaoNotificacaoService.getFromServico()`
- Retornar array de `GrupoServicos[]`
- Testes unitários

##### 6. **ReenviarService.ts** ⚠️ RED/TODO

**Precisa implementar:**

- Gerar UUID para cada webhook reprocessado
- Validar serviços (chamar ValidarServicosUseCase)
- Obter configuração (chamar ConfigurarNotificacaoUseCase)
- Criar presenters baseado no produto
- Chamar `toPayload()` em cada presenter
- Retornar payloads prontos
- Testes unitários

##### 7. **ReenviarController.ts** ⚠️ RED/TODO

**Precisa implementar:**

- Instanciar use cases e services
- Executar validações
- **Enviar payloads para TechnoSpeed API**
- **Salvar protocolos no WebhookReprocessado**
- Retornar resposta de sucesso estruturada
- Tratamento de erros adequado
- Testes unitários

##### 8. **Presenters** - Corrigir Valores Hardcoded

**Precisa atualizar:**

- `boleto.ts` - Usar dados reais de `serv

**Precisa atualizar:**

- `boleto.ts` - Usar dados reais de `servico`, `configuracaoNotificacao`, mapear situação
- `pagamentos.ts` - Usar dados reais de `servico`, `configuracaoNotificacao`, mapear situação
- `pix.ts` - Usar dados reais de `servico`, `configuracaoNotificacao`, mapear situação

---

#### 🔴 **CRÍTICO - Componentes Inexistentes**

##### 9. **TechnoSpeedApiClient** ❌ NÃO EXISTE

**Precisa criar:**

- Cliente HTTP para enviar payloads para `https://plug-retry.free.beeceptor.com`
- Método POST que retorna UUID de protocolo
- Interface de resposta
- Tratamento de erros
- Testes unitários e de integração
- **Localização sugerida:** `src/modules/webhook/infrastructure/http/TechnoSpeedApiClient.ts`

##### 10. **WebhookReprocessadoRepository** ❌ NÃO EXISTE

**Precisa criar:**

- Repository para salvar na tabela `WebhookReprocessado`
- Método para salvar `protocolo` e `data` (JSON)
- Testes unitários
- **Localização sugerida:** `src/modules/webhook/infrastructure/database/repositories/WebhookReprocessadoRepository.ts`
- **Nota:** O model já existe em `sequelize/models/webhookreprocessado.model.ts`

##### 11. **CacheService/Repository** ❌ NÃO EXISTE

**Precisa criar:**

- Sistema de cache com chave `product:ids:kind:type`
- Validade de 1 hora
- Salvar/buscar resultados de requisições bem-sucedidas
- Testes unitários
- **Localização sugerida:** `src/modules/webhook/infrastructure/cache/ReenviarCacheService.ts`
- **Tecnologia:** Redis, Memory Cache, ou outra solução

##### 12. **SoftwareHouseRepository** ❌ NÃO EXISTE

**Precisa criar:**

- Repository para buscar SH por CNPJ e TOKEN
- Método para validar autenticação
- Testes unitários
- **Localização sugerida:** `src/shared/repositories/SoftwareHouseRepository.ts` ou dentro do módulo webhook

##### 13. **CedenteRepository** ❌ NÃO EXISTE (ou não está no módulo webhook)

**Precisa criar/localizar:**

- Repository para buscar Cedente por CNPJ e TOKEN
- Método para validar autenticação e associação com SH
- Testes unitários
- **Localização sugerida:** `src/shared/repositories/CedenteRepository.ts` ou dentro do módulo webhook

---

### 📋 **CHECKLIST DE IMPLEMENTAÇÃO POR PRIORIDADE**

#### **FASE 1: Validações Básicas** (Necessário para qualquer teste E2E)

- [ ] 1.1 Completar `ReenviarSchema.ts` com validações Zod
- [ ] 1.2 Criar `SoftwareHouseRepository.ts` + testes
- [ ] 1.3 Criar `CedenteRepository.ts` + testes
- [ ] 1.4 Completar `validate-auth-headers.ts` + testes integração
- [ ] 1.5 Testes de integração para validações de headers

#### **FASE 2: Lógica de Validação de Serviços**

- [ ] 2.1 Implementar `ValidarServicosUseCase.ts` completo
- [ ] 2.2 Testes unitários para todas validações de serviços
- [ ] 2.3 Testes de integração com banco

#### **FASE 3: Configuração de Notificação**

- [ ] 3.1 Implementar `ConfiguracaoNotificacaoService.ts` (priorizar Conta)
- [ ] 3.2 Testes unitários
- [ ] 3.3 Implementar `ConfigurarNotificacaoUseCase.ts` (agrupamento)
- [ ] 3.4 Testes unitários para agrupamento

#### **FASE 4: Presenters e Payload**

- [ ] 4.1 Atualizar `boleto.ts` com dados reais + mapear situações
- [ ] 4.2 Atualizar `pagamentos.ts` com dados reais + mapear situações
- [ ] 4.3 Atualizar `pix.ts` com dados reais + mapear situações
- [ ] 4.4 Atualizar testes dos presenters
- [ ] 4.5 Implementar `ReenviarService.ts` completo
- [ ] 4.6 Testes unitários do ReenviarService

#### **FASE 5: Integração Externa e Persistência**

- [ ] 5.1 Criar `TechnoSpeedApiClient.ts`
- [ ] 5.2 Testes unitários (com mock)
- [ ] 5.3 Testes de integração (opcional, com API real/mock server)
- [ ] 5.4 Criar `WebhookReprocessadoRepository.ts`
- [ ] 5.5 Testes unitários do repository

#### **FASE 6: Controller e Orquestração**

- [ ] 6.1 Implementar `ReenviarController.ts` completo
- [ ] 6.2 Testes unitários do controller
- [ ] 6.3 Testes de integração da rota completa

#### **FASE 7: Cache (Última Prioridade)**

- [ ] 7.1 Criar `ReenviarCacheService.ts`
- [ ] 7.2 Testes unitários do cache
- [ ] 7.3 Integrar cache no controller
- [ ] 7.4 Testes de integração com cache

---

### 📊 **ESTATÍSTICAS**

**Arquivos no módulo webhook:**

- Total de arquivos `.ts`: 25
- Total de arquivos `.test.ts`: 12
- Arquivos com TODO/RED: 6

**Status de Implementação:**

- ✅ Completos: ~30%
- ⚠️ Parciais (precisam completar): ~40%
- ❌ Não iniciados: ~30%

**Componentes Faltantes Críticos:**

1. TechnoSpeedApiClient
2. WebhookReprocessadoRepository
3. CacheService
4. SoftwareHouseRepository
5. CedenteRepository

**Estimativa de Trabalho Restante:**

- **Alta prioridade** (FASE 1-6): ~15-20 arquivos para implementar/corrigir
- **Média prioridade** (FASE 7): ~3-4 arquivos para cache
- **Total de testes unitários faltantes**: ~8-10 arquivos novos + correções em 6 existentes
- **Testes de integração E2E**: Falta criar (rota completa + banco + API externa)

---

### 🎯 **RECOMENDAÇÕES**

1. **Começar pela FASE 1** - Sem validações de headers funcionando, nada funciona
2. **Criar repositories primeiro** - SoftwareHouse e Cedente são dependências críticas
3. **Implementar em TDD** - Os testes já existem para guiar a implementação
4. **Cache por último** - Funcionalidade secundária, não bloqueia fluxo principal
5. **Criar teste E2E completo** - Após FASE 6, criar um teste de integração que percorre todo o fluxo
