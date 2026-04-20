const net = require('net');
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PORT = 9100;
const PRINTER_NAME = 'Elgin-i9';
const EXEC_TIMEOUT_MS = 15000;
const MAX_FEED_LINES = 20; // limita linhas em branco consecutivas

// Elgin i9: 80mm, 576 dots, ~48 chars por linha
const MAX_CHARS_PER_LINE = 48;
const MAX_LINES = 40; // ~15cm em papel 80mm (aprox 3.5mm por linha)

function limitBuffer(buf) {
  const ESC = 0x1b;
  const GS = 0x1d;
  const LF = 0x0a;

  const output = [];
  let lineCount = 0;
  let blankCount = 0;
  let currentLineLen = 0;
  let truncated = false;
  let i = 0;

  while (i < buf.length) {
    if (truncated) break;

    const byte = buf[i];

    // ESC sequence — copia intacta
    if (byte === ESC) {
      const next = buf[i + 1];

      // ESC a (align) — 3 bytes
      if (next === 0x61) {
        output.push(buf[i], buf[i + 1], buf[i + 2]);
        i += 3;
        continue;
      }

      // ESC E (bold) — 3 bytes
      if (next === 0x45) {
        output.push(buf[i], buf[i + 1], buf[i + 2]);
        i += 3;
        continue;
      }

      // ESC @ (init) — 2 bytes
      if (next === 0x40) {
        output.push(buf[i], buf[i + 1]);
        i += 2;
        continue;
      }

      // outras ESC — 2 bytes
      output.push(buf[i], buf[i + 1]);
      i += 2;
      continue;
    }

    // GS sequence — copia intacta (inclui corte GS V)
    if (byte === GS) {
      output.push(buf[i], buf[i + 1], buf[i + 2], buf[i + 3]);
      i += 4;
      continue;
    }

    // LF — conta linha
    if (byte === LF) {
      if (currentLineLen === 0) {
        blankCount++;
        if (blankCount > MAX_FEED_LINES) {
          i++;
          continue; // descarta LFs excessivos
        }
      } else {
        blankCount = 0;
      }

      output.push(byte);
      currentLineLen = 0;
      lineCount++;

      if (lineCount >= MAX_LINES) {
        truncated = true;
      }

      i++;
      continue;
    }

    // CR — ignora
    if (byte === 0x0d) {
      i++;
      continue;
    }

    // texto normal
    currentLineLen++;
    output.push(byte);
    i++;
  }

  // garante corte no final
  const CUT = [GS, 0x56, 0x41, 0x03];
  output.push(...CUT);

  return Buffer.from(output);
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

    const limited = limitBuffer(buf);
    const tmpFile = path.join(os.tmpdir(), `print_${Date.now()}.bin`);
    fs.writeFileSync(tmpFile, limited);

    const cmd = `powershell -NonInteractive -Command "
      Add-Type -TypeDefinition @'
        using System;
        using System.Runtime.InteropServices;
        public class RawPrint {
          [DllImport(\\"winspool.drv\\", CharSet=CharSet.Auto, SetLastError=true)]
          public static extern bool OpenPrinter(string pPrinterName, out IntPtr hPrinter, IntPtr pDefault);
          [DllImport(\\"winspool.drv\\", CharSet=CharSet.Auto, SetLastError=true)]
          public static extern bool ClosePrinter(IntPtr hPrinter);
          [DllImport(\\"winspool.drv\\", CharSet=CharSet.Auto, SetLastError=true)]
          public static extern int StartDocPrinter(IntPtr hPrinter, int level, ref DOCINFO di);
          [DllImport(\\"winspool.drv\\", SetLastError=true)]
          public static extern bool EndDocPrinter(IntPtr hPrinter);
          [DllImport(\\"winspool.drv\\", SetLastError=true)]
          public static extern bool StartPagePrinter(IntPtr hPrinter);
          [DllImport(\\"winspool.drv\\", SetLastError=true)]
          public static extern bool EndPagePrinter(IntPtr hPrinter);
          [DllImport(\\"winspool.drv\\", SetLastError=true)]
          public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);
          [StructLayout(LayoutKind.Sequential)]
          public struct DOCINFO {
            [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
            [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
            [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
          }
        }
'@;
      \$bytes = [System.IO.File]::ReadAllBytes('${tmpFile}');
      \$handle = [System.Runtime.InteropServices.Marshal]::AllocHGlobal(\$bytes.Length);
      [System.Runtime.InteropServices.Marshal]::Copy(\$bytes, 0, \$handle, \$bytes.Length);
      \$hPrinter = [IntPtr]::Zero;
      [RawPrint]::OpenPrinter('${PRINTER_NAME}', [ref]\$hPrinter, [IntPtr]::Zero) | Out-Null;
      \$di = New-Object RawPrint+DOCINFO;
      \$di.pDocName = 'ESC/POS';
      \$di.pDataType = 'RAW';
      [RawPrint]::StartDocPrinter(\$hPrinter, 1, [ref]\$di) | Out-Null;
      [RawPrint]::StartPagePrinter(\$hPrinter) | Out-Null;
      \$written = 0;
      [RawPrint]::WritePrinter(\$hPrinter, \$handle, \$bytes.Length, [ref]\$written) | Out-Null;
      [RawPrint]::EndPagePrinter(\$hPrinter) | Out-Null;
      [RawPrint]::EndDocPrinter(\$hPrinter) | Out-Null;
      [RawPrint]::ClosePrinter(\$hPrinter) | Out-Null;
      [System.Runtime.InteropServices.Marshal]::FreeHGlobal(\$handle);
    "`;

    exec(cmd, { timeout: EXEC_TIMEOUT_MS }, (err) => {
      try {
        fs.unlinkSync(tmpFile);
      } catch (_) {}

      if (err) {
        console.error(`[!] Erro ao imprimir: ${err.message}`);
      } else {
        console.log(`[✓] Impresso ${limited.length} bytes na ${PRINTER_NAME}`);
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
