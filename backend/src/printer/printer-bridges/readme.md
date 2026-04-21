# Sistema de Impressão ESC/POS

## Visão Geral

[NestJS API] --TCP 9100--> [Bridge Node.js] --WinAPI--> [Impressora Elgin i9]

O fluxo é:

1. API NestJS formata o cupom em ESC/POS e envia via TCP
2. Bridge recebe, processa e envia para a impressora via Windows Spooler

---

## Bridge (bridge-elgin.js)

Roda na máquina Windows com a impressora conectada.

### Inicialização

Ao iniciar, gera dois arquivos `.ps1` no diretório temporário do sistema:

- `rawprint_setup.ps1` — define a classe C# `RawPrint` com P/Invoke para `winspool.drv`
- `rawprint_print.ps1` — script reutilizável que lê um `.bin` e envia para o spooler

Isso evita recompilar o C# a cada impressão.

### Recebimento

- Escuta na porta `9100` em todas as interfaces (`0.0.0.0`)
- Aceita conexões TCP e acumula os chunks recebidos
- Ao receber `end` (conexão fechada pelo cliente), processa o buffer

### Processamento (limitBuffer)

Antes de imprimir, o buffer passa por `limitBuffer` que:

- Emite `ESC @` (init) uma única vez no início
- Adiciona 2 LFs de espaço antes do conteúdo
- Descarta `ESC @` duplicados vindos do cliente
- Passa `ESC !` (fonte) intacto — fonte é controlada pelo cliente
- Passa `ESC a` (alinhamento) intacto
- Passa `ESC E` (bold) intacto
- Descarta `GS V` (corte) intermediários — só emite um no final
- Limita linhas em branco consecutivas a `MAX_FEED_LINES = 5`
- Limita total de linhas a `MAX_LINES = 40`
- Adiciona 5 LFs de espaço depois do conteúdo
- Emite `GS V 0` (corte total) no final

### Fila de Impressão

Impressões são processadas **uma por vez** via fila serial (`queue`).  
Isso evita travamentos por processos PowerShell simultâneos.

### Envio para Impressora

Para cada impressão:

1. Salva o buffer processado em arquivo `.bin` temporário
2. Executa `powershell -File rawprint_print.ps1 -binFile <arquivo>`
3. O PS1 usa `winspool.drv` via P/Invoke para envio RAW direto ao spooler
4. Remove o `.bin` temporário após conclusão

## Impressora de Rede

Para impressoras com interface de rede, o bridge **não é necessário**.  
A impressora já expõe a porta `9100` nativamente e recebe ESC/POS direto via TCP.

```
[NestJS API] --TCP 9100--> [Impressora de rede]
```

Basta configurar o IP da impressora no `.env`:

```env
PRINTER_COZINHA=192.168.0.50
```

O `PrinterService` não requer nenhuma alteração.

> O bridge só é necessário quando a impressora está conectada via **USB** em uma máquina Windows.

### Configuração

| Constante         | Valor      | Descrição                            |
| ----------------- | ---------- | ------------------------------------ |
| `PORT`            | `9100`     | Porta TCP                            |
| `PRINTER_NAME`    | `Elgin-i9` | Nome exato da impressora no Windows  |
| `EXEC_TIMEOUT_MS` | `15000`    | Timeout do processo PowerShell       |
| `MAX_FEED_LINES`  | `5`        | Máximo de LFs em branco consecutivos |
| `MAX_LINES`       | `40`       | Máximo de linhas por cupom           |

---

## Cliente NestJS (PrinterService)

### Configuração

Cada impressora é configurada via variável de ambiente:

```env
PRINTER_COZINHA_DOM_JUAN=192.168.0.100
PRINTER_BAR=192.168.0.101
```

O `locationCode` do job é mapeado para `PRINTER_<LOCATION>`.

### Formatação do Cupom (formatTicket)

Sequências ESC/POS usadas:

| Constante    | Bytes      | Descrição                      |
| ------------ | ---------- | ------------------------------ |
| `ESC @`      | `1B 40`    | Reset da impressora            |
| `ESC ! 0x30` | `1B 21 30` | Fonte dupla (altura + largura) |
| `ESC ! 0x00` | `1B 21 00` | Fonte normal                   |
| `ESC E 0x01` | `1B 45 01` | Bold on                        |
| `ESC E 0x00` | `1B 45 00` | Bold off                       |
| `ESC a 0x01` | `1B 61 01` | Centralizar                    |
| `ESC a 0x00` | `1B 61 00` | Alinhar esquerda               |
| `GS V 0x41`  | `1D 56 41` | Corte parcial                  |

### Estrutura do Cupom

[FONTE GRANDE + BOLD] PEDIDO #X
[FONTE GRANDE] DD/MM/AAAA HH:MM
[FONTE GRANDE] Mesa: X
[FONTE GRANDE] Cliente: X
[FONTE NORMAL] ------------------------
[FONTE NORMAL + BOLD] 1x Item
Obs: observação
[FONTE NORMAL] ------------------------
[CORTE]

### Envio

- Conexão TCP direta para `IP:9100`
- Timeout: `20000ms`
- Múltiplos jobs do mesmo pedido são enviados em paralelo via `Promise.allSettled`
- Resolve no evento `close` do socket

---

## Requisitos

### Bridge

- Windows 10+
- Node.js 16+
- Impressora instalada no Windows Spooler com nome exato `Elgin-i9`
- Porta `9100` liberada no firewall

### NestJS

- Variáveis de ambiente `PRINTER_<LOCATION>` configuradas
- Acesso de rede à máquina com o bridge
