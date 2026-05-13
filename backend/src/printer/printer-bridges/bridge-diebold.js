const net = require('net');
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PORT = 9100;
const PRINTER_NAME = 'Diebold';
const EXEC_TIMEOUT_MS = 15000;
const MAX_FEED_LINES = 5;
const MAX_LINES = 40;

const SETUP_PS1 = path.join(os.tmpdir(), 'rawprint_setup.ps1');
const PRINT_PS1 = path.join(os.tmpdir(), 'rawprint_print.ps1');

fs.writeFileSync(
  SETUP_PS1,
  `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class RawPrint {
  [DllImport("winspool.drv", CharSet=CharSet.Unicode, SetLastError=true)]
  public static extern bool OpenPrinter(string pPrinterName, out IntPtr hPrinter, IntPtr pDefault);
  [DllImport("winspool.drv", CharSet=CharSet.Unicode, SetLastError=true)]
  public static extern bool ClosePrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", CharSet=CharSet.Unicode, SetLastError=true)]
  public static extern int StartDocPrinter(IntPtr hPrinter, int level, ref DOCINFO di);
  [DllImport("winspool.drv", SetLastError=true)]
  public static extern bool EndDocPrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", SetLastError=true)]
  public static extern bool StartPagePrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", SetLastError=true)]
  public static extern bool EndPagePrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", SetLastError=true)]
  public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);
  [StructLayout(LayoutKind.Sequential)]
  public struct DOCINFO {
    [MarshalAs(UnmanagedType.LPWStr)] public string pDocName;
    [MarshalAs(UnmanagedType.LPWStr)] public string pOutputFile;
    [MarshalAs(UnmanagedType.LPWStr)] public string pDataType;
  }
}
"@
`,
  'utf8',
);

fs.writeFileSync(
  PRINT_PS1,
  `
param([string]$binFile)
. "${SETUP_PS1}"
$bytes = [System.IO.File]::ReadAllBytes($binFile)
$handle = [System.Runtime.InteropServices.Marshal]::AllocHGlobal($bytes.Length)
[System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $handle, $bytes.Length)
$hPrinter = [IntPtr]::Zero
[RawPrint]::OpenPrinter('${PRINTER_NAME}', [ref]$hPrinter, [IntPtr]::Zero) | Out-Null
$di = New-Object RawPrint+DOCINFO
$di.pDocName = 'ESC/POS'
$di.pDataType = 'RAW'
[RawPrint]::StartDocPrinter($hPrinter, 1, [ref]$di) | Out-Null
[RawPrint]::StartPagePrinter($hPrinter) | Out-Null
$written = 0
[RawPrint]::WritePrinter($hPrinter, $handle, $bytes.Length, [ref]$written) | Out-Null
[RawPrint]::EndPagePrinter($hPrinter) | Out-Null
[RawPrint]::EndDocPrinter($hPrinter) | Out-Null
[RawPrint]::ClosePrinter($hPrinter) | Out-Null
[System.Runtime.InteropServices.Marshal]::FreeHGlobal($handle)
`,
  'utf8',
);

console.log('[*] PS1 de setup gerado');

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

  // init + espaço antes
  // output.push(ESC, 0x40);
  // output.push(LF, LF);

  while (i < buf.length) {
    if (truncated) break;

    const byte = buf[i];

    if (byte === ESC) {
      const next = buf[i + 1];

      // ESC @ (init) — descarta
      if (next === 0x40) {
        i += 2;
        continue;
      }

      // ESC a (align) — 3 bytes
      if (next === 0x61) {
        i += 3;
        continue;
      }

      // ESC E (bold) — 3 bytes
      if (next === 0x45) {
        output.push(buf[i], buf[i + 1], buf[i + 2]);
        i += 3;
        continue;
      }

      // ESC ! (font) — 3 bytes, passa intacto
      if (next === 0x21) {
        const flags = buf[i + 2];
        const doubleWidth = flags & 0x20;
        if (doubleWidth) output.push(0x0e);
        else output.push(0x14);
        i += 3;
        continue;
      }

      // outras ESC — 2 bytes
      output.push(buf[i], buf[i + 1]);
      i += 2;
      continue;
    }

    if (byte === GS) {
      // descarta GS V (corte) intermediário
      if (buf[i + 1] === 0x56) {
        // GS V: se for 0x41 ou 0x42, tem 1 byte extra de parâmetro (4 bytes total)
        const subtype = buf[i + 2];
        i += subtype === 0x41 || subtype === 0x42 ? 4 : 3;
        continue;
      }
      output.push(buf[i], buf[i + 1], buf[i + 2], buf[i + 3]);
      i += 4;
      continue;
    }

    if (byte === LF) {
      if (currentLineLen === 0) {
        blankCount++;
        if (blankCount > MAX_FEED_LINES) {
          i++;
          continue;
        }
      } else {
        blankCount = 0;
      }
      output.push(byte);
      currentLineLen = 0;
      lineCount++;
      if (lineCount >= MAX_LINES) truncated = true;
      i++;
      continue;
    }

    if (byte === 0x0d) {
      i++;
      continue;
    }

    blankCount = 0;
    currentLineLen++;
    output.push(byte);
    i++;
  }

  // espaço depois + corte
  output.push(LF, LF);
  output.push(ESC, 0x77);
  return Buffer.from(output);
}

let printing = false;
const queue = [];

function processQueue() {
  if (printing || queue.length === 0) return;
  printing = true;
  const { limited, remote } = queue.shift();

  const binFile = path.join(os.tmpdir(), `print_${Date.now()}.bin`);
  fs.writeFileSync(binFile, limited);

  exec(
    `powershell -ExecutionPolicy Bypass -File "${PRINT_PS1}" -binFile "${binFile}"`,
    { timeout: EXEC_TIMEOUT_MS },
    (err, stdout, stderr) => {
      try {
        fs.unlinkSync(binFile);
      } catch (_) {}
      printing = false;

      if (err) {
        console.error(`[!] Erro ao imprimir [${remote}]: ${err.message}`);
      } else {
        console.log(
          `[✓] Impresso ${limited.length} bytes na ${PRINTER_NAME} [${remote}]`,
        );
      }
      if (stderr) console.error(`[!] stderr: ${stderr}`);

      processQueue();
    },
  );
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
    queue.push({ limited, remote });
    processQueue();
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
