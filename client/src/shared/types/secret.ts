/**
 * Типы секретов, поддерживаемые системой
 */
export enum SecretType {
  DATABASE = 'database',
  API_KEY = 'api_key',
  CERTIFICATE = 'certificate',
  SSH_KEY = 'ssh_key',
  GENERIC = 'generic',
}

/**
 * Метаданные секрета
 */
export interface SecretMetadata {
  created_at: string;
  updated_at?: string;
  tags?: string[];
  description?: string;
  expires_at?: string;
  resource_name?: string; // Название ресурса для заявок
  is_local?: boolean; // true = создан локально, false/undefined = из OpenBao
  sync_status?: 'synced' | 'pending' | 'conflict' | 'error'; // Статус синхронизации
  last_synced_at?: string; // Время последней синхронизации
}

/**
 * Основная структура секрета (совместимая с OpenBao)
 */
export interface Secret {
  id: string;
  name: string;
  type: SecretType;
  data: Record<string, string>; // Универсальные поля секрета
  metadata: SecretMetadata;
  createdAt: string; // Для обратной совместимости с UI
  expiresAt?: string; // Дата истечения
}

/**
 * Краткая информация о секрете (для списков)
 */
export interface SecretListItem {
  id: string;
  name: string;
  type: SecretType;
  created_at: string;
  tags?: string[];
  resource_name?: string;
}

/**
 * Структура OpenBao KV секрета (v2)
 * https://openbao.org/docs/secrets/kv/kv-v2/
 */
export interface OpenBaoSecret {
  data: Record<string, string>;
  metadata: {
    created_time: string;
    deletion_time?: string;
    destroyed?: boolean;
    version: number;
    custom_metadata?: Record<string, string>;
  };
}

/**
 * Шаблон поля для создания секрета
 */
export interface SecretFieldTemplate {
  key: string;
  label: string;
  type: 'text' | 'password' | 'textarea' | 'number' | 'url';
  required: boolean;
  placeholder?: string;
  validation?: RegExp;
  helpText?: string;
}

/**
 * Типизированные структуры данных для разных типов секретов
 */
export interface DatabaseSecretData {
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  connection_string?: string;
  ssl?: string;
}

export interface ApiKeySecretData {
  key: string;
  secret?: string;
  endpoint?: string;
  token?: string;
}

export interface CertificateSecretData {
  certificate: string;
  private_key: string;
  ca_certificate?: string;
  passphrase?: string;
}

export interface SshKeySecretData {
  private_key: string;
  public_key?: string;
  username?: string;
  host?: string;
  port?: string;
  passphrase?: string;
}

export interface GenericSecretData {
  [key: string]: string;
}

/**
 * Старая структура для обратной совместимости
 */
export interface LegacySecret {
  name: string;
  login: string;
  password: string;
  host: string;
}

/**
 * Тип для всех возможных структур данных секретов
 */
export type SecretData = 
  | DatabaseSecretData 
  | ApiKeySecretData 
  | CertificateSecretData 
  | SshKeySecretData 
  | GenericSecretData;
