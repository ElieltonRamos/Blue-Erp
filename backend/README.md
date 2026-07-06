# 🗄️ Setup Completo MySQL no Windows – Blue ERP

Este guia resolve os dois problemas mais comuns ao rodar o projeto no Windows:

1. ❌ `mysqldump não é reconhecido`
2. ❌ `RSA public key is not available client side`

---

# 🔧 PARTE 1 – Corrigir erro do mysqldump no Windows

## ❌ Erro

```
'mysqldump' não é reconhecido como um comando interno
ou externo, um programa operável ou um arquivo em lotes.
```

## 🎯 Causa

A pasta `bin` do MySQL não está na variável de ambiente `PATH` do Windows.

---

## ✅ Solução definitiva

### 1️⃣ Abrir configurações do sistema

Pressione:

```
Win + R
```

Digite:

```
sysdm.cpl
```

Pressione Enter.

---

### 2️⃣ Acessar variáveis de ambiente

Vá em:

```
Aba Avançado
→ Variáveis de Ambiente
```

---

### 3️⃣ Editar o PATH do Sistema

⚠️ Edite o **Path da seção “Variáveis do sistema”** (parte inferior da janela).

1. Selecione `Path`
2. Clique em **Editar**
3. Clique em **Novo**
4. Adicione:

```
C:\Program Files\MySQL\MySQL Server 8.0\bin
```

Sem aspas.

Clique em OK até fechar tudo.

---

### 4️⃣ Reiniciar o terminal

Feche todos os CMD abertos.
Abra um novo Prompt de Comando.

Teste:

```
mysqldump --version
```

Se aparecer algo como:

```
mysqldump  Ver 8.0.xx for Win64
```

✅ Problema resolvido.

---

# 🔐 PARTE 2 – Corrigir erro de chave pública RSA

## ❌ Erro

```
RSA public key is not available client side
SQLState: 08S01
```

## 🎯 Causa

O MySQL 8 usa por padrão o plugin de autenticação:

```
caching_sha2_password
```

Alguns drivers Node.js não conseguem autenticar sem SSL ou chave pública RSA.

---

# ✅ SOLUÇÃO RÁPIDA (Desenvolvimento)

### 1️⃣ Acesse o MySQL

```
mysql -u root -p
```

---

### 2️⃣ Execute:

```sql
ALTER USER 'root'@'localhost'
IDENTIFIED WITH mysql_native_password BY 'password';

FLUSH PRIVILEGES;
```

---

### 3️⃣ Reinicie o MySQL

Teste novamente sua aplicação.

✔ O erro de RSA será resolvido.

---

# 🚀 SOLUÇÃO RECOMENDADA

Criar usuário específico para aplicação:

```sql
CREATE USER 'blueerp'@'%' IDENTIFIED WITH mysql_native_password BY '123456';
GRANT ALL PRIVILEGES ON db_blue_erp.* TO 'blueerp'@'%';
FLUSH PRIVILEGES;
```

Atualizar `.env`:

```
DATABASE_URL="mysql://blueerp:123456@127.0.0.1:3306/db_blue_erp"
```

⚠️ Evite usar `root` em aplicações.

---

# 🔎 Como verificar o plugin do usuário

```sql
SELECT user, host, plugin FROM mysql.user;
```

Se aparecer `caching_sha2_password`, esse é o motivo do erro.

---

# 🎯 Resultado Final

Após seguir este guia:

* ✔ Backup via `mysqldump` funciona no Windows
* ✔ Conexão com MySQL não gera erro de RSA
* ✔ Ambiente de desenvolvimento configurado corretamente

---

📌 Guia válido para MySQL 8+ no Windows 10/11.


# Prompts Importantes

Refatore os logs do arquivo [NOME_DO_ARQUIVO] seguindo esta lógica:

PRINCÍPIO: logar transições de estado e decisões, não passos internos. Se o log não responde "o que aconteceu e por quê" pra alguém lendo sem contexto, é ruído — remova.

SEMPRE logar (nível `log`):
- Início e fim de processo assíncrono relevante (cron, job, fila, operação de longa duração)
- Duração de execução quando o processo tiver custo perceptível (queries múltiplas, chamadas externas)

SEMPRE logar (nível `warn`):
- Falha recuperável que dispara retry ou fallback
- Resultado anormal de uma decisão com múltiplos caminhos (ex: fallback ativado, lista vazia onde se esperava dados, divergência detectada)

SEMPRE logar (nível `error`):
- Falha definitiva, sem retry possível, que aborta o processo
- Sempre incluir contexto que identifique a execução (ex: ID, data, parâmetro de entrada), nunca só "erro genérico"

NUNCA logar:
- Cada query individual do Prisma/ORM (já tem log próprio se configurado)
- Valores intermediários de cálculo dentro de métodos privados
- Sucesso de cada etapa dentro de uma função auxiliar
- Objetos de erro brutos de libs externas (axios, etc) — sempre extrair só código/status/mensagem antes de logar, nunca o objeto inteiro (evita poluir o log com stack trace de socket/TLS)

REGRAS DE FORMATO:
- Use o Logger nativo do NestJS já presente na classe (não trocar por outra lib)
- Mensagens em português, direto ao ponto, sem emoji
- Não adicionar logs em métodos privados puramente de cálculo/transformação de dados
- Não adicionar comentários explicando o log
- Não gerar documentação, README ou changelog — só o código refatorado

Antes de aplicar, analise o arquivo e me diga:
1. Quais pontos já estão adequados (não tocar)
2. Quais situações estão sem log e por quê são relevantes
3. Quais logs existentes estão no nível errado ou são ruído

Só aplique a refatoração depois da minha confirmação.