import { SecretType } from "shared/types/secret";

/**
 * Определить тип секрета по его названию (умная детекция)
 */
export const detectSecretType = (secretName: string): SecretType => {
  const name = secretName.toLowerCase();

  // API ключи
  if (
    name.includes('api') ||
    name.includes('ключ') ||
    name.includes('key') ||
    name.includes('token') ||
    name.includes('токен')
  ) {
    return SecretType.API_KEY;
  }

  // Базы данных
  if (
    name.includes('db') ||
    name.includes('database') ||
    name.includes('база') ||
    name.includes('бд') ||
    name.includes('postgres') ||
    name.includes('mysql') ||
    name.includes('mongo') ||
    name.includes('redis')
  ) {
    return SecretType.DATABASE;
  }

  // SSH ключи
  if (
    name.includes('ssh') ||
    name.includes('server') ||
    name.includes('сервер') ||
    name.includes('host') ||
    name.includes('хост')
  ) {
    return SecretType.SSH_KEY;
  }

  // Сертификаты
  if (
    name.includes('cert') ||
    name.includes('сертификат') ||
    name.includes('ssl') ||
    name.includes('tls')
  ) {
    return SecretType.CERTIFICATE;
  }

  // По умолчанию - общий
  return SecretType.GENERIC;
};
