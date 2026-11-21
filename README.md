# 🚀 Blue ERP

ERP multi-nicho (restaurante/bar, oficina, varejo, PDV) com emissão fiscal. Este README complementa o `schema.prisma`: aqui está só o que o schema não diz.

![Version](https://img.shields.io/badge/version-1.0-blue)
![Backend](https://img.shields.io/badge/backend-NestJS-red)
![Frontend](https://img.shields.io/badge/frontend-Angular-green)
![Mobile](https://img.shields.io/badge/mobile-Kotlin-orange)

💼 **Sistema ERP completo para gestão de empresas**,
desenvolvido pelo **Grupo Sae**.

## Apps

| App         | Stack                                                    |
| ----------- | -------------------------------------------------------- |
| `backend/`  | NestJS 11, Prisma 7, MariaDB/MySQL                       |
| `frontend/` | Angular 21 (standalone, signals), Tauri 2, TailwindCSS 4 |
| `android/`  | Kotlin, Compose, Hilt, Retrofit, DataStore               |

Fluxo (restaurante): garçom (mobile) abre pedido → backend cria itens e dispara produções por local → cozinha/bar (kitchen-display) → caixa fecha e recebe → NFC-e/NF-e.

## Setup

```bash
# Backend
cd backend && npm install
cp .env-example .env
npm run prisma:generate && npm run prisma:migrate && npm run prisma:seed
npm run start:dev          # API: /api | Swagger: /docs (só fora de production)

# Frontend
cd frontend && npm install && npm run tauri:dev

# Mobile: abrir android/ no Android Studio
# Ajustar BASE_URL no build.gradle.kts (emulador: http://10.0.2.2:3000/api/)
```

Build: `npm run release` (backend, gera `release/server.js`), `npm run tauri:build` (front), `npm run installer:win` (instalador NSIS completo).

### Variáveis de ambiente (backend)

`PORT`, `ENVIRONMENT`, `DATABASE_URL`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`, `DATABASE_HOST`, `DATABASE_PORT`, `JWT_SECRET`, `LICENSE_PUBLIC_KEY`, `LICENSING_SERVER`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `PRINTER_BAR`, `PRINTER_COZINHA_DOM_JUAN`, `MYSQLDUMP_PATH`.

Frontend: `environment.ts` (`apiUrl`). Mobile: `BuildConfig.BASE_URL`.

## Backend

### Convenções

- Um módulo por domínio: `module`, `controller`, `service`, `dto/`, `entities/`. Serviços grandes são divididos por responsabilidade (ex.: orders → items, status, production, stock, table, print) com `*.mapper.ts` para includes/mapeamento de entity.
- Sem Repository: `PrismaService` direto (`this.prisma.client`). Transações com `$transaction`; serviços auxiliares recebem o `tx`.
- DTOs com `class-validator` + `class-transformer` + Swagger. Mensagens em `ValidationMessages`.
- `ValidationPipe` global: `whitelist`, `forbidNonWhitelisted`, `transform`. Campo extra no body = 400.
- Erros: exceptions nativas do NestJS; fiscal usa `fiscal.exception.ts`.
- Auth: `@UseGuards(JwtAuthGuard, RolesGuard)`, `@Roles(...)`, `@CurrentUser()` (`JwtPayload`: `userId`, `role`).
- Logs: `Logger` nativo, formato `[Pedido {id}] operador={id} | mensagem | {ms}ms`.
- Datas de negócio: usar `resolveLogicalDateTime()` (`common/date-utils`).
- Jobs `@nestjs/schedule` com `@SingleInstance()` (execução única em cluster PM2): 05:00 backup, 05:30 produções órfãs, 05:45 limpeza de comandas, 06:00 relatório Telegram.

### Roles (`User.role` é string)

`ADMIN` (tudo) · `CAIXA` (fecha pedido, gera venda, emite NFC-e, reimprime, remove/reduz itens) · `GARCOM` (abre pedido, adiciona itens, vê mesas; não remove/reduz itens) · `COZINHEIRO` (tela de produção).

### Fluxos de status

- **Order**: `OPEN → CLOSED → PAID`; `OPEN/CLOSED → CANCELED`; `CANCELED → OPEN` (reopen). `PAID` é imutável. `CANCELED` só aceita troca de status. Itens são alterados só via `OrderItemsService`, não pelo `update`.
- **OrderProduction**: `PENDING → IN_PROGRESS → COMPLETED` (+ `deliveredAt` opcional). Cancelar pedido cancela produções ativas; reduzir item reduz `quantityRequested`.
- **Sale (fiscal)**: `PENDENTE → EMITIDA | CANCELADA | ERRO`. Só emite se o pedido estiver `CLOSED`. `EMITIDA`/`CANCELADA` não são alteráveis. `isPaid = false` se houver pagamento `CREDITO_LOJA`.
- **Document**: `DRAFT → APPROVED → IN_PROGRESS → COMPLETED | CANCELED`.

### Estoque, produção, comissão

- Baixa de estoque só para `RESALE` (`decrement` no create/addItems; `increment` no remove/cancel).
- `MANUFACTURED`/`SEMI_MANUFACTURED` não baixam estoque: geram `OrderProduction` por `productionLocation`.
- Composição (ficha técnica) não baixa matéria-prima automaticamente.
- Comissão: `User.commissionRate` e, por item, em `DocumentItem`. `SaleItem` não tem comissão própria.

### Fiscal (`fiscal-module/lib/`)

XML (`xml/nfce-xml-builder.ts`) → assinatura A1 (`transport/nfe-signer.ts`, node-forge) → SEFAZ (`transport/nfe-sender.ts`, endpoints por UF em `nfe-endpoints.config.ts`) → parser (`nfe-response.parser.ts`) → DANFE PDF (`danfe/nfce-danfe-generator.ts`, pdf-lib).

- CFOP padrão 5102, sobrescrevível na venda. Impostos: alíquotas do produto, fallback IBPT por NCM.
- `infAdic` é validado antes da emissão e deve conter: "Tributos aproximados R$ X", "federais", "estaduais", "municipais", "IBPT".
- Numeração via `reserveNfceNumber` (incremento atômico, rollback se falhar antes da SEFAZ).
- Certificado lido via `CompanyService.getCertificateBuffer()`. XMLs em disco via `StorageService` (`storage/NFCE/AAAA/MM/CHAVE.xml`).

## Frontend

- Estrutura: `src/app/features/{feature}/{components,pages,services,types}`. Standalone components.
- Services `providedIn: 'root'`, `inject(HttpClient)`, retornam `Observable`. `authInterceptor` injeta o Bearer token.
- Estado: sem store global; services + `signal()` local.
- Rotas: `app.routes.ts` com `authGuard` (JWT/expiração, role via `route.data['role']`) e `offlineGuard` (redireciona para `/offline` se `__TAURI_OFFLINE__`).
- **Ao criar novos componentes, consultar o `styles.css` e usar os tokens globais.**

## Mobile

- Camadas: `data` (api, repository, model) → `ui` (screens, navigation, components). Models separados por nicho (`restaurante/`, `oficina/`).
- `AppModule` (Hilt) provê OkHttp (AuthInterceptor + logging), Retrofit, `ApiService`.
- `AuthInterceptor` usa token do `TokenManager` (DataStore); em 401 limpa o token e emite evento. NavGraph depende do token.
- minSdk 26 / targetSdk 36 / Java 11. Sem flavors; apenas debug/release.

## Pontos de atenção

1. **Licença (`LicenseSystemService`)** — não alterar sem cuidado:
   - `verifyToken()` usa `ignoreExpiration: true`; `exp` é checado manualmente em `checkToken()` (base do grace period offline).
   - `fetchToken()`: 4xx = rejeição (limpa token); 5xx/timeout = mantém cache. Inverter quebra o bloqueio/offline.
   - `isClockRolledBack()` compara com as 2 últimas vendas; sem vendas não detecta. Tolerância de 5 min.
   - `sendUsageReport()` marca `lastUsageReportDay` antes de enviar (evita duplicidade).
   - `maxOfflineDays` vem do claim do JWT, não é configurável localmente.
2. **Criação de pedido é uma única transação** (pedido, estoque, produção, mesa). A impressão só é despachada após o commit.
3. **Valores vêm do cliente**: `unitPrice`, `total` e `serviceCharge` do `CreateOrderDto` não são recalculados no backend.
4. **Fuso**: filtros de data usam `-03:00` fixo.
5. **Offline do front**: apenas visualização/cozinha. Não há fila nem sync de ações offline; o app assume conexão estável com a API.
6. **Testes**: praticamente inexistentes (`app.e2e-spec.ts` vazio).
7. **Fiscal**: nunca logar XML completo (só chave/protocolo).
8. **Mobile**: `BASE_URL` hardcoded/comentado em `build.gradle.kts`; configurar por ambiente.
9. Frontend compilado é servido estaticamente pelo NestJS (`ServeStaticModule`, `public/frontend/browser`).

# 📄 Licença

🔒 Software proprietário do **Grupo Sae**.

---

# 👨‍💻 Autor

**Grupo Sae**  
💻 Soluções em software para empresas
