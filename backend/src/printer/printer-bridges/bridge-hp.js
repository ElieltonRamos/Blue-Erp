const net = require('net');
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PORT = 9100;
const PRINTER_NAME = 'HP LaserJet Professional M1132 MFP';
const EXEC_TIMEOUT_MS = 15000;
const MAX_FEED_LINES = 20;
const MAX_LINES = 40;

function limitAndStrip(buf) {
  const ESC = 0x1b;
  const GS = 0x1d;
  const LF = 0x0a;

  const lines = [];
  let currentLine = '';
  let blankCount = 0;
  let lineCount = 0;
  let truncated = false;
  let i = 0;

  while (i < buf.length) {
    if (truncated) break;

    const byte = buf[i];

    // ESC sequence — descarta
    if (byte === ESC) {
      const next = buf[i + 1];
      if (next === 0x61 || next === 0x45) {
        i += 3;
        continue;
      }
      i += 2;
      continue;
    }

    // GS sequence — descarta
    if (byte === GS) {
      i += 4;
      continue;
    }

    // LF
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

      if (lineCount >= MAX_LINES) truncated = true;

      i++;
      continue;
    }

    // CR — ignora
    if (byte === 0x0d) {
      i++;
      continue;
    }

    // outros controles — ignora
    if (byte < 0x20 || byte === 0x7f) {
      i++;
      continue;
    }

    currentLine += buf.toString('latin1', i, i + 1);
    i++;
  }

  if (currentLine.length > 0) lines.push(currentLine);

  return lines.join('\n') + '\n';
}

const server = net.createServer((socket) => {
  const remote = `${socket.remoteAddress}:${socket.remotePort}`;
  console.log(`[+] Conexão recebida de ${remote}`);

  const chunks = [];

  socket.on('data', (chunk) => chunks.push(chunk));

  socket.on('end', () => {
    const buf = Buffer.concat(chunks);
    if (!buf.length) {
      console.log(`[-] Conexão vazia de ${remote}`);
      return;
    }

    const text = limitAndStrip(buf);
    const tmpFile = path.join(os.tmpdir(), `print_${Date.now()}.txt`);
    fs.writeFileSync(tmpFile, text, 'latin1');

    const cmd = `powershell -NonInteractive -Command "Get-Content '${tmpFile}' | Out-Printer -Name '${PRINTER_NAME}'"`;

    exec(cmd, { timeout: EXEC_TIMEOUT_MS }, (err) => {
      try {
        fs.unlinkSync(tmpFile);
      } catch (_) {}

      if (err) {
        console.error(`[!] Erro ao imprimir: ${err.message}`);
      } else {
        console.log(`[✓] Impresso na ${PRINTER_NAME}`);
      }
    });
  });

  socket.on('error', (err) => {
    console.error(`[!] Erro no socket ${remote}: ${err.message}`);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Bridge escutando :${PORT} → ${PRINTER_NAME}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[!] Porta ${PORT} já está em uso`);
  } else {
    console.error(`[!] Erro no servidor: ${err.message}`);
  }
  process.exit(1);
});
