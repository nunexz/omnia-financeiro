# 🚀 Guia de Setup - Omnia Financeiro

Este guia detalha como configurar o ambiente para desenvolvimento do Omnia Financeiro.

## 📋 Pré-requisitos

- **Node.js 20+** - [Download](https://nodejs.org/)
- **MySQL 8.0+** - [Download](https://dev.mysql.com/downloads/mysql/)
- **Git** - [Download](https://git-scm.com/)
- **Conta Google** - Para OAuth

## 🗄️ 1. Configurar MySQL

### Windows (usando MySQL 8.0)

1. **Instale MySQL** (se ainda não tiver):
   - Download: https://dev.mysql.com/downloads/mysql/
   - Siga as instruções de instalação padrão
   - Anote o usuário (padrão: `root`) e senha que definir

2. **Crie o banco de dados**:
   ```bash
   mysql -u root -p
   ```
   (Digite sua senha)

   ```sql
   CREATE DATABASE omnia_financeiro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   EXIT;
   ```

3. **Verifique a conexão**:
   ```bash
   mysql -u root -p -e "USE omnia_financeiro; SHOW TABLES;"
   ```

## 🔑 2. Configurar Google OAuth

### Criar Projeto no Google Cloud

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto:
   - Clique em "Select a Project"
   - Clique em "NEW PROJECT"
   - Nome: `Omnia Financeiro`
   - Crie o projeto

3. **Configure a tela de consentimento OAuth**:
   - Vá para "APIs & Services" → "OAuth consent screen"
   - Escolha "External" como tipo de usuário
   - Preencha:
     - App name: `Omnia Financeiro`
     - User support email: seu-email@gmail.com
     - Developer contact: seu-email@gmail.com
   - Salve e continue

4. **Crie credenciais OAuth 2.0**:
   - Vá para "Credentials"
   - Clique em "Create Credentials" → "OAuth client ID"
   - Tipo de aplicação: "Web application"
   - Nome: `Web Client`
   - URIs de redirecionamento autorizados:
     ```
     http://localhost:5000/auth/google/callback
     http://localhost:5173/
     ```
   - Crie as credenciais
   - Copie o **Client ID** e **Client Secret**

## ⚙️ 3. Configurar Backend

1. **Entre na pasta backend**:
   ```bash
   cd backend
   ```

2. **Crie o arquivo `.env`**:
   ```bash
   cp .env.example .env
   ```

3. **Edite `.env`** com suas informações:
   ```env
   # Database
   DATABASE_URL="mysql://root:sua-senha@localhost:3306/omnia_financeiro"

   # JWT
   JWT_SECRET="use-uma-chave-super-secreta-aqui-min-32-caracteres"
   JWT_EXPIRES_IN="7d"

   # Google OAuth (obtido no passo anterior)
   GOOGLE_CLIENT_ID="seu-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="seu-client-secret"
   GOOGLE_REDIRECT_URI="http://localhost:5000/auth/google/callback"

   # Server
   PORT=5000
   NODE_ENV="development"

   # CORS
   FRONTEND_URL="http://localhost:5173"

   # 2FA
   TOTP_WINDOW=1
   ```

4. **Instale dependências**:
   ```bash
   npm install
   ```

5. **Execute migrations Prisma**:
   ```bash
   npm run prisma:migrate dev
   ```

6. **Inicie o servidor**:
   ```bash
   npm run dev
   ```
   
   Você verá:
   ```
   ✅ Server running on http://localhost:5000
   ```

## ⚙️ 4. Configurar Frontend

1. **Entre na pasta web** (em outro terminal):
   ```bash
   cd web
   ```

2. **Crie o arquivo `.env`**:
   ```bash
   cp .env.example .env
   ```

3. **Edite `.env`**:
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_GOOGLE_CLIENT_ID="seu-client-id.apps.googleusercontent.com"
   ```

4. **Instale dependências**:
   ```bash
   npm install
   ```

5. **Inicie o dev server**:
   ```bash
   npm run dev
   ```
   
   O navegador abrirá em `http://localhost:5173` automaticamente

## ✅ 5. Testar

1. Abra `http://localhost:5173/login`
2. Clique em "Entrar com Google"
3. Faça login com sua conta Google
4. Configure o 2FA (escaneie o QR code com Google Authenticator)
5. Você será redirecionado ao dashboard

## 🛠️ Comandos Úteis

### Backend

```bash
# Dev server com hot reload
npm run dev

# Visualizar banco de dados
npm run prisma:studio

# Criar migration manual
npm run prisma:migrate dev --name nome_da_migration

# Reset banco de dados (cuidado!)
npm run prisma:migrate reset

# TypeCheck
npm run typecheck
```

### Frontend

```bash
# Dev server
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview

# TypeCheck
npm run typecheck
```

## 🐛 Troubleshooting

### Erro: "Connection refused" no MySQL
- Verifique se MySQL está rodando
- Windows: Services → MySQL80 (deve estar "Running")
- Verifique credentials no `.env`

### Erro: "Invalid CLIENT_ID"
- Verifique se o Google Client ID está correto
- Confirme que está em `.env` do backend E frontend
- Regenere as credenciais se necessário

### Erro: "Cannot GET /api/..."
- Verifique se o backend está rodando em `localhost:5000`
- Verifique `FRONTEND_URL` no `.env` do backend

### Erro: "localStorage is not defined"
- Erro normal durante SSR/build
- Frontend funciona normalmente no navegador

## 📚 Próximos Passos

Após setup bem-sucedido:

1. **Fase 2**: Implementar Dashboard com CRUD de gastos
2. **Fase 3**: Admin Panel + Ferramentas
3. **Fase 4**: Mobile (PWA/React Native)

Ver `PLAN.md` para detalhes completos do roadmap.

## 💡 Dicas

- Guarde a chave JWT_SECRET em segurança
- Nunca faça commit de `.env` (está em `.gitignore`)
- Use Google Authenticator ou Microsoft Authenticator para 2FA
- Para produção, configure HTTPS e variáveis de ambiente seguras

---

**Pronto para desenvolver!** 🎉
