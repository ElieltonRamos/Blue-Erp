# Cardapio Web

Front público do cardápio digital do Blue ERP. Projeto Angular separado do `frontend/` (Tauri), para o consumidor final: mobile-first, sem autenticação, consumindo apenas rotas `/api/public/*` do backend.

> **Estado atual:** o front está completo até o pedido e roda 100% com **mocks** (`USE_MOCK = true` em `DashboardService` e `OrderService`). O backend ainda não existe e vai espelhar os tipos definidos aqui.

## 1. Contexto

| Projeto            | Papel                                                          |
| ------------------ | -------------------------------------------------------------- |
| `cardapio-web`     | Este projeto: páginas públicas do cardápio                     |
| `backend`          | Novo módulo `online-menu`: rotas públicas e gestão do cardápio |
| `frontend` (Tauri) | Gestão de pedidos pelo computador (ajustes futuros)            |

- Uma loja por deploy (sem slug/multi-loja nas rotas).
- Referência visual: HTML de exemplo do Multipedidos (LA CASA HAMBURGUERIA), de onde saíram os tokens de cor, o layout e a estrutura de dados (`ng-state`).
- Empresa exibida no rodapé: **Grupo Sae**. Domínio sugerido: `cliente.pedeblue.com.br`.

## 2. Requisitos e comandos

- Node.js compatível com Angular 21 (conferir `engines` no `package.json`).
- Backend em `http://localhost:3000` (API em `/api`). Enquanto não existir, usar os mocks.

```bash
ng serve                    # desenvolvimento
ng serve --host 0.0.0.0     # testar no celular (mesma rede)
ng build                    # build
```

A URL da API fica em `src/environments/` (dev: `http://localhost:3000/api`).

## 3. Stack e convenções

- Angular 21, standalone components, signals, `ChangeDetectionStrategy.OnPush`, control flow (`@if`, `@for`, `@switch`).
- Tailwind v4 com tokens em `@theme` (`src/styles.css`). Nunca usar cores fixas (`bg-white`, hex) nos componentes.
- Sem guards e sem interceptor de autenticação.
- Somente tema claro (`color-scheme: light`). Dark fica para depois: basta um bloco `.dark { ... }` sobrescrevendo as variáveis.
- Componentes de página usam `.ts` e `.html` separados. Componentes pequenos podem ter template inline.
- Carrinho **não** é persistido em `localStorage`. Única exceção: o **id do último pedido** (`cardapio-web:last-order`, expira em 24h), usado no atalho "Acompanhar pedido".
- Moeda: `currency: 'BRL' : 'symbol' : '1.2-2' : 'pt-BR'`.
- Mobile-first. O layout no desktop foi testado e é aceitável (uso previsto é no celular).
- Sem testes por enquanto.

## 4. Estrutura de pastas

Organização atual do projeto (alguns caminhos de import dos arquivos gerados podem precisar de ajuste):

```
src/app/
├── app.routes.ts
├── core/services/environment.ts            # apiUrl
├── shared/
│   ├── components/
│   │   ├── about-modal/                    # modal "Crie seu cardápio" (<dialog>)
│   │   ├── product-detail/                 # modal de detalhe/opções do produto
│   │   └── not-found/
│   └── services/branding.service.ts        # título e favicon da loja
└── features/
    ├── dashboard/
    │   ├── pages/dashboard.ts + .html      # cardápio (tela inicial)
    │   ├── services/dashboard.service.ts   # getMenu() (mock ou HTTP)
    │   ├── services/menu.mock.ts           # MOCK_MENU
    │   └── types/dashboard.ts              # Product, OptionGroup, Option, Category, Menu
    ├── store-info/
    │   ├── pages/store-info.ts             # página de informações da loja
    │   └── types/store.ts                  # StoreInfo
    ├── cart/
    │   ├── pages/cart.ts + .html           # página do carrinho
    │   ├── components/cart-bar.ts          # barra fixa com total
    │   └── services/cart.service.ts        # estado do carrinho
    └── checkout/
        ├── pages/checkout.ts + .html       # finalizar pedido
        ├── pages/order.ts + .html          # acompanhamento do pedido
        ├── services/order.service.ts       # create/get (mock ou HTTP)
        └── types/order.ts                  # tipos do pedido
```

## 5. Rotas

```typescript
export const routes: Routes = [
  { path: '', component: Dashboard },
  { path: 'informacoes', component: StoreInfoPage },
  { path: 'carrinho', component: CartPage },
  { path: 'checkout', component: CheckoutPage },
  { path: 'pedido/:id', component: OrderPage },
  { path: '**', component: NotFound },
];
```

O detalhe do produto **não** é rota: é um modal (`<dialog>`), para preservar o scroll do cardápio.

## 6. Design tokens (`@theme`)

| Grupo        | Tokens                                                                 |
| ------------ | ---------------------------------------------------------------------- |
| Fundos       | `page` (#fcfaf7), `surface`, `surface-alt`, `surface-hover`, `overlay` |
| Bordas       | `border`, `border-subtle`                                              |
| Texto        | `text-primary`, `text-secondary`, `text-muted`, `text-strong`          |
| Marca        | `accent` (#ef4342), `accent-hover`, `accent-soft`, `on-accent`         |
| Estados      | `danger`, `success`, `warning`                                         |
| Avisos       | `notice-bg`, `notice-border`                                           |
| Indisponível | `disabled-bg`, `disabled-text`                                         |
| Barras/modal | `cart-bar`, `cashback`, `on-dark`, `backdrop`                          |
| Outros       | `--font-sans` (Inter), `--shadow-card`, `--shadow-header`              |

- **Não existe `--color-base`.** Esse nome gerava `text-base` como cor (colidindo com o tamanho de fonte) e deixava títulos quase brancos. O fundo da página é `--color-page`.
- `accent` é fixo. Se um dia vier da API por loja, sobrescrever em runtime (`document.documentElement.style.setProperty`).

## 7. Modelo de dados (contrato que o backend vai espelhar)

```typescript
interface Option { id; name; price; available }            // acréscimo por unidade
interface OptionGroup {
  id; name;
  type: 'single' | 'multiple';   // radio | + / −
  min: number;                   // 0 = opcional; > 0 = obrigatório
  max: number | null;            // total do grupo (o "0/20")
  maxPerOption: number | null;   // por opção
  options: Option[];
}
interface Product {
  id; name; description | null;
  price: number;                 // preço BASE (usado no cálculo)
  startingPrice: number | null;  // se não nulo, exibe "A partir de R$ X"
  imageUrl | null; available; featured;
  optionGroups: OptionGroup[];   // [] = produto simples
}
interface Category { id; name; products: Product[] }
type PaymentType = 'pix' | 'card' | 'cash';
interface PaymentMethod { type: PaymentType; label: string }
interface StoreInfo {
  name; address; openingHours; isOpen; deliveryTime; takeoutTime;
  deliveryFee: number;           // taxa fixa
  minOrderValue: number;         // mínimo dos itens p/ entrega (0 = sem mínimo)
  logoUrl: string | null;        // favicon
  phone; whatsapp /* dígitos com 55 */; instagram | null;
  latitude; longitude;
  hours: { day; open; close }[];
  paymentMethods: PaymentMethod[];
}
interface Menu { store: StoreInfo; categories: Category[] }
```

```typescript
type FulfillmentType = 'delivery' | 'pickup';
type OrderStatus =
  | 'received'
  | 'preparing'
  | 'out_for_delivery'
  | 'ready_for_pickup'
  | 'completed'
  | 'canceled';

interface OrderRequest {
  // POST: só ids e quantidades; backend recalcula preços
  fulfillment;
  customer: { name; phone /* só dígitos */ };
  address: { street; number; neighborhood; complement } | null;
  payment: { type: PaymentType; changeFor: number | null };
  items: { productId; quantity; observation; selections: { optionId; quantity }[] }[];
}
interface Order {
  // resposta do POST e do GET
  id;
  status;
  createdAt;
  fulfillment;
  customer;
  address;
  payment: { type; changeFor; label };
  items: { name; quantity; observation; selections: { name; quantity }[]; total }[];
  subtotal;
  deliveryFee;
  total;
}
```

| Método | Rota                     | Resposta |
| ------ | ------------------------ | -------- |
| GET    | `/api/public/menu`       | `Menu`   |
| POST   | `/api/public/orders`     | `Order`  |
| GET    | `/api/public/orders/:id` | `Order`  |

Imagens (`imageUrl`) vêm do backend. Se houver miniaturas para listas, o contrato ganha um `thumbUrl`.

## 8. Configuração do produto

Um produto tem **dados básicos** e **grupos de opções**.

### Dados básicos (`Product`)

| Campo           | Significado                                                             |
| --------------- | ----------------------------------------------------------------------- |
| `price`         | Preço base, usado no cálculo. No "Monte seu lanche" é `0`.              |
| `startingPrice` | Se não for `null`, o cardápio mostra "A partir de R$ X". É só exibição. |
| `available`     | Se `false`, o card fica cinza e não abre.                               |
| `featured`      | Aparece no carrossel "Promoção".                                        |
| `optionGroups`  | Lista de grupos de opções. `[]` = produto simples.                      |

### Grupo de opções (`OptionGroup`)

Cada grupo é uma pergunta ao cliente ("Escolha seu pão", "Adicionais").

| Campo          | Significado                                                                    |
| -------------- | ------------------------------------------------------------------------------ |
| `type`         | `single`: uma opção (radio). `multiple`: várias, com quantidade (+ / −).       |
| `min`          | Mínimo de unidades somadas no grupo. `0` = opcional; `> 0` = obrigatório.      |
| `max`          | Máximo de unidades somadas no grupo (o "0/20"). `null` = sem limite.           |
| `maxPerOption` | Máximo de unidades de uma mesma opção (ex.: até 10 ovos). `null` = sem limite. |
| `options`      | Opções: `name`, `price` (acréscimo por unidade) e `available`.                 |

### Exemplos do mock

- **Guaraná**: `optionGroups: []`. A tela abre só com observação e quantidade.
- **Misto especial**: grupo "Adicionais no Lanche", `multiple`, `min: 3`, `max: 20`, `maxPerOption: 10`.
- **Monte seu lanche**: "Escolha seu Pão" (`single`, `min: 1`, `max: 1`) e "Adicionais" (`multiple`, `min: 3`), com `price: 0` e `startingPrice: 5.5`.

### Como a tela usa isso

- Badges: `0/20` mostra a contagem e o `max`. "Obrigatório" aparece se `min > 0`; "Mínimo N" se `min > 1`.
- "Adicionar" só habilita quando todo grupo cumpre `min ≤ contagem ≤ max`.
- O `+` desabilita ao atingir `max` do grupo ou `maxPerOption` da opção.
- Preço do item = `price` + Σ(preço da opção × quantidade). Total da linha = isso × quantidade do produto.

### Pontos de atenção

- `min`/`max` contam **unidades somadas** no grupo, não opções distintas (3 ovos já satisfazem "mínimo 3").
- `startingPrice` vem pronto do backend; o front não o calcula.
- O ng-state do HTML original tinha `required: 0` junto com `qty_min: 3` e mesmo assim exibia "Obrigatório". Por isso o front deriva "obrigatório" de `min > 0` e ignora o flag `required`.

## 9. Funcionalidades por tela

### Dashboard (`/`)

Componente único (os componentes filhos iniciais foram fundidos nele).

- Aviso fixo no topo quando a loja está fechada, com o horário de funcionamento.
- Atalho "Acompanhar pedido #id" quando há pedido recente neste navegador.
- Header da loja: nome, botão "Informações", endereço, horário com status Aberto/Fechado, entrega e retirada.
- Barra sticky de categorias (pills). Clicar rola até a seção; ao rolar a página, a categoria ativa acompanha (scroll-spy com `IntersectionObserver`, pausado durante o scroll suave do clique) e a pill ativa fica centralizada na barra.
- Busca (ignora acentos e maiúsculas, em nome e descrição).
- Carrossel "Promoção" (`featured && available`), oculto durante a busca.
- Seções por categoria (categoria vazia não aparece) e `ng-template #productCard`, reutilizado na lista e no carrossel (`compact`).
- Rodapé "Desenvolvido por Grupo Sae" com botão "Crie seu cardápio" (abre `AboutModal`).
- Estados: carregando, erro com "Tentar novamente", sem resultados.
- Clique no produto: `productDetail().open(product)` via `viewChild` (a variável de template não alcança o `ng-template` fora do bloco `@else if`).

### Product detail (modal)

- Imagem, nome, descrição, preço, grupos de opções, observação (até 100 caracteres), quantidade e botão "Adicionar • R$".
- Botão desabilitado até todos os grupos respeitarem `min` e `max`. Em produtos "A partir de" inválidos, não mostra o preço.
- Loja fechada: ao clicar em "Adicionar" aparece o aviso com o horário e o item **não** é adicionado (input `store`; sem ele não valida).
- Modo edição: `open(product, line)` preenche seleções, quantidade e observação; o botão vira "Salvar alterações" e chama `cart.replace`.

### Carrinho (`/carrinho`) e CartBar

- Linhas com quantidade, opções escolhidas, total por linha, stepper (com 1, o `−` remove), Editar, observação inline, Limpar, "Adicionar mais itens", total e "Finalizar pedido" (link para `/checkout`). Estado vazio.
- `CartService` (signals): `items`, `count`, `total`; `add`, `replace`, `increment`, `decrement`, `setObservation`, `clear`.
- `CartItem` = `lineId` + `product` + `selections` (nome e preço "congelados") + `quantity` + `observation`. Mesma assinatura (produto + opções + observação) agrupa na mesma linha.
- `lineId` é um contador (não `crypto.randomUUID`, que não existe em HTTP fora de localhost).
- `CartBar`: barra fixa escura com badge e total, aparece com itens no carrinho e leva a `/carrinho`.

### Informações (`/informacoes`)

Abas Sobre (endereço, contato WhatsApp/telefone, Instagram, link "Ver no mapa"), Horários e Pagamento.

### Checkout (`/checkout`)

- Recebimento: Entrega (rua, número, bairro obrigatórios; complemento opcional) ou Retirada (mostra o endereço da loja).
- Cliente: nome e telefone com DDD (10 ou 11 dígitos).
- Pagamento: formas da loja; em dinheiro, "Troco para" opcional (não pode ser menor que o total).
- Resumo: itens + taxa fixa (só na entrega) = total.
- Loja fechada: aviso e envio bloqueado.
- Valor mínimo (`minOrderValue`): só para entrega, comparado ao subtotal dos itens (sem a taxa). Bloqueia o envio e mostra quanto falta.
- Ao enviar: cria o pedido, grava o id do pedido, limpa o carrinho e navega para `/pedido/:id`.

### Acompanhamento (`/pedido/:id`)

Status atual, itens com opções e observações, entrega/retirada, pagamento, totais e botão "Falar com a loja no WhatsApp" (`wa.me` com mensagem pronta). É um botão e não abertura automática, porque navegadores costumam bloquear janelas fora de um clique. O id guardado é esquecido quando o pedido está `completed` ou `canceled`, ou quando a consulta retorna 404.

### Branding

`BrandingService.apply(store)` define o título da aba (`store.name`) e o favicon (`store.logoUrl`). É chamado no `DashboardService.getMenu()` (via `tap`), então vale para qualquer página que carregue a loja.

## 10. Mocks

- `menu.mock.ts` (`MOCK_MENU`): loja e produtos reais do HTML de referência. Cobre produto em destaque, "A partir de", indisponível, com e sem imagem (SVG embutido), categoria vazia ("Trufas"), Misto especial, Monte seu lanche e Guaraná. Valores fictícios: `deliveryFee: 5` e `minOrderValue: 10`.
- `DashboardService.getMenu()` e `OrderService` têm `USE_MOCK = true`. Para usar o backend, trocar para `false` (e remover os mocks depois).
- O `OrderService` mock guarda pedidos em memória (recarregar `/pedido/:id` perde o pedido) e resolve nomes e preços pelo `MOCK_MENU`. Pedido inexistente retorna `HttpErrorResponse` 404.
- Para testar o estado de erro: `throwError(() => new Error('mock'))`.

## 11. Checklist de ligações

- [ ] `app.config.ts`: `provideRouter(routes)`, `provideHttpClient()`, `registerLocaleData(localePt)`.
- [ ] `environment.ts` com `apiUrl`.
- [ ] `styles.css`: `@theme`, `:root { color-scheme: light; }`, `body { @apply bg-page text-text-primary font-sans; }`, `button { @apply cursor-pointer; }` e `.no-scrollbar`.
- [ ] `index.html`: `lang="pt-BR"`, `<meta name="color-scheme" content="light">`, `viewport-fit=cover` (opcional) e a fonte Inter (Google Fonts ou `@fontsource-variable/inter`).
- [ ] `dashboard.ts`: `imports` com `AboutModal`, `ProductDetail`, `RouterLink`, `CurrencyPipe`, `NgTemplateOutlet` (e `CartBar`); `viewChild(ProductDetail)`; `OrderService.lastOrderId`; efeitos do scroll-spy.
- [ ] `dashboard.html`: `<app-product-detail [store]="menu.store" />`, `<app-about-modal #about ctaUrl="..." />`, `<app-cart-bar />`, `pb-24` no footer, aviso de loja fechada, atalho "Acompanhar pedido", `relative` na `<nav>` e `id="nav-category-{id}"` em cada pill.
- [ ] Card de produto usando `startingPrice` (`@if (product.startingPrice !== null)` e `product.startingPrice ?? product.price`).
- [ ] `index.html` com as tags de compartilhamento (ver seção 13).

## 12. Decisões tomadas

| Tema               | Decisão                                                                                        |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| Tema               | Só claro por ora                                                                               |
| Lojas              | Uma por deploy                                                                                 |
| Desktop            | Layout atual é aceitável; foco no celular                                                      |
| Detalhe do produto | Modal `<dialog>`, não rota                                                                     |
| Opções             | Modelo único de `OptionGroup` (inclui "Monte seu lanche")                                      |
| Carrinho           | Em memória (só o id do último pedido vai ao `localStorage`)                                    |
| Loja fechada       | Aviso no topo do cardápio, aviso ao "Adicionar" e checkout bloqueado                           |
| Recebimento        | Entrega e retirada                                                                             |
| Taxa de entrega    | Fixa (`StoreInfo.deliveryFee`)                                                                 |
| Pedido mínimo      | Configurável por loja (`minOrderValue`), só entrega                                            |
| Pix                | Só forma de pagamento escolhida; sem QR code nem chave                                         |
| Pós-pedido         | Página de acompanhamento + botão de WhatsApp; **sem polling** (status só ao carregar a página) |
| Imagens            | URLs vêm do backend                                                                            |
| Rodapé             | Grupo Sae (não Multipedidos)                                                                   |
| Testes             | Nenhum por enquanto                                                                            |

## 13. Pendências

**Para fechar**

- `ctaUrl` do `AboutModal` (hoje placeholder).
- Tags de compartilhamento no `index.html` (a pré-visualização do WhatsApp lê só o HTML estático; como é uma loja por deploy, basta escrever as tags direto, sem SSR). Precisa de `og:image` com URL absoluta em HTTPS:

  ```html
  <title>NOME DA LOJA</title>
  <meta property="og:type" content="website" />
  <meta property="og:title" content="NOME DA LOJA" />
  <meta property="og:description" content="Peça agora! É fácil e rápido" />
  <meta property="og:image" content="https://SEU-DOMINIO/logo-1200x630.png" />
  <meta property="og:url" content="https://SEU-DOMINIO/" />
  ```

- Hospedagem (servido pelo backend ou separado), nome comercial e domínio.
- Backend: implementar o módulo `online-menu` seguindo os tipos acima e desligar os mocks.

**Depois**

- Tratar erros no envio do pedido (preço mudou ou produto ficou indisponível). Sugestão: backend responde `409` com a lista de itens afetados e o checkout mostra uma tela de ajuste.
- Detalhe do produto: destacar o grupo inválido e bloquear o scroll do fundo com o modal aberto.
- Imagens: fallback quando a URL quebrar e, se o backend oferecer, `thumbUrl` para listas.
- PWA: possível em SPA com `ng add @angular/pwa` (manifest, ícones e service worker; exige HTTPS e cuidado com atualização de versões).

**Opcional**

- Pedido agendado.
- Mapa embutido na página de informações (hoje é link).
- Cor da marca (`accent`) por loja.

## 14. Armadilhas já encontradas

- `--color-base` colide com `text-base` (ver seção 6). Em `@theme`, qualquer `--color-*` gera utilities `bg-*`, `text-*` e `border-*` com o mesmo nome.
- Não aplicar `display` ao `<dialog>` (ele ficaria sempre visível). O layout vai num `div` interno.
- Evitar `[class.hover:bg-x]` em bindings; usar `[class]="cond ? '...' : '...'"`.
- Se `bg-surface` e `bg-disabled-bg` estiverem ambos na lista de classes, não há garantia de qual vence; torne-os condicionais.
- `crypto.randomUUID()` quebra em HTTP fora de localhost (relevante ao testar no celular com `ng serve --host 0.0.0.0`).
- Em `product-detail.ts`, importar `Option` dos tipos. Sem o import, o TypeScript usa o `Option` global do DOM (erro TS2749).
- Variáveis de template (`#detail`) não alcançam o `ng-template` definido fora do bloco `@else if`; usar `viewChild`.
- No scroll-spy, a barra sticky tem ~72px; o `rootMargin` do observer (`-80px 0px -60% 0px`) e o `scroll-mt-20` das seções dependem disso.

## 15. Como trabalhar neste projeto

Preferências do desenvolvedor: respostas objetivas, sem inferências, perguntar em caso de dúvida e evitar gerar documentação além do que for pedido. Entregas de página em arquivos separados (`.ts` e `.html`); ele ajusta os caminhos.

Para retomar em outra conversa, enviar este README e o arquivo que será alterado.
