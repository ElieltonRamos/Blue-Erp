// test-printer.ts
import * as net from 'net';

const ESC = '\x1B';
const GS = '\x1D';
const BOLD_ON = `${ESC}E\x01`;
const BOLD_OFF = `${ESC}E\x00`;
const CENTER = `${ESC}a\x01`;
const LEFT = `${ESC}a\x00`;
const CUT = `${GS}V\x41\x03`;
const LF = '\n';

function formatTicket(): Buffer {
  const line = '-'.repeat(32);
  const now = new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
  });

  let text = '';
  text += CENTER + BOLD_ON + `PEDIDO #999` + BOLD_OFF + LF;
  text += CENTER + now + LF;
  text += CENTER + `Mesa: 05` + LF;
  text += CENTER + `Cliente: Teste` + LF;
  text += LEFT + line + LF;
  text += BOLD_ON + `2x X-Burguer` + BOLD_OFF + LF;
  text += `   Obs: Sem cebola` + LF;
  text += BOLD_ON + `1x Fritas` + BOLD_OFF + LF;
  text += BOLD_ON + `2x X-Burguer` + BOLD_OFF + LF;
  text += `   Obs: Sem cebola` + LF;
  text += BOLD_ON + `1x Fritas` + BOLD_OFF + LF;
  text += BOLD_ON + `2x X-Burguer` + BOLD_OFF + LF;
  text += `   Obs: Sem cebola` + LF;
  text += BOLD_ON + `1x Fritas` + BOLD_OFF + LF;
  text += BOLD_ON + `2x X-Burguer` + BOLD_OFF + LF;
  text += `   Obs: Sem cebola` + LF;
  text += BOLD_ON + `1x Fritas` + BOLD_OFF + LF;
  text += BOLD_ON + `2x X-Burguer` + BOLD_OFF + LF;
  text += `   Obs: Sem cebola` + LF;
  text += BOLD_ON + `1x Fritas` + BOLD_OFF + LF;
  text += BOLD_ON + `2x X-Burguer` + BOLD_OFF + LF;
  text += `   Obs: Sem cebola` + LF;
  text += BOLD_ON + `1x Fritas` + BOLD_OFF + LF;
  text += line + LF;
  text += CUT;

  return Buffer.from(text, 'latin1');
}

function sendTest(ip: string, port = 9100): Promise<void> {
  return new Promise((resolve, reject) => {
    const data = formatTicket();
    const client = net.createConnection({ host: ip, port }, () => {
      console.log(`Conectado em ${ip}:${port}, enviando...`);
      client.write(data);
      client.end();
    });

    client.on('finish', () => {
      console.log('Enviado com sucesso.');
      resolve();
    });

    client.on('error', (err) => {
      console.error(`Erro: ${err.message}`);
      reject(err);
    });
  });
}

const IP = process.argv[2];

if (!IP) {
  console.error('Uso: npx ts-node test-printer.ts <IP_DA_IMPRESSORA>');
  process.exit(1);
}

sendTest(IP).catch(() => process.exit(1));
