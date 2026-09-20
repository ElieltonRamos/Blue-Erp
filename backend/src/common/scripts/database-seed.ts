/* eslint-disable @typescript-eslint/no-unsafe-argument */
import * as readline from 'readline';
import { Writable } from 'stream';
import * as mariadb from 'mariadb';
import * as bcrypt from 'bcryptjs';

export type BusinessType = 'PDV' | 'OFICINA' | 'RESTAURANTE' | 'VAREJO';

const MENUS_BASE = [
  '/clientes',
  '/produtos',
  '/usuarios',
  '/historico-vendas',
  '/relatorios',
  '/financeiro',
  '/empresa',
  '/pdv',
];

const MENUS_FISCAL = ['/fiscal', '/compras'];
const MENUS_SEGMENTO_OFICINA = ['/veiculos', '/servicos', '/ordem-servico'];
const MENUS_SEGMENTO_RESTAURANTE = ['/comandas', '/cozinha', '/mesas'];

export const MENUS_PDV = [...MENUS_BASE];

export const MENUS_OFICINA = [
  ...MENUS_BASE,
  ...MENUS_FISCAL,
  ...MENUS_SEGMENTO_OFICINA,
];

export const MENUS_RESTAURANTE = [
  ...MENUS_BASE,
  ...MENUS_FISCAL,
  ...MENUS_SEGMENTO_RESTAURANTE,
];

export const MENUS_VAREJO = [
  ...MENUS_BASE,
  ...MENUS_FISCAL,
  ...MENUS_SEGMENTO_OFICINA,
  ...MENUS_SEGMENTO_RESTAURANTE,
];

export const MENUS_BY_BUSINESS_TYPE: Record<BusinessType, string[]> = {
  PDV: MENUS_PDV,
  OFICINA: MENUS_OFICINA,
  RESTAURANTE: MENUS_RESTAURANTE,
  VAREJO: MENUS_VAREJO,
};

const BUSINESS_TYPE_OPTIONS: BusinessType[] = [
  'PDV',
  'RESTAURANTE',
  'OFICINA',
  'VAREJO',
];

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function askHidden(question: string): Promise<string> {
  let muted = false;

  const output = new Writable({
    write(chunk, encoding, callback) {
      if (!muted) process.stdout.write(chunk, encoding);
      callback();
    },
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output,
    terminal: true,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
    muted = true;
  });
}

async function askValid(
  question: string,
  validate: (value: string) => string | null,
  hidden = false,
): Promise<string> {
  while (true) {
    const value = hidden ? await askHidden(question) : await ask(question);
    const error = validate(value);
    if (!error) return value;
    console.log(`   ❌ ${error}`);
  }
}

async function askPassword(): Promise<string> {
  while (true) {
    const password = await askValid(
      '   Senha (mínimo 6 caracteres): ',
      (value) =>
        value.length >= 6 ? null : 'A senha deve ter no mínimo 6 caracteres.',
      true,
    );
    const confirmation = await askHidden('   Confirme a senha: ');

    if (password === confirmation) return password;
    console.log('   ❌ As senhas não conferem.');
  }
}

async function askBusinessType(): Promise<BusinessType> {
  console.log('   Tipo de empresa:');
  BUSINESS_TYPE_OPTIONS.forEach((type, index) =>
    console.log(`      ${index + 1} - ${type}`),
  );

  const answer = await askValid('   Escolha: ', (value) =>
    BUSINESS_TYPE_OPTIONS[Number(value) - 1] ? null : 'Opção inválida.',
  );

  return BUSINESS_TYPE_OPTIONS[Number(answer) - 1];
}

export async function runSeeds(
  config: mariadb.ConnectionConfig,
): Promise<void> {
  console.log('\n🌱 Rodando seeds...\n');

  const cnpj = (
    await askValid('   CNPJ (somente números): ', (value) =>
      value.replace(/\D/g, '').length === 14
        ? null
        : 'O CNPJ deve ter 14 dígitos.',
    )
  ).replace(/\D/g, '');

  const companyName = await askValid('   Nome da empresa: ', (value) =>
    value ? null : 'Nome obrigatório.',
  );

  const licenseKey = await askValid('   Chave de licença: ', (value) =>
    value ? null : 'Chave de licença obrigatória.',
  );

  const businessType = await askBusinessType();

  console.log('\n   Segundo usuário (admin):');
  const username = await askValid('   Usuário: ', (value) => {
    if (!value) return 'Usuário obrigatório.';
    if (value.toLowerCase() === 'root') return 'O usuário "root" já existe.';
    return null;
  });
  const password = await askPassword();

  console.log('');

  const conn = await mariadb.createConnection(config);

  try {
    console.log('   ⏳ Executando: company-seed');
    await conn.query(
      `INSERT INTO companies (
        id, cnpj, corporate_name, trade_name, state_registration, tax_regime,
        street, number, complement, neighborhood, city, city_code, state, zip_code,
        phone, email, nfce_series, nfce_current_number, nfce_environment,
        nfce_csc, nfce_csc_id, certificate_path, certificate_password,
        certificate_expiration_date, ibpt_version, license_key, license_token,
        business_type, enabled_menus, created_at, updated_at
      ) VALUES (
        1, ?, ?, ?, '123456789', '1',
        'Rua das Flores', '456', 'Loja 1', 'Centro', 'São Paulo', '3550308', 'SP', '01310100',
        '11987654321', 'contato@bomsabor.com.br', '1', 1, 'staging',
        'HOMOLOGACAO-CSC-EXEMPLO', '1', '/certificates/bomsabor.pfx', 'certificado123',
        '2026-12-31', '4.0', ?, NULL,
        ?, ?, NOW(), NOW()
      ) ON DUPLICATE KEY UPDATE
        cnpj = VALUES(cnpj),
        corporate_name = VALUES(corporate_name),
        trade_name = VALUES(trade_name),
        license_key = VALUES(license_key),
        license_token = NULL,
        business_type = VALUES(business_type),
        enabled_menus = VALUES(enabled_menus),
        updated_at = NOW()`,
      [
        cnpj,
        companyName,
        companyName,
        licenseKey,
        businessType,
        JSON.stringify(MENUS_BY_BUSINESS_TYPE[businessType]),
      ],
    );
    console.log('   ✅ Concluído: company-seed');

    console.log('   ⏳ Executando: user-seed');
    const upsertUser = (name: string, passwordHash: string) =>
      conn.query(
        `INSERT INTO users (username, password, role, workplace, active, created_at, updated_at)
        VALUES (?, ?, 'admin', '', true, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          password = VALUES(password),
          role = 'admin',
          active = true,
          updated_at = NOW()`,
        [name, passwordHash],
      );

    await upsertUser('root', await bcrypt.hash('impostoeroubo', 10));
    await upsertUser(username, await bcrypt.hash(password, 10));
    console.log('   ✅ Concluído: user-seed');

    console.log('   ⏳ Executando: client-seed');
    await conn.query(`
      INSERT INTO clients (id, name, active, created_at, updated_at)
      VALUES (1, 'Consumidor Final', true, NOW(), NOW())
      ON DUPLICATE KEY UPDATE name = VALUES(name), active = true, updated_at = NOW()
    `);
    console.log('   ✅ Concluído: client-seed');
  } finally {
    await conn.end();
  }

  console.log('');
}
