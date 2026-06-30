import { exists, readTextFile, writeTextFile, mkdir, BaseDirectory } from '@tauri-apps/plugin-fs';

const DEFAULT_CONFIG = { mode: 'local', remote_url: null as string | null };

async function loadConfig() {
  const configExists = await exists('config.json', { baseDir: BaseDirectory.AppConfig });

  if (!configExists) {
    await mkdir('', { baseDir: BaseDirectory.AppConfig, recursive: true });
    await writeTextFile('config.json', JSON.stringify(DEFAULT_CONFIG, null, 2), {
      baseDir: BaseDirectory.AppConfig,
    });
    return DEFAULT_CONFIG;
  }

  const content = await readTextFile('config.json', { baseDir: BaseDirectory.AppConfig });
  return JSON.parse(content);
}

export async function initTauri(bootstrap: () => void): Promise<void> {
  const config = await loadConfig();

  if (config.mode === 'remote' && config.remote_url) {
    try {
      await fetch(config.remote_url, { mode: 'no-cors' });
      window.location.href = config.remote_url;
      return; // não bootstrapa o Angular
    } catch (e) {
      // falha: bootstrapa normalmente, tela de erro fica a seu critério
    }
  }

  bootstrap();
}
