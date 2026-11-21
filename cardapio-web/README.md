# cardapio-web

Front público do cardápio digital do Blue ERP. Projeto Angular novo, separado do `frontend/` (Tauri).

## Escopo

- Somente páginas públicas, para o consumidor final.
- Mobile-first, com boa usabilidade no desktop.
- Sem autenticação: consome apenas rotas `/api/public/*` do backend.

## Contexto

| Projeto            | O que muda                                                                          |
| ------------------ | ----------------------------------------------------------------------------------- |
| `cardapio-web`     | Este projeto: páginas públicas do cardápio.                                         |
| `backend`          | Novo módulo (`online-menu`) com as rotas públicas e o gerenciamento do cardápio.    |
| `frontend` (Tauri) | Ajustes para gerenciar pedidos pelo computador. Depois será refatorado para mobile. |

## Requisitos

- Node.js compatível com Angular 21 (conferir `engines` no `package.json` após criar o projeto).
- Backend rodando em `http://localhost:3000` (API em `/api`).

## Iniciar

```bash
# Criar o projeto (uma vez)
npm install -g @angular/cli
ng new cardapio-web
cd cardapio-web
ng generate environments

# Desenvolvimento
ng serve

# Testar no celular (mesma rede)
ng serve --host 0.0.0.0

# Build
ng build
```

Configurar a URL da API em `src/environments/` (dev: `http://localhost:3000/api`).

## API

- `GET /api/public/menu`: categorias e produtos ativos.

## Convenções

- Standalone components e signals.
- Sem guards nem interceptor de autenticação.
- Layout pensado primeiro para tela de celular.

## Pendências

- Definir as páginas.
- Definir os estilos.
- Definir onde o front é hospedado (servido pelo backend ou separado).
- Nome comercial e domínio.
- Sugestão cliente.pedeblue.com.br
