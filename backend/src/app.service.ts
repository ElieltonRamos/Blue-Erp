// app.service.ts
import { Injectable } from '@nestjs/common';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from './database/prisma.service';
import { promisify } from 'util';
import { exec } from 'child_process';
import { Cron } from '@nestjs/schedule';

const INSTALADOR_INFO = {
  nome: 'BlueTech Informática',
  tecnico: 'Elielton',
  telefone: '(38) 98866-3580',
  email: 'elieltonramos14@gmail.com',
  instalacao: '22/12/2025',
};

const execAsync = promisify(exec);

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  @Cron('0 5 * * *', { name: 'scheduled-backup' }) // Todos os dias às 5h
  async scheduledBackup() {
    console.log('🕐 Executando backup agendado...');
    await this.execBackup();
  }

  async getDashboardData() {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    let packageVersion = '1.0.0';
    try {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'),
      );
      packageVersion = packageJson.version || '1.0.0';
    } catch {
      // Ignora erro
    }

    // Verificação do banco
    let dbStatus = '🔴 Offline';
    let dbStatusClass = 'text-red-400';
    let dbError = '';

    try {
      await this.prisma.client.$executeRaw`SELECT 1`;
      dbStatus = '🟢 Online';
      dbStatusClass = 'text-green-400';
    } catch (error: unknown) {
      dbError = error instanceof Error ? error.message : 'Erro desconhecido';
    }

    // Backup info
    let backupInfo = {
      lastBackup: 'Nenhum',
      daysAgo: 'Nunca',
      status: '❌ Sem backups',
      statusClass: 'text-red-400',
      totalBackups: 0,
    };

    try {
      const backupDir = path.join(process.cwd(), 'backups');
      if (fs.existsSync(backupDir)) {
        const allBackups = fs
          .readdirSync(backupDir)
          .filter((file) => file.endsWith('.sql') && file.startsWith('backup-'))
          .sort(
            (a, b) =>
              fs.statSync(path.join(backupDir, b)).mtime.getTime() -
              fs.statSync(path.join(backupDir, a)).mtime.getTime(),
          );

        if (allBackups.length > 0) {
          const latestBackup = allBackups[0];
          const stats = fs.statSync(path.join(backupDir, latestBackup));
          const daysAgo = Math.floor(
            (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24),
          );

          backupInfo = {
            lastBackup: stats.mtime.toLocaleDateString('pt-BR'),
            daysAgo: daysAgo === 0 ? 'Hoje' : `${daysAgo} dias`,
            status: '🟢 OK',
            statusClass: 'text-green-400',
            totalBackups: allBackups.length,
          };
        } else {
          backupInfo.status = '⚪ Pasta vazia';
          backupInfo.statusClass = 'text-yellow-400';
        }
      } else {
        backupInfo.status = '📁 Pasta não existe';
        backupInfo.statusClass = 'text-gray-400';
      }
    } catch {
      backupInfo.status = '❌ Erro';
      backupInfo.statusClass = 'text-red-400';
    }

    return {
      serverStatus: '🟢 Online',
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
      version: packageVersion,
      port: process.env.PORT || 3000,
      cpu: os.cpus()[0].model.split(' ')[0],
      memoryTotal: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(1)} GB`,
      memoryUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(1)} MB`,
      installationPath: __dirname,
      timestamp: new Date().toLocaleString('pt-BR'),
      dbStatus,
      dbStatusClass,
      dbError,
      backupLast: backupInfo.lastBackup,
      backupDaysAgo: backupInfo.daysAgo,
      backupStatus: backupInfo.status,
      backupStatusClass: backupInfo.statusClass,
      backupCount: backupInfo.totalBackups,
      instaladorNome: INSTALADOR_INFO.nome,
      instaladorTecnico: INSTALADOR_INFO.tecnico,
      instaladorTelefone: INSTALADOR_INFO.telefone,
      instaladorEmail: INSTALADOR_INFO.email,
      instaladorData: INSTALADOR_INFO.instalacao,
    };
  }

  renderDashboard(data: any): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blue ERP - Dashboard Admin</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 min-h-screen text-white">
    <div class="container mx-auto px-6 py-8">
        <div class="text-center mb-12">
            <h1 class="text-5xl font-bold text-white mb-4">
              🏢 Blue ERP Admin
            </h1>
            <p class="text-xl opacity-90">${data.timestamp}</p>
            <p class="text-lg opacity-75">Versão: ${data.version}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <!-- Servidor -->
            <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:border-blue-400 transition-all duration-300">
                <div class="flex items-center mb-4">
                    <div class="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mr-4">
                        <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                        </svg>
                    </div>
                    <h3 class="text-2xl font-bold">Servidor</h3>
                </div>
                <p class="text-3xl font-black text-green-400">${data.serverStatus}</p>
                <p class="text-sm opacity-75 mt-2">Uptime: ${data.uptime}</p>
            </div>

            <!-- Sistema -->
            <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:border-blue-400 transition-all duration-300">
                <h3 class="text-2xl font-bold mb-4">🖥️ Sistema</h3>
                <div class="space-y-2 text-sm">
                    <p><span class="font-semibold">CPU:</span> ${data.cpu}</p>
                    <p><span class="font-semibold">RAM:</span> ${data.memoryUsed}/${data.memoryTotal}</p>
                    <p><span class="font-semibold">Porta:</span> ${data.port}</p>
                </div>
            </div>

            <!-- Banco -->
            <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:border-blue-400 transition-all duration-300">
                <h3 class="text-2xl font-bold mb-4">🗄️ Banco</h3>
                <p class="text-2xl font-bold ${data.dbStatusClass} mb-2">${data.dbStatus}</p>
                ${data.dbError ? `<p class="text-xs opacity-75 mt-2 text-red-300">${data.dbError}</p>` : '<p class="text-xs opacity-75">Myql</p>'}
            </div>

            <!-- Backup -->
            <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:border-blue-400 transition-all duration-300">
                <h3 class="text-2xl font-bold mb-4">💾 Backup</h3>
                <p class="text-2xl font-bold ${data.backupStatusClass} mb-2">${data.backupStatus}</p>
                <p class="text-sm opacity-75 mt-2">Último: ${data.backupLast}</p>
                <p class="text-xs opacity-60">(${data.backupDaysAgo}) ${data.backupCount > 0 ? `• ${data.backupCount}` : ''}</p>
            </div>
        </div>

        <!-- Instalador -->
        <div class="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 backdrop-blur-lg rounded-2xl p-8 border-2 border-blue-500/30 mb-8">
            <h3 class="text-2xl font-bold mb-6 flex items-center text-blue-300">
                👨‍💻 Instalação por
            </h3>
            <div class="space-y-3 text-lg">
                <p><span class="font-semibold">🏢</span> ${data.instaladorNome}</p>
                <p><span class="font-semibold">🧑</span> ${data.instaladorTecnico}</p>
                <p><span class="font-semibold">📅</span> ${data.instaladorData}</p>
                <p class="text-sm opacity-75 mt-2">
                    📞 ${data.instaladorTelefone} | ✉️ ${data.instaladorEmail}
                </p>
            </div>
        </div>

        <div class="text-center opacity-75">
            <p>Instalado em: ${data.installationPath}</p>
            <p class="text-sm mt-2">BlueTech Informática Ltda - Espinosa, MG</p>
        </div>
    </div>

    <script> setTimeout(() => location.reload(), 30000); </script>
</body>
</html>`;
  }

  private manageBackupFiles(backupDir: string, maxBackups: number = 3): void {
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const allBackups = fs
      .readdirSync(backupDir)
      .filter((file) => file.endsWith('.sql') && file.startsWith('backup-'))
      .sort();

    const toDelete = allBackups.slice(0, -maxBackups);
    toDelete.forEach((file) => {
      const filePath = path.join(backupDir, file);
      fs.unlinkSync(filePath);
      console.log(`🗑️  Backup antigo removido: ${file}`);
    });

    console.log(
      `📊 Total de backups mantidos: ${allBackups.length - toDelete.length + 1}`,
    );
  }

  async execBackup(): Promise<void> {
    try {
      const timestamp = new Date()
        .toISOString()
        .replace(/:/g, '-')
        .slice(0, 19);
      const backupDir = path.join(process.cwd(), 'backups');
      const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);

      console.log('🔄 Iniciando backup do banco de dados...');

      this.manageBackupFiles(backupDir, 3);

      const dbName = process.env.DATABASE_NAME || 'db_blue_erp';
      const dbUser = process.env.DATABASE_USER || 'root';
      const dbPassword = process.env.DATABASE_PASSWORD || 'password';
      const dbHost = '127.0.0.1'; // Forçar 127.0.0.1 para Docker
      const dbPort = process.env.DATABASE_PORT || '3306';

      const command = `mysqldump -h ${dbHost} -P ${dbPort} -u ${dbUser} -p${dbPassword} ${dbName} > "${backupFile}"`;

      await execAsync(command);

      console.log(`✅ Backup concluído com sucesso!`);
      console.log(`📁 Arquivo: ${backupFile}`);
    } catch (error) {
      console.log('❌ Falha no backup do banco de dados:', error);
      throw error;
    }
  }
}
