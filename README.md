# Omnia - Sistema de Controle Financeiro

Sistema de controle financeiro multi-usuário para web e mobile, permitindo gerenciar gastos, dívidas, investimentos e outras operações financeiras.

## 🚀 Tecnologias

### Backend
- **Node.js** 20+
- **Express.js** - Framework web
- **Prisma** - ORM para banco de dados
- **MySQL** 8.0+ - Banco de dados
- **Google OAuth 2.0** - Autenticação
- **TOTP** - Autenticação de dois fatores

### Frontend Web
- **React** 18+ com TypeScript
- **Vite** - Bundler
- **Tailwind CSS** - Styling
- **React Router** - Roteamento
- **TanStack Query** - Gerenciamento de estado
- **Zustand** - State management

## 📦 Estrutura do Projeto

```
omnia-financeiro/
├── backend/          # API Node.js/Express
│   ├── src/
│   ├── prisma/       # Schema e migrations
│   └── package.json
├── web/              # Frontend React
│   ├── src/
│   ├── public/
│   └── package.json
├── mobile/           # Frontend Mobile (React Native - Fase 5)
└── README.md
```

## 🛠️ Setup Rápido

### Prerequisites
- Node.js 20+
- MySQL 8.0+
- Git

### Backend

1. Entre na pasta backend:
```bash
cd backend
```

2. Crie arquivo `.env` baseado em `.env.example`:
```bash
cp .env.example .env
```

3. Configure as variáveis de ambiente:
```
DATABASE_URL="mysql://user:password@localhost:3306/omnia_financeiro"
JWT_SECRET="sua-chave-super-secreta"
GOOGLE_CLIENT_ID="seu-google-client-id"
GOOGLE_CLIENT_SECRET="seu-google-client-secret"
```

4. Instale dependências:
```bash
npm install
```

5. Execute as migrations do Prisma:
```bash
npm run prisma:migrate
```

6. Inicie o servidor:
```bash
npm run dev
```

O servidor rodará em `http://localhost:5000`

### Frontend Web

1. Entre na pasta web:
```bash
cd web
```

2. Crie arquivo `.env` baseado em `.env.example`:
```bash
cp .env.example .env
```

3. Configure as variáveis de ambiente:
```
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=seu-google-client-id
```

4. Instale dependências:
```bash
npm install
```

5. Inicie o dev server:
```bash
npm run dev
```

A aplicação rodará em `http://localhost:5173`

## 📋 Features Implementadas

### Fase 1: Setup Inicial ✅
- [x] Estrutura base (Git, Backend, Frontend)
- [x] Autenticação Google OAuth
- [x] Autenticação de dois fatores (TOTP)
- [x] Store Zustand para autenticação
- [x] Tipos TypeScript
- [x] Middleware de autenticação

### Fase 2: Core Features (Em desenvolvimento)
- [ ] Dashboard com métricas
- [ ] CRUD Rendas
- [ ] CRUD Gastos Fixos
- [ ] CRUD Dívidas
- [ ] CRUD Gastos Variáveis

### Fase 3: Admin + Ferramentas
- [ ] Admin Panel
- [ ] Calculadora de Salário Líquido
- [ ] Calculadora de 13º
- [ ] Calculadora de Férias
- [ ] Calculadora de Rescisão
- [ ] Perfil do usuário

### Fase 4: Mobile
- [ ] PWA ou React Native

## 📱 Isolamento de Dados

O sistema usa **single-database multi-tenant** com isolamento via `userId`:
- Cada usuário vê apenas seus dados
- Middleware `authenticate` valida token JWT
- Todas as queries filtram por `userId` automaticamente
- Admin pode visualizar dados de outros usuários (com auditoria)

## 🔐 Segurança

- **JWT** para autenticação
- **TOTP** para 2FA
- **Bcrypt** para hash de senhas
- **CORS** configurado
- **SQL Injection prevention** via Prisma
- **Isolamento de dados** por tenant

## 🤝 Contribuindo

Este é um projeto em desenvolvimento. As contribuições seguem o plano de fases em `PLAN.md`.

## 📄 Licença

ISC

## 👤 Autor

Omnia Financeiro Team

---

**Status**: Fase 1 completa - Setup inicial com autenticação funcional ✅
