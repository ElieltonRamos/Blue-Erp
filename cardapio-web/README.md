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


## Configuracao

A configuração de um produto tem duas partes: os dados básicos e os grupos de opções.

1. Dados básicos do Product

Campo	Significado
price	Preço base, usado no cálculo. No "Monte seu lanche" é 0.
startingPrice	Se não for null, o cardápio mostra "A partir de R$ X" no lugar do preço. É só exibição.
available	Se for false, o card fica cinza e não abre.
featured	Aparece no carrossel "Promoção".
optionGroups	Lista de grupos de opções. [] = produto simples.

2. Grupo de opções (OptionGroup)

Cada grupo é uma pergunta feita ao cliente, como "Escolha seu pão" ou "Adicionais".

Campo	Significado
type	single: escolhe uma opção (radio). multiple: escolhe várias, com quantidade (+ / −).
min	Mínimo de unidades somadas no grupo. 0 = opcional; > 0 = obrigatório.
max	Máximo de unidades somadas no grupo (o "0/20"). null = sem limite.
maxPerOption	Máximo de unidades de uma mesma opção (ex.: até 10 ovos). null = sem limite.
options	As opções: name, price (acréscimo por unidade) e available.

3. Exemplos do mock

Guaraná: optionGroups: []. Só abre a tela com observação e quantidade.
Misto especial: um grupo "Adicionais no Lanche", multiple, min: 3, max: 20, maxPerOption: 10. O cliente precisa escolher pelo menos 3 unidades, somando todas as opções do grupo.
Monte seu lanche: dois grupos.
"Escolha seu Pão": single, min: 1, max: 1.
"Adicionais": multiple, min: 3.
price: 0 e startingPrice: 5.5.

4. Como a tela usa isso

Badges: 0/20 mostra a contagem do grupo e o max. "Obrigatório" aparece se min > 0. "Mínimo N" aparece se min > 1.
Botão "Adicionar": só habilita quando todo grupo cumpre min ≤ contagem ≤ max.
Botão +: desabilita ao atingir max do grupo ou maxPerOption da opção.
Preço do item: price + soma de (preço da opção × quantidade). O total da linha é isso × a quantidade do produto.

5. Pontos de atenção

O min conta unidades somadas no grupo, não opções diferentes. No Misto especial, 3 ovos já satisfazem o mínimo.
O startingPrice é informado pelo backend. O front não o calcula.
O ng-state do HTML original tinha required: 0 junto com qty_min: 3, e mesmo assim a tela mostrava "Obrigatório". Por isso o front deriva "obrigatório" de min > 0 e ignora o flag required.