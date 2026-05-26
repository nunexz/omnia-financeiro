# Open Finance - Estudo Aprofundado

## 1. O que é Open Finance?

Open Finance no Brasil é um sistema regulado pelo Banco Central que permite que clientes compartilhem seus dados financeiros com terceiros de forma segura e padronizada, através de APIs.

**Regulação:** Resolução nº 32/2020 do Banco Central (em implementação gradual)

**Status Brasil (2026):** 
- ✅ Fase 1-3: Operacional (dados básicos, contas, transações)
- ⏳ Fase 4+: Em desenvolvimento (operações mais complexas)

---

## 2. Instituições Participantes

### Bancos Grandes (100% compatíveis):
- Itaú, Bradesco, Caixa, Santander
- BB, BTG Pactual, Safra
- Nubank, Inter, Neon, Picpay
- Totalmente: ~140+ instituições em 2026

### Agregadores (oferecem interface única):
1. **Pluggy** (BR - recomendado)
   - SDKs: Node.js, Python, Go, PHP
   - Documentação em PT-BR
   - Suporte excelente
   - Preço: ~R$ 0,50 por conexão/mês (barato)

2. **Plaid** (EUA - melhor para internacional)
   - SDK completo
   - Mais caro
   - Menos enfoque em BR

3. **YodLee/Yext** (Índia)
   - Alternativa internacional

4. **Implementar direto** (sem intermediários)
   - Possível mas trabalhoso
   - Precisa integrar com cada banco separadamente

---

## 3. O que é possível acessar via Open Finance

### Dados já disponíveis (Fase 1-3):

```
CONTAS BANCÁRIAS:
├── Saldo atual
├── Extrato (últimos 90 dias)
├── Tipo de conta (corrente, poupança)
├── Agência/Conta
└── Status (ativa, bloqueada)

CARTÕES DE CRÉDITO:
├── Limite
├── Saldo devedor
├── Data de fechamento
└── Transações (últimos 90 dias)

EMPRÉSTIMOS/FINANCIAMENTOS:
├── Saldo devedor
├── Taxa de juros
├── Parcelas restantes
└── Data de vencimento

INVESTIMENTOS (parcial):
├── Saldo em CDB, LCI, LCA
├── Posição em ações (alguns bancos)
└── Fundos de investimento
```

### Dados em desenvolvimento (Fase 4+):

```
PREVIDÊNCIA PRIVADA
SEGUROS
OPERAÇÕES (transferências em tempo real)
CONSENTIMENTOS AVANÇADOS
```

---

## 4. Fluxo de Autenticação (OAuth 2.0)

### Passo a passo:

```
1. USUÁRIO CLICA "CONECTAR BANCO"
   ↓
2. APP REDIRECIONA PARA PLUGGY (ou agregador)
   URL: https://pluggy.com/auth?client_id=...&redirect_uri=...
   ↓
3. PLUGGY MOSTRA LISTA DE BANCOS
   Usuário seleciona "Itaú"
   ↓
4. PLUGGY REDIRECIONA PARA ITAÚ (credenciais do usuário)
   ↓
5. USUÁRIO FAZ LOGIN NO ITAÚ E AUTORIZA ACESSO
   "Aplicativo X quer acessar suas transações"
   ↓
6. ITAÚ REDIRECIONA DE VOLTA À PLUGGY
   ↓
7. PLUGGY REDIRECIONA DE VOLTA À NOSSA APP
   URL: https://meuapp.com/callback?code=abc123
   ↓
8. BACKEND TROCA "code" POR "access_token"
   POST https://pluggy.com/exchange
   ↓
9. BACKEND ARMAZENA access_token (criptografado) NO BD
   ↓
10. BACKEND USA access_token PARA BUSCAR DADOS
    GET https://api.pluggy.com/accounts
    GET https://api.pluggy.com/transactions
```

---

## 5. Arquitetura de Integração (Recomendada)

### Backend (Node.js):

```typescript
// .env
PLUGGY_CLIENT_ID=xxx
PLUGGY_CLIENT_SECRET=xxx
PLUGGY_REDIRECT_URI=https://meuapp.com/api/open-finance/callback

// routes/open-finance.ts
POST   /api/open-finance/connect
       → Gera URL de OAuth
       → Redireciona usuário

GET    /api/open-finance/callback?code=...
       → Troca code por access_token
       → Armazena no BD (criptografado)
       → Sincroniza transações iniciais
       → Redireciona para dashboard

GET    /api/open-finance/accounts
       → Lista contas conectadas

GET    /api/open-finance/transactions?accountId=...
       → Lista transações de uma conta

POST   /api/open-finance/sync
       → Busca novas transações (manual)

DELETE /api/open-finance/disconnect/:accountId
       → Desconecta conta
```

### Banco de Dados (Prisma):

```prisma
model BankConnection {
  id String @id @default(cuid())
  userId String
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  bankName String          // "Itaú", "Bradesco", etc.
  accountId String         // ID interno do agregador
  accountNumber String     // Conta do usuário
  accountType String       // "CHECKING", "SAVINGS"
  
  accessToken String       // Criptografado!
  refreshToken String?     // Se aplicável
  expiresAt DateTime?
  
  lastSyncedAt DateTime?   // Última sincronização
  syncStatus String        // "connected", "disconnected", "error"
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model BankTransaction {
  id String @id @default(cuid())
  connectionId String
  connection BankConnection @relation(fields: [connectionId], references: [id], onDelete: Cascade)
  
  bankTransactionId String  // ID único do agregador
  description String
  amount Decimal
  type String              // "DEBIT", "CREDIT"
  date DateTime
  
  // Mapeamento com nossos dados
  gastoVariavelId String?
  gastoVariavel GastoVariavel? @relation(fields: [gastoVariavelId], references: [id], onDelete: SetNull)
  
  // Status de revisão
  status String @default("pending_review") // pending_review, accepted, rejected
  category String?         // Categorização automática
  
  createdAt DateTime @default(now())
}

model GastoVariavel {
  // ... campos existentes ...
  bankTransactions BankTransaction[]
}
```

### Frontend (React):

```typescript
// Modal para conectar banco
<button onClick={() => {
  // Redireciona para /api/open-finance/connect
  window.location.href = '/api/open-finance/connect'
}}>
  🏦 Conectar Conta Bancária
</button>

// Após conectar, mostrar:
- Lista de contas conectadas
- Data última sincronização
- Botão "Sincronizar agora"
- Botão "Desconectar"

// Transações para revisar:
<div>
  <h3>10 transações aguardando revisão</h3>
  {transactions.map(t => (
    <div key={t.id}>
      <p>{t.description} - R$ {t.amount}</p>
      <select onChange={(e) => mapearCategoria(t.id, e.target.value)}>
        <option>Selecionar categoria</option>
        <option value="alimentacao">🍔 Alimentação</option>
        <option value="transporte">🚕 Transporte</option>
        <option value="saude">⚕️ Saúde</option>
        {/* ... mais categorias ... */}
      </select>
      <button onClick={() => aceitar(t.id)}>✅ Aceitar</button>
      <button onClick={() => rejeitar(t.id)}>❌ Rejeitar</button>
    </div>
  ))}
</div>
```

---

## 6. Fluxo de Sincronização Automática

### Cron Job (Backend):

```typescript
// Rodar todo dia às 7am
// services/open-finance-sync.ts

export async function syncAllBankConnections() {
  const connections = await prisma.bankConnection.findMany({
    where: { syncStatus: "connected" }
  })

  for (const conn of connections) {
    try {
      // 1. Buscar transações desde última sincronização
      const lastSync = conn.lastSyncedAt || new Date(Date.now() - 90*24*60*60*1000)
      
      const transactions = await pluggy.getTransactions(
        conn.accessToken,
        conn.accountId,
        { from: lastSync }
      )

      // 2. Criar BankTransaction com status "pending_review"
      for (const tx of transactions) {
        // Verificar se já existe
        const exists = await prisma.bankTransaction.findUnique({
          where: { bankTransactionId: tx.id }
        })
        
        if (!exists) {
          await prisma.bankTransaction.create({
            data: {
              connectionId: conn.id,
              bankTransactionId: tx.id,
              description: tx.description,
              amount: tx.amount,
              type: tx.type,
              date: new Date(tx.date),
              category: categorizeTransaction(tx.description), // ML ou regras
              status: "pending_review"
            }
          })
        }
      }

      // 3. Atualizar lastSyncedAt
      await prisma.bankConnection.update({
        where: { id: conn.id },
        data: { lastSyncedAt: new Date() }
      })

    } catch (error) {
      // Log erro
      await prisma.bankConnection.update({
        where: { id: conn.id },
        data: { syncStatus: "error" }
      })
    }
  }
}

// Schedule com node-cron
cron.schedule('0 7 * * *', () => syncAllBankConnections())
```

---

## 7. Categorização Automática

### Abordagem 1: Regras simples (fácil)

```typescript
function categorizeTransaction(description: string): string {
  const desc = description.toLowerCase()
  
  if (desc.includes('uber') || desc.includes('99') || desc.includes('taxi'))
    return 'transporte'
  
  if (desc.includes('carrefour') || desc.includes('extra') || desc.includes('mercado'))
    return 'alimentacao'
  
  if (desc.includes('farmacia') || desc.includes('hospital') || desc.includes('medico'))
    return 'saude'
  
  if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('prime'))
    return 'entretenimento'
  
  if (desc.includes('agua') || desc.includes('luz') || desc.includes('gas'))
    return 'utilidades'
  
  return 'outros'
}
```

### Abordagem 2: Machine Learning (futuro)

Usar biblioteca como **TensorFlow.js** ou chamar API de ML:
- Treinar com histórico do usuário
- Melhorar a categorização com o tempo
- Considerar valor, horário, descrição

---

## 8. Desafios e Soluções

### Desafio 1: Duplicação de dados

**Problema:**
```
Usuário adiciona manualmente: "Supermercado - R$ 150"
Sincroniza do banco: "Carrefour - R$ 150" (mesma transação)
Resultado: Aparece 2x
```

**Solução:**
```typescript
function isDuplicate(bankTx: BankTransaction, manualTx: GastoVariavel) {
  const sameDay = isSameDay(bankTx.date, manualTx.createdAt)
  const similarValue = Math.abs(bankTx.amount - manualTx.valor) < 0.01
  const similarDescription = similarity(bankTx.description, manualTx.descricao) > 0.7
  
  return sameDay && similarValue && similarDescription
}
```

### Desafio 2: Transferências interbancárias

**Problema:**
```
Conta Itaú: -R$ 1000 (transferência enviada)
Conta Bradesco: +R$ 1000 (transferência recebida)
Resultado: Sistema conta como R$ 2000 em gastos
```

**Solução:**
```typescript
// Marcar como "transfer" e não incluir em cálculos
if (isTransfer(bankTx.description)) {
  await prisma.bankTransaction.create({
    data: {
      // ...
      category: 'transfer',
      status: 'auto_accepted', // Não pedir revisão
      gastoVariavelId: null
    }
  })
}
```

### Desafio 3: Várias contas bancárias

**Solução:**
```typescript
// Dashboard com abas por conta
const connections = await bankConnectionAPI.getConnections()

connections.forEach(conn => {
  <Tab label={`${conn.bankName} - ${conn.accountNumber}`}>
    <TransactionsList connectionId={conn.id} />
  </Tab>
})
```

---

## 9. Fluxo UX Recomendado (Fase 6)

```
DASHBOARD
└─ Nova aba: "💳 Contas Bancárias"
   ├─ Botão: "🔗 Conectar Conta"
   │  └─ Ao clicar:
   │     1. Redireciona para OAuth
   │     2. Voltaao app com access_token
   │     3. Mostra "Sincronizando transações..." (loading)
   │     4. Mostra "10 transações aguardando revisão"
   │
   ├─ Seção: "Contas Conectadas"
   │  └─ Itaú (Conta 12345)
   │     ├─ Saldo: R$ 5.000
   │     ├─ Última sincronização: Hoje às 7:23am
   │     ├─ Botão: "🔄 Sincronizar agora"
   │     └─ Botão: "❌ Desconectar"
   │
   └─ Seção: "Transações para Revisar"
      └─ [Lista de 10 transações]
         ├─ Descrição: "CARREFOUR BARRA..."
         ├─ Valor: R$ 150,00
         ├─ Data: Hoje, 14:30
         ├─ Categoria: [Dropdown com sugestão "Alimentação"]
         ├─ ✅ Aceitar
         └─ ❌ Rejeitar
```

---

## 10. Implementação: Passo a Passo (Fase 6)

### Passo 1: Setup Pluggy (1-2 dias)
- [ ] Criar conta em pluggy.com
- [ ] Obter credentials (CLIENT_ID, CLIENT_SECRET)
- [ ] Instalar SDK Node.js
- [ ] Testar OAuth flow localmente

### Passo 2: Backend (3-4 dias)
- [ ] Criar tabelas Prisma (BankConnection, BankTransaction)
- [ ] Implementar rota `/api/open-finance/connect`
- [ ] Implementar rota `/api/open-finance/callback`
- [ ] Implementar rota `/api/open-finance/accounts`
- [ ] Implementar rota `/api/open-finance/transactions`
- [ ] Implementar cron job de sincronização
- [ ] Testes

### Passo 3: Frontend (2-3 dias)
- [ ] Criar modal "Conectar Banco"
- [ ] Criar aba "Contas Bancárias"
- [ ] Criar lista de "Transações para Revisar"
- [ ] Implementar lógica de aceitar/rejeitar
- [ ] Dark mode

### Passo 4: Testes (1-2 dias)
- [ ] Testar com conta de teste Pluggy
- [ ] Testar duplicação de dados
- [ ] Testar sincronização automática
- [ ] Testar com múltiplas contas

### Passo 5: Deploy (1 dia)
- [ ] Deploy no Railway/Render
- [ ] Adicionar credenciais Pluggy em produção
- [ ] Testar com banco real

---

## 11. Custo

```
PLUGGY:
- Setup: Gratuito
- Por conexão: ~R$ 0,50/mês (barato!)
- Exemplo: 10 usuários = ~R$ 5/mês

INFRAESTRUTURA:
- VPS: R$ 30-100/mês
- Banco de dados: R$ 10-50/mês
- (Será detalhado no guia de deploy)

TOTAL MENSAL: ~R$ 50-200 (muito barato!)
```

---

## 12. Próximas Pesquisas

- [ ] Criptografia de access_token no BD
- [ ] Tratamento de expiração de tokens
- [ ] Suporte a refresh tokens
- [ ] API de webhooks do Pluggy (notificações em tempo real)
- [ ] Compliance LGPD/GDPR

---

## Referências

- **Open Finance BR:** https://www.bcb.gov.br/estabilidadefinanceira/openfinance
- **Pluggy Docs:** https://docs.pluggy.com
- **Resolução BC nº 32/2020:** (no site do BC)
- **Especificação técnica Open Finance:** openfinance.br

---

**Status:** Documentação completa ✅
**Próximo passo:** Estudar criptografia de tokens + implementar em Fase 6
