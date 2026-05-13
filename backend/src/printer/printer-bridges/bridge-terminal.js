const net = require('net');

const PORT = 9100;
const MAX_FEED_LINES = 5;
const MAX_LINES = 40;
const TICKET_WIDTH = 45;

function extractText(buf) {
  const ESC = 0x1b;
  const GS = 0x1d;
  const LF = 0x0a;

  const lines = [];
  let currentLine = '';
  let lineCount = 0;
  let blankCount = 0;
  let i = 0;

  while (i < buf.length) {
    const byte = buf[i];

    if (byte === ESC) {
      const next = buf[i + 1];
      if (next === 0x40) {
        i += 2;
        continue;
      }
      if (next === 0x61) {
        i += 3;
        continue;
      }
      if (next === 0x45) {
        i += 3;
        continue;
      }
      if (next === 0x21) {
        i += 3;
        continue;
      }
      i += 2;
      continue;
    }

    if (byte === GS) {
      i += 4;
      continue;
    }

    if (byte === LF) {
      if (currentLine.trim() === '') {
        blankCount++;
        if (blankCount > MAX_FEED_LINES) {
          i++;
          continue;
        }
      } else {
        blankCount = 0;
      }
      lines.push(currentLine);
      currentLine = '';
      lineCount++;
      if (lineCount >= MAX_LINES) break;
      i++;
      continue;
    }

    if (byte === 0x0d) {
      i++;
      continue;
    }

    if (byte >= 0x20 && byte <= 0x7e) {
      currentLine += String.fromCharCode(byte);
    } else {
      const ch = buf.toString('latin1', i, i + 1);
      if (ch.charCodeAt(0) >= 0xa0) currentLine += ch;
    }

    i++;
  }

  if (currentLine.length > 0) lines.push(currentLine);

  return lines;
}

function printToConsole(lines, remote) {
  const border = '='.repeat(TICKET_WIDTH);
  const cut = '-'.repeat(TICKET_WIDTH);

  console.log(`\n${border}`);
  console.log(`  [IMPRESSORA] ${remote}`);
  console.log(border);
  for (const line of lines) {
    console.log(line);
  }
  console.log(cut);
  console.log('[corte]');
  console.log(`${border}\n`);
}

const server = net.createServer((socket) => {
  const remote = `${socket.remoteAddress}:${socket.remotePort}`;
  console.log(`[+] Conexão de ${remote}`);

  const chunks = [];

  socket.on('data', (chunk) => chunks.push(chunk));

  socket.on('end', () => {
    const buf = Buffer.concat(chunks);
    if (!buf.length) {
      console.log(`[-] Buffer vazio de ${remote}`);
      return;
    }

    const lines = extractText(buf);
    printToConsole(lines, remote);
  });

  socket.on('error', (err) => {
    console.error(`[!] Erro no socket ${remote}: ${err.message}`);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Bridge escutando :${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[!] Porta ${PORT} já está em uso`);
  } else {
    console.error(`[!] Erro no servidor: ${err.message}`);
  }
  process.exit(1);
});
