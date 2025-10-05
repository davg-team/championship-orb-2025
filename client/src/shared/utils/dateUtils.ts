/**
 * Утилиты для работы с датами
 */

/**
 * Безопасный парсинг даты из различных форматов
 */
export const parseDate = (dateString: string | Date | null | undefined): Date | null => {
  if (!dateString) return null;
  if (dateString instanceof Date) return dateString;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date;
  } catch {
    return null;
  }
};

/**
 * Форматирование даты в абсолютный формат DD.MM.YYYY HH:MM
 */
export const formatAbsoluteDate = (date: string | Date | null | undefined): string => {
  const parsed = parseDate(date);
  if (!parsed) return "Неизвестно";
  
  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = parsed.getFullYear();
  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');
  
  return `${day}.${month}.${year} ${hours}:${minutes}`;
};

/**
 * Форматирование даты в относительный формат (X мин назад)
 */
export const formatRelativeDate = (date: string | Date | null | undefined): string => {
  const parsed = parseDate(date);
  if (!parsed) return "Неизвестно";
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - parsed.getTime()) / 1000);
  
  if (diffInSeconds < 0) return "в будущем";
  if (diffInSeconds < 60) return "только что";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} мин назад`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ч назад`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} д назад`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} мес назад`;
  return `${Math.floor(diffInSeconds / 31536000)} г назад`;
};

/**
 * Форматирование полной даты для tooltip в ISO формате
 */
export const formatFullDate = (date: string | Date | null | undefined): string => {
  const parsed = parseDate(date);
  if (!parsed) return "Дата неизвестна";
  
  return parsed.toISOString();
};

/**
 * Получить цветовой статус даты создания (для визуальной индикации)
 */
export const getDateColorStatus = (date: string | Date | null | undefined): 'success' | 'warning' | 'danger' | 'info' => {
  const parsed = parseDate(date);
  if (!parsed) return 'info';
  
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - parsed.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays < 1) return 'success'; // Меньше дня
  if (diffInDays < 30) return 'info'; // Меньше месяца
  if (diffInDays < 90) return 'warning'; // Меньше 3 месяцев
  return 'danger'; // Больше 3 месяцев
};
