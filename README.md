# Blue-ERP Backend

Sistema de gestão empresarial (ERP) para restaurantes e PDV desenvolvido com NestJS, Prisma e MySQL.

## Tecnologias

- Node.js + TypeScript
- NestJS
- Prisma ORM
- MySQL
- Swagger

## Estrutura

```
src/
├── users/          # Gestão de usuários
├── company/        # Dados da empresa
├── clients/        # Cadastro de clientes
├── common/         # Utilitários
└── database/       # Configuração Prisma
```

## Configuração Rápida

1. **Instalar dependências**
```bash
npm install
```

2. **Configurar `.env`**
```env
DATABASE_URL="mysql://root:senha@localhost:3306/blue_erp"
PORT=3000
```

3. **Gerar Prisma Client e criar banco**
```bash
npm run prisma:generate
npm run prisma:migrate
```

4. **Rodar projeto**
```bash
npm run start:dev
```

## Documentação API

Swagger disponível em: `http://localhost:3000/api`

## Principais Endpoints

**Usuários**
- `POST /users` - Criar
- `GET /users` - Listar
- `PATCH /users/:id` - Atualizar
- `DELETE /users/:id` - Remover

**Empresa**
- `POST /company` - Configurar
- `GET /company` - Buscar dados
- `PATCH /company` - Atualizar

**Clientes**
- `POST /clients` - Cadastrar
- `GET /clients` - Listar (com paginação)
- `GET /clients/search?name=` - Buscar
- `PATCH /clients/:id` - Atualizar
- `DELETE /clients/:id` - Remover

## Recursos

✅ CRUD completo para usuários, empresa e clientes

✅ Validações em português

✅ Hash de senhas (bcrypt)

✅ Soft delete

✅ Paginação

✅ Busca por nome, CPF e telefone


## Scripts Úteis

```bash
npm run start:dev          # Desenvolvimento
npm run prisma:generate    # Gera o Prisma Client (necessário após alterar schema.prisma)
npm run prisma:migrate     # Cria migration e aplica no banco (cria o banco automaticamente)
npm run prisma:studio      # Abre interface visual do banco de dados
npm run prisma:reset       # Reseta o banco (apaga tudo e recria do zero)
```

## Próximos Passos

- Autenticação JWT
- Produtos e estoque
- Vendas/Pedidos
- Módulo financeiro
- Relatórios

---

**BlueTech Informática** - Sistema Blue-ERP