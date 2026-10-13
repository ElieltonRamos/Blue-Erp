import * as readline from 'readline';
import * as mariadb from 'mariadb';
import { MENUS_BY_BUSINESS_TYPE } from './database-seed';

type DbConfig = mariadb.ConnectionConfig;
type BusinessTypeKey = keyof typeof MENUS_BY_BUSINESS_TYPE;

interface CompanyRow {
  id: number;
  trade_name: string;
  business_type: string;
  enabled_menus: string | string[] | null;
}

const BUSINESS_TYPES = Object.keys(MENUS_BY_BUSINESS_TYPE) as BusinessTypeKey[];

const ALL_MENUS: string[] = [
  ...new Set(Object.values(MENUS_BY_BUSINESS_TYPE).flat()),
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

function parseMenus(value: CompanyRow['enabled_menus']): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

async function listCompanies(conn: mariadb.Connection): Promise<CompanyRow[]> {
  const rows = await conn.query<CompanyRow[]>(
    'SELECT id, trade_name, business_type, enabled_menus FROM companies ORDER BY id',
  );

  console.log('');
  for (const c of rows) {
    const menus = parseMenus(c.enabled_menus);
    console.log(
      `   [${c.id}] ${c.trade_name} | ${c.business_type} | menus: ${
        menus.length ? menus.join(', ') : '(vazio)'
      }`,
    );
  }
  console.log('');
  return rows;
}

async function saveCompany(
  conn: mariadb.Connection,
  id: number,
  businessType: string,
  menus: string[],
): Promise<void> {
  await conn.query(
    'UPDATE companies SET business_type = ?, enabled_menus = ? WHERE id = ?',
    [businessType, JSON.stringify(menus), id],
  );
}

async function pickCompany(
  conn: mariadb.Connection,
): Promise<CompanyRow | null> {
  const companies = await listCompanies(conn);
  if (companies.length === 0) {
    console.log('❌ Nenhuma empresa cadastrada.\n');
    return null;
  }
  if (companies.length === 1) return companies[0];

  const id = Number(await ask('ID da empresa: '));
  const company = companies.find((c) => c.id === id);
  if (!company) console.log('❌ Empresa não encontrada.\n');
  return company ?? null;
}

async function changeBusinessType(conn: mariadb.Connection): Promise<void> {
  const company = await pickCompany(conn);
  if (!company) return;

  BUSINESS_TYPES.forEach((t, i) => console.log(`   ${i + 1} - ${t}`));
  const type = BUSINESS_TYPES[Number(await ask('Novo tipo: ')) - 1];
  if (!type) {
    console.log('❌ Tipo inválido.\n');
    return;
  }

  await saveCompany(conn, company.id, type, MENUS_BY_BUSINESS_TYPE[type]);
  console.log(`✅ Empresa ${company.id} agora é ${type} (menus padrão).\n`);
}

async function customizeMenus(conn: mariadb.Connection): Promise<void> {
  const company = await pickCompany(conn);
  if (!company) return;

  const current = new Set(parseMenus(company.enabled_menus));

  console.log('\n   Menus disponíveis ([x] = habilitado):');
  ALL_MENUS.forEach((m, i) =>
    console.log(`   ${i + 1} - [${current.has(m) ? 'x' : ' '}] ${m}`),
  );

  const input = await ask(
    'Números para alternar (ex: 1,3,5) ou Enter para cancelar: ',
  );
  if (!input) return;

  for (const n of input.split(',').map((s) => Number(s.trim()) - 1)) {
    const menu = ALL_MENUS[n];
    if (!menu) continue;
    if (current.has(menu)) current.delete(menu);
    else current.add(menu);
  }

  await saveCompany(conn, company.id, company.business_type, [...current]);
  console.log(
    `✅ Menus da empresa ${company.id}: ${[...current].join(', ')}\n`,
  );
}

async function resetMenusToDefault(conn: mariadb.Connection): Promise<void> {
  const company = await pickCompany(conn);
  if (!company) return;

  const menus =
    MENUS_BY_BUSINESS_TYPE[company.business_type as BusinessTypeKey];
  if (!menus) {
    console.log(`❌ Sem padrão para '${company.business_type}'.\n`);
    return;
  }

  await saveCompany(conn, company.id, company.business_type, menus);
  console.log(`✅ Menus da empresa ${company.id} restaurados ao padrão.\n`);
}

async function backfillAll(conn: mariadb.Connection): Promise<void> {
  const rows = await conn.query<CompanyRow[]>(
    `SELECT id, trade_name, business_type, enabled_menus FROM companies
     WHERE enabled_menus IS NULL OR JSON_LENGTH(enabled_menus) = 0`,
  );

  for (const c of rows) {
    const menus = MENUS_BY_BUSINESS_TYPE[c.business_type as BusinessTypeKey];
    if (!menus) continue;
    await saveCompany(conn, c.id, c.business_type, menus);
    console.log(`   ✅ Empresa ${c.id} (${c.business_type})`);
  }
  console.log(`\n✅ ${rows.length} empresa(s) processada(s).\n`);
}

export async function runCompanyMenu(dbConfig: DbConfig): Promise<void> {
  const conn = await mariadb.createConnection(dbConfig);

  try {
    while (true) {
      console.log('\n   🏢 EMPRESA');
      console.log('   1 - Listar empresas');
      console.log('   2 - Alterar tipo de empresa (aplica menus padrão)');
      console.log('   3 - Customizar menus');
      console.log('   4 - Restaurar menus padrão');
      console.log('   5 - Preencher menus vazios (todas)');
      console.log('   0 - Voltar\n');

      switch (await ask('Opção: ')) {
        case '1':
          await listCompanies(conn);
          break;
        case '2':
          await changeBusinessType(conn);
          break;
        case '3':
          await customizeMenus(conn);
          break;
        case '4':
          await resetMenusToDefault(conn);
          break;
        case '5':
          await backfillAll(conn);
          break;
        case '0':
          return;
        default:
          console.log('❌ Opção inválida.\n');
      }
    }
  } finally {
    await conn.end().catch(() => undefined);
  }
}
