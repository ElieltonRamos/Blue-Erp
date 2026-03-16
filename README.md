# 🚀 Blue ERP

![Version](https://img.shields.io/badge/version-1.0-blue)
![Backend](https://img.shields.io/badge/backend-NestJS-red)
![Frontend](https://img.shields.io/badge/frontend-Angular-green)
![Mobile](https://img.shields.io/badge/mobile-Kotlin-orange)

💼 **Sistema ERP completo para restaurantes, bares e lanchonetes**,
desenvolvido pela **Blue Tech Informática**.

O sistema possui **3 aplicações integradas**:

- 🧠 Backend API (NestJS)
- 🖥️ Aplicação Desktop (Angular + Tauri)
- 📱 Aplicativo Mobile para garçons (Kotlin)

---

# 🌐 Visão Geral

O **Blue ERP** foi criado para **automatizar e digitalizar operações de restaurantes**.

Principais funcionalidades:

🍽️ Controle de mesas  
🧾 Gestão de pedidos  
📦 Cadastro de produtos  
👥 Cadastro de clientes  
📊 Relatórios gerenciais  
💰 Controle de despesas  
🏭 Controle de produção (cozinha/bar)  
🧾 Emissão de **NF-e / NFC-e**  
📱 App para garçons registrarem pedidos  

---

# 🏗️ Arquitetura do Sistema

```
Garçom Digital (Android)
        │
        │ REST API
        ▼
Backend (NestJS API) ◄──── Frontend Desktop (Angular + Tauri)
        │
        │ Prisma ORM
        ▼
Banco de Dados (MariaDB)
```

---

# 📂 Estrutura do Projeto

```
Blue-Erp/
├── backend/
│   ├── src/
│   │   ├── users/
│   │   ├── orders/
│   │   ├── tables/
│   │   ├── order-production/
│   │   ├── sales/
│   │   ├── products/
│   │   ├── category-product/
│   │   ├── production-locations/
│   │   ├── clients/
│   │   ├── expenses/
│   │   ├── reports/
│   │   ├── fiscal-module/
│   │   ├── ibpt/
│   │   ├── company/
│   │   ├── primary-materials/
│   │   └── license-system/
│   └── prisma/
│
├── frontend/
│   ├── src/
│   └── src-tauri/
│
└── garcom-digital/
    └── app/
        └── src/
```

---

# 🧠 Backend

API responsável por **toda lógica de negócio do sistema**.

## 🧰 Stack

⚙️ Node.js  
🧠 NestJS 11  
🗄️ Prisma ORM 7  
🐬 MariaDB  
🔐 JWT Authentication  
📚 Swagger API Docs  
🧾 Integração com SEFAZ  

## 📦 Módulos

| Módulo | Função |
|---|---|
| 👤 `users` | Autenticação e usuários |
| 🍽️ `orders` | Pedidos |
| 🪑 `tables` | Mesas |
| 🏭 `order-production` | Produção de pedidos |
| 💰 `sales` | Conversão de pedidos em vendas |
| 🍔 `products` | Produtos |
| 🗂️ `category-product` | Categorias |
| 🏭 `production-locations` | Locais de produção |
| 👥 `clients` | Clientes |
| 💸 `expenses` | Despesas |
| 📊 `reports` | Relatórios |
| 🧾 `fiscal-module` | Emissão fiscal |
| 🧮 `ibpt` | Tabela IBPT |
| 🏢 `company` | Dados da empresa |
| 🧱 `primary-materials` | Matérias primas |
| 🔑 `license-system` | Sistema de licença |

---

# ⚙️ Instalação do Backend

### 📥 Instalar dependências

```bash
cd backend
npm install
```

### ⚙️ Configurar ambiente

Copie `.env-example` para `.env` e preencha as variáveis.

### 🗄️ Rodar migrations

```bash
npm run prisma:migrate
```

### 🌱 Popular banco

```bash
npm run prisma:seed
```

### ▶️ Executar servidor

```bash
npm run start:dev
```

Servidor: `http://localhost:3000`  
Swagger: `http://localhost:3000/api`

---

# 🖥️ Frontend Desktop

Sistema utilizado no **caixa ou gerenciamento do restaurante**.

Empacotado como **software desktop** com Tauri.

## 🧰 Stack

⚡ Angular 21  
🦀 Tauri 2  
🎨 TailwindCSS 4  
🔔 ngx-toastr  
⚠️ SweetAlert2  

## 📥 Instalação

```bash
cd frontend
npm install
```

## 🧪 Desenvolvimento

```bash
npm run tauri dev
```

## 📦 Build

```bash
npm run tauri build
```

---

# 📱 Garçom Digital

Aplicativo Android para **registrar pedidos nas mesas**.

Funcionalidades:

📋 Abrir pedidos  
🍔 Adicionar produtos  
📡 Enviar pedidos para cozinha  
⏱️ Acompanhar status  

## 🧰 Stack Mobile

📱 Kotlin  
🎨 Jetpack Compose  
🧠 Hilt (DI)  
🌐 Retrofit  
📡 OkHttp  
🧭 Navigation Compose  
🎨 Material 3  

## ⚙️ Configuração do App

Edite `garcom-digital/app/build.gradle.kts` e configure a URL da API:

```kotlin
buildConfigField("String", "BASE_URL", "\"http://SEU_IP:3000/\"")
```

## 📦 Build Android

Abra o projeto no **Android Studio** e execute via **Gradle**.

---

# 📋 Requisitos

| Sistema | Requisito |
|---|---|
| 🧠 Backend | Node.js 18+ |
| 🗄️ Banco | MariaDB |
| 🖥️ Desktop | Node.js 18+ + Rust |
| 📱 Mobile | Android Studio |
| 🤖 Android | SDK 26+ |

---

# 🔄 Fluxo do Sistema

1️⃣ Garçom cria pedido no **app mobile** 📱  
2️⃣ Pedido é enviado para **API** 🧠  
3️⃣ API envia para **cozinha/bar** 🍳  
4️⃣ Produção atualiza status ⏳  
5️⃣ Pedido é finalizado no **desktop** 💻  
6️⃣ Sistema gera **NFC-e** 🧾  

---

# 💡 Ideias Futuras

- 🏢 Multi empresa
- 🚚 Integração com delivery
- 💳 Integração PIX

---

# 📄 Licença

🔒 Software proprietário da **Blue Tech Informática**.

---

# 👨‍💻 Autor

**Blue Tech Informática**  
💻 Soluções em software para empresas