/**
 * Retorna a data atual no fuso horário de Brasília (UTC-3)
 * Use sempre que precisar de new Date() para gravar no banco ou gerar XML fiscal
 */
export function nowBrasilia(): Date {
  return new Date();
}

/**
 * Formata uma data para o formato exigido pela SEFAZ: AAAA-MM-DDTHH:MM:SS-03:00
 */
/**
 * Formata uma data (instante UTC real) para o formato exigido pela SEFAZ,
 * no fuso de Brasília: AAAA-MM-DDTHH:MM:SS-03:00
 * Não altera o instante — apenas formata a representação.
 */
export function toSefazDateTime(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value;

  const year = get('year');
  const month = get('month');
  const day = get('day');
  let hour = get('hour');
  const minute = get('minute');
  const second = get('second');

  // Intl pode retornar '24' para meia-noite dependendo do runtime; normaliza para '00'
  if (hour === '24') hour = '00';

  return `${year}-${month}-${day}T${hour}:${minute}:${second}-03:00`;
}

export function resolveLogicalDateTime(): Date {
  const now = nowBrasilia();
  const hour = now.getHours();

  if (hour < 6) {
    now.setDate(now.getDate() - 1);
  }

  return now;
}
