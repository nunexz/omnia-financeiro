# 🚀 Guia de Deploy em Produção

## Resumo Executivo

Para colocar o **Omnia** em produção para uso pessoal no celular, você vai precisar de:

1. **Backend:** Railway ou Render (Node.js + Express)
2. **Banco de dados:** Railway PostgreSQL ou MySQL
3. **Frontend:** Vercel ou Netlify (React + Vite)
4. **PWA:** Hospedado junto ao frontend
5. **Domínio:** Opcional (começa com subdomínio gratuito)
6. **Total:** ~R$ 50-100/mês

---

## Opção Recomendada: Railway (Tudo em um lugar)

**Por que Railway?**
- ✅ Suporte total a Node.js + Banco em um lugar
- ✅ Deploy automático do Git
- ✅ Variáveis de ambiente fáceis
- ✅ Plano grátis com R$ 5/mês de crédito
- ✅ Muito mais barato que AWS
- ✅ Startup brasileira (suporte melhor)

**Custo:**
- Backend: ~R$ 50/mês
- Banco de dados: ~R$ 30/mês
- **Total: ~R$ 80/mês** (ou menos se usar créditos)

---

## Arquitetura Recomendada

```
┌─────────────────────────────────────────────┐
│           SEU CELULAR (Mobile)              │
│  App PWA: https://omnia.seu-dominio.com    │
└────────────┬────────────────────────────────┘
             │ HTTPS
             ↓
┌─────────────────────────────────────────────┐
│        FRONTEND (Vercel)                    │
│  React + Vite (SPA)                         │
│  Hosted em: https://omnia.seu-dominio.com  │
│  CDN Global (rápido)                        │
│  Deploy automático do main branch           │
└────────────┬────────────────────────────────┘
             │ API Calls
             ↓
┌─────────────────────────────────────────────┐
│        BACKEND (Railway)                    │
│  Node.js + Express                          │
│  API em: https://api.seu-dominio.com       │
│  Deploy automático do main branch           │
│  Uptime: 99.9%                              │
└────────────┬────────────────────────────────┘
             │ Queries
             ↓
┌─────────────────────────────────────────────┐
│        BANCO DE DADOS (Railway PostgreSQL)  │
│  PostgreSQL 15                              │
│  Backup automático                          │
│  Replicação                                 │
└─────────────────────────────────────────────┘
```

---

## Passo a Passo de Deploy

### FASE 1: Preparar Repositório Git (1 hora)

```bash
# 1. Criar repositório público no GitHub
cd ~/Desktop/Arquivos\ ERP/ERP\ Docs/Omnia\ Meu\ Bolso
git init
git remote add origin https://github.com/seu-usuario/omnia-financeiro.git
git branch -M main

# 2. Estrutura do repo:
omnia-financeiro/
├── backend/
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   ├── .env.example
│   └── tsconfig.json
├── web/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── .gitignore
└── README.md

# 3. .gitignore (importante!)
node_modules/
.env
.env.local
dist/
build/
*.log
.DS_Store

# 4. Commit inicial
git add .
git commit -m "Initial commit: Omnia Financeiro MVP"
git push -u origin main
```

### FASE 2: Setup Banco de Dados em Railway (30 min)

**1. Criar conta em railway.app**

```bash
# Instalar Railway CLI
npm install -g railway

# Login
railway login

# Criar projeto
cd ~/seu-projeto
railway init
```

**2. Adicionar PostgreSQL**

Via Dashboard (mais fácil):
- Novo Projeto → New Project
- Create new → Create new database
- Escolher PostgreSQL 15

**3. Conectar ao Prisma**

```bash
# Backend/.env
DATABASE_URL="postgresql://user:password@host:port/database"
JWT_SECRET="seu-secret-aleatorio-aqui"
VITE_API_URL="https://api.seu-dominio.com" (ou IP temporário)
```

**4. Rodar migrations**

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

### FASE 3: Deploy Backend em Railway (1 hora)

**1. Configurar package.json**

```json
{
  "name": "omnia-backend",
  "version": "1.0.0",
  "main": "dist/server.js",
  "scripts": {
    "dev": "ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.ts",
    "migrate": "prisma migrate deploy"
  },
  "engines": {
    "node": "20.x"
  },
  "dependencies": {
    "express": "^4.18.2",
    "@prisma/client": "^5.0.0",
    "dotenv": "^16.3.1",
    "jsonwebtoken": "^9.0.0",
    "axios": "^1.5.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "typescript": "^5.2.2",
    "@types/express": "^4.17.17",
    "@types/node": "^20.5.0",
    "ts-node": "^10.9.1"
  }
}
```

**2. Configurar Procfile**

```procfile
# backend/Procfile (ou Railway detecta automaticamente)
release: npx prisma migrate deploy
web: npm start
```

**3. Deploy via Railway Dashboard**

- Conectar repositório GitHub
- Selecionar branch `main`
- Railway faz build automático
- Após deploy, recebe URL: `https://omnia-backend-prod.up.railway.app`

**4. Configurar variáveis de ambiente**

Railway Dashboard → Variables
```
DATABASE_URL = (auto-preenchido)
JWT_SECRET = seu-secret-aleatorio-32-chars
NODE_ENV = production
VITE_API_URL = https://omnia-backend-prod.up.railway.app
```

### FASE 4: Deploy Frontend em Vercel (45 min)

**1. Preparar Frontend**

```bash
cd web

# vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
```

**2. Deploy via Vercel**

- Abrir https://vercel.com
- Conectar GitHub
- Selecionar repositório `omnia-financeiro`
- Selecionar pasta `web` como root
- Deploy automático!
- Recebe URL: `https://omnia-web.vercel.app`

**3. Variáveis de ambiente em Vercel**

Settings → Environment Variables
```
VITE_API_URL = https://omnia-backend-prod.up.railway.app
```

### FASE 5: Apontar Domínio (Opcional, 30 min)

Se quiser usar domínio próprio:

**Opção 1: Usar Vercel nameservers (mais fácil)**

1. Comprar domínio em Namecheap, GoDaddy, Registro.br
2. Vercel → Settings → Domains → Adicionar domínio
3. Apontar nameservers para Vercel
4. Automaticamente Railway também funciona

**Opção 2: Apontar manualmente (DNS)**

```
Namecheap (ou seu registrador)

Frontend (Vercel):
omnia.seu-dominio.com  → CNAME → cname.vercel.app

API (Railway):
api.seu-dominio.com    → CNAME → seu-dominio-backend.railway.app
```

---

## Configuração Final do Backend

### 1. CORS (permitir requisições do frontend)

```typescript
// backend/src/server.ts
import cors from 'cors'

const app = express()

app.use(cors({
  origin: [
    'https://omnia.seu-dominio.com',
    'https://omnia-web.vercel.app',
    'http://localhost:3000' // desenvolvimento
  ],
  credentials: true
}))
```

### 2. Healthcheck (para Railway monitorar)

```typescript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})
```

### 3. Logs (Railway coleta automaticamente)

```typescript
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`)
  next()
})
```

---

## PWA para Mobile (Já habilitado!)

Seu app já tem PWA configurado se tem `public/manifest.json`:

```json
{
  "name": "Omnia Controle Financeiro",
  "short_name": "Omnia",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#f97316",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Para instalar no celular:**
1. Abrir no navegador: https://omnia.seu-dominio.com
2. Menu → "Adicionar à tela inicial" (Android)
3. Menu → "Adicionar à Home" (iOS)
4. Usa como app nativo!

---

## Checklist de Deployment

### Antes de Deploy

- [ ] Git commit limpo (sem arquivos temporários)
- [ ] `.env.example` preenchido
- [ ] `package.json` com `engines: "node": "20.x"`
- [ ] Prisma schema em `prisma/schema.prisma`
- [ ] Teste local com `npm run dev` funcionando
- [ ] TypeScript sem erros: `npx tsc --noEmit`

### Na Railway (Backend)

- [ ] Projeto criado
- [ ] PostgreSQL adicionado
- [ ] Variáveis de ambiente configuradas
- [ ] Primeira migration executada
- [ ] Health check respondendo

### Na Vercel (Frontend)

- [ ] Repositório conectado
- [ ] Branch `main` selecionado
- [ ] Pasta raiz: `web`
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Variáveis de ambiente configuradas

### Domínio (Opcional)

- [ ] DNS apontando para Vercel (frontend)
- [ ] DNS apontando para Railway (API)
- [ ] HTTPS funcionando (automático em ambos)

### Final

- [ ] Testar login no celular
- [ ] Adicionar à tela inicial
- [ ] Modo offline funciona
- [ ] Dados sendo salvos no BD
- [ ] Projeção Anual carregando

---

## Monitoramento em Produção

### Railway Dashboard

Acompanhar:
- ✅ CPU/Memória do backend
- ✅ Conexões ao banco
- ✅ Logs em tempo real
- ✅ Uptime

```bash
# Ver logs ao vivo
railway logs --follow
```

### Vercel Analytics

Acompanhar:
- ✅ Tempo de carregamento
- ✅ Erros de cliente
- ✅ Performance

---

## Troubleshooting

### "Cannot connect to database"

```bash
# Verificar variável DATABASE_URL em Railway
# Reconectar:
railway unlink
railway link
```

### "Cors error: Origin not allowed"

```bash
# Atualizar CORS no backend
const allowedOrigins = [
  'https://seu-novo-dominio.com',
  process.env.FRONTEND_URL
]
```

### "Blank page on mobile"

```bash
# Verificar em http://localhost:3000 primeiro
# Se funciona local mas não na Vercel, checar:
1. Build logs na Vercel
2. VITE_API_URL correto
3. Console do celular (F12)
```

---

## Próximos Passos (Homologação)

```
1. Deploy inicial: ✅ Hoje/amanhã
2. Usar pessoalmente no celular: 1-2 semanas
3. Coletar feedback: 1-2 semanas
4. Correções de bugs: 1-2 semanas
5. Implementar Open Finance (Fase 6): 1 mês
6. Adicionar MercadoPago (Monetização): 2 semanas
7. Publicar na Play Store/App Store: 2 semanas
```

---

## Estimativa de Custos Mensais

```
RAILWAY (Backend + DB):         R$ 50-100
VERCEL (Frontend):              R$ 0 (free tier)
DOMÍNIO:                        R$ 40 (uma vez/ano)
---
TOTAL MENSAL:                   ~R$ 50-100
```

**Comparação:**
- Tradicional VPS: R$ 100-300/mês
- Você pagando: ~R$ 5 por usuário real
- Você sozinho: praticamente grátis!

---

## Documentação Útil

- Railway: https://docs.railway.app
- Vercel: https://vercel.com/docs
- Prisma: https://www.prisma.io/docs
- PWA: https://web.dev/progressive-web-apps

---

**Status:** Pronto para deploy ✅  
**Tempo estimado:** 3-4 horas  
**Dificuldade:** Média (já tem bom setup, é só apontar)
