use crate::vault::crypto;
use chrono::Utc;
use dirs_next;
use serde::{Deserialize, Serialize};
use serde_json;
use sha2::{Digest, Sha256};
use std::fs;
use std::path::PathBuf;
use tauri::command;

// ===================== СТРУКТУРЫ =====================

/// Зашифрованный секрет (как хранится на диске)
#[derive(Serialize, Deserialize, Clone)]
pub struct EncryptedSecret {
    pub id: String,
    pub encrypted_data: String, // Base64 зашифрованного JSON
    pub nonce: String,           // Base64 nonce
    pub created_at: String,
    // Метаданные для списка (незашифрованные)
    pub name: String,
    pub r#type: String,
    pub expires_at: Option<String>,
}

/// Метаданные секрета для списка (без чувствительных данных)
#[derive(Serialize, Deserialize, Clone)]
pub struct SecretListItem {
    pub id: String,
    pub name: String,
    pub r#type: String,
    pub created_at: String,
    pub expires_at: Option<String>,
}

/// Структура секрета (новый универсальный формат)
#[derive(Serialize, Deserialize, Clone)]
pub struct Secret {
    pub id: String,
    pub name: String,
    pub r#type: String,
    pub data: serde_json::Value,
    pub metadata: serde_json::Value,
}

/// Хранилище секретов
#[derive(Serialize, Deserialize)]
pub struct SecretStore {
    pub version: u32,
    pub initialized: bool,
    pub password_hash: String, // SHA-256 хеш мастер-пароля для проверки
    pub secrets: Vec<EncryptedSecret>,
}

impl Default for SecretStore {
    fn default() -> Self {
        Self {
            version: 2,
            initialized: false,
            password_hash: String::new(),
            secrets: vec![],
        }
    }
}

// Структуры параметров больше не нужны - Tauri автоматически маппит параметры

fn secrets_store_path() -> Result<PathBuf, String> {
    let mut dir = dirs_next::config_dir().ok_or("Не удалось найти config dir".to_string())?;
    dir.push("my-tauri-app");
    dir.push("v2"); // Новая версия для универсальных секретов
    fs::create_dir_all(&dir).map_err(|e| format!("Ошибка создания директории: {:?}", e))?;
    dir.push("secrets.json");
    Ok(dir)
}

// ===================== ЗАГРУЗКА / СОХРАНЕНИЕ =====================

fn load_secret_store() -> Result<SecretStore, String> {
    let path = secrets_store_path()?;
    if !path.exists() {
        return Ok(SecretStore {
            version: 2,
            initialized: false,
            password_hash: String::new(),
            secrets: vec![],
        });
    }
    let content = fs::read_to_string(path).map_err(|e| format!("Ошибка чтения файла: {:?}", e))?;

    // Пробуем загрузить как новую версию
    match serde_json::from_str::<SecretStore>(&content) {
        Ok(store) => Ok(store),
        Err(_) => {
            // Если не получилось, пробуем загрузить как старую версию и мигрировать
            #[derive(Deserialize)]
            struct OldSecretStore {
                version: u32,
                secrets: Vec<EncryptedSecret>,
            }

            match serde_json::from_str::<OldSecretStore>(&content) {
                Ok(old_store) => {
                    // Миграция со старой версии
                    Ok(SecretStore {
                        version: 2,
                        initialized: false, // Требует повторной инициализации
                        password_hash: String::new(),
                        secrets: old_store.secrets,
                    })
                }
                Err(e) => Err(format!("Ошибка парсинга JSON: {:?}", e))
            }
        }
    }
}

fn save_secret_store(store: &SecretStore) -> Result<(), String> {
    let path = secrets_store_path()?;
    let content =
        serde_json::to_string_pretty(store).map_err(|e| format!("Ошибка сериализации: {:?}", e))?;
    fs::write(path, content).map_err(|e| format!("Ошибка записи файла: {:?}", e))
}

// ===================== КЛЮЧ ИЗ ПАРОЛЯ =====================

fn hash_password(password: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(password.as_bytes());
    let result = hasher.finalize();
    hex::encode(result)
}

fn password_to_key(password: &str) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(password.as_bytes());
    hasher.update(b"encryption_key_salt"); // Добавляем соль для ключа шифрования
    let result = hasher.finalize();
    let mut key = [0u8; 32];
    key.copy_from_slice(&result);
    key
}

fn verify_master_password(store: &SecretStore, password: &str) -> Result<(), String> {
    if !store.initialized {
        return Err("Хранилище не инициализировано".to_string());
    }
    
    let provided_hash = hash_password(password);
    if provided_hash != store.password_hash {
        return Err("Неверный мастер-пароль".to_string());
    }
    
    Ok(())
}

// ===================== TAURI КОМАНДЫ =====================

/// Проверить, инициализировано ли хранилище
#[command]
pub fn is_vault_initialized() -> Result<bool, String> {
    let store = load_secret_store()?;
    Ok(store.initialized)
}

/// Инициализировать хранилище с мастер-паролем
#[command]
pub fn initialize_vault(master_password: String) -> Result<(), String> {
    if master_password.len() < 8 {
        return Err("Мастер-пароль должен содержать минимум 8 символов".to_string());
    }
    
    let mut store = load_secret_store()?;
    
    if store.initialized {
        return Err("Хранилище уже инициализировано".to_string());
    }
    
    store.initialized = true;
    store.password_hash = hash_password(&master_password);
    store.version = 2;
    
    save_secret_store(&store)?;
    Ok(())
}

/// Проверить мастер-пароль
#[command]
pub fn verify_vault_password(master_password: String) -> Result<bool, String> {
    let store = load_secret_store()?;
    match verify_master_password(&store, &master_password) {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}

/// Изменить мастер-пароль (требуется старый пароль)
#[command]
pub fn change_master_password(old_password: String, new_password: String) -> Result<(), String> {
    if new_password.len() < 8 {
        return Err("Новый пароль должен содержать минимум 8 символов".to_string());
    }
    
    let mut store = load_secret_store()?;
    verify_master_password(&store, &old_password)?;
    
    // Нужно перешифровать все секреты с новым паролем
    let old_key = password_to_key(&old_password);
    let new_key = password_to_key(&new_password);
    
    for secret in &mut store.secrets {
        // Расшифровываем старым ключом
        let decrypted = crypto::decrypt_with_key(
            &old_key,
            &secret.encrypted_data,
            &secret.nonce,
            None,
        )?;
        
        // Шифруем новым ключом
        let (new_encrypted, new_nonce) = crypto::encrypt_with_key(&new_key, &decrypted, None)?;
        secret.encrypted_data = new_encrypted;
        secret.nonce = new_nonce;
    }
    
    store.password_hash = hash_password(&new_password);
    save_secret_store(&store)?;
    
    Ok(())
}

/// Сохранить новый секрет
#[command]
pub fn save_secret(secret: String, master_password: String) -> Result<(), String> {
    let store = load_secret_store()?;
    verify_master_password(&store, &master_password)?;
    
    let master_key = password_to_key(&master_password);
    
    // Парсим секрет из JSON
    let secret_value: serde_json::Value = serde_json::from_str(&secret)
        .map_err(|e| format!("Ошибка парсинга секрета: {:?}", e))?;
    
    let id = secret_value
        .get("id")
        .and_then(|v| v.as_str())
        .ok_or("Отсутствует поле id")?
        .to_string();
    
    let name = secret_value
        .get("name")
        .and_then(|v| v.as_str())
        .unwrap_or("Без названия")
        .to_string();
    
    let secret_type = secret_value
        .get("type")
        .and_then(|v| v.as_str())
        .unwrap_or("generic")
        .to_string();
    
    let expires_at = secret_value
        .get("metadata")
        .and_then(|m| m.get("expires_at"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    
    // Шифруем весь JSON секрета
    let secret_bytes = secret.as_bytes();
    let (encrypted_data, nonce) = crypto::encrypt_with_key(&master_key, secret_bytes, None)?;
    
    let encrypted_secret = EncryptedSecret {
        id: id.clone(),
        encrypted_data,
        nonce,
        created_at: Utc::now().to_rfc3339(),
        name,
        r#type: secret_type,
        expires_at,
    };
    
    // Загружаем хранилище и добавляем/обновляем секрет
    let mut store = load_secret_store()?;
    store.secrets.retain(|s| s.id != id);
    store.secrets.push(encrypted_secret);
    save_secret_store(&store)?;
    
    Ok(())
}

/// Получить секрет по ID
#[command]
pub fn get_secret(id: String, master_password: String) -> Result<String, String> {
    let store = load_secret_store()?;
    verify_master_password(&store, &master_password)?;
    
    let master_key = password_to_key(&master_password);
    
    let encrypted = store
        .secrets
        .iter()
        .find(|s| s.id == id)
        .ok_or_else(|| format!("Секрет с ID {} не найден", id))?;
    
    // Расшифровываем
    let decrypted_bytes = crypto::decrypt_with_key(
        &master_key,
        &encrypted.encrypted_data,
        &encrypted.nonce,
        None,
    )?;
    
    let decrypted_str = String::from_utf8(decrypted_bytes)
        .map_err(|e| format!("Ошибка UTF-8: {:?}", e))?;
    
    Ok(decrypted_str)
}

/// Получить список всех секретов (только метаданные)
#[command]
pub fn list_secrets() -> Result<String, String> {
    let store = load_secret_store()?;
    let list_items: Vec<SecretListItem> = store
        .secrets
        .iter()
        .map(|encrypted| SecretListItem {
            id: encrypted.id.clone(),
            name: encrypted.name.clone(),
            r#type: encrypted.r#type.clone(),
            created_at: encrypted.created_at.clone(),
            expires_at: encrypted.expires_at.clone(),
        })
        .collect();
    
    serde_json::to_string(&list_items).map_err(|e| format!("Ошибка сериализации: {:?}", e))
}

/// Обновить секрет
#[command]
pub fn update_secret(secret: String, master_password: String) -> Result<(), String> {
    // Обновление = удаление + сохранение
    save_secret(secret, master_password)
}

/// Удалить секрет
#[command]
pub fn delete_secret(id: String) -> Result<(), String> {
    let mut store = load_secret_store()?;
    let initial_len = store.secrets.len();
    store.secrets.retain(|s| s.id != id);
    
    if store.secrets.len() == initial_len {
        return Err(format!("Секрет с ID {} не найден", id));
    }
    
    save_secret_store(&store)?;
    Ok(())
}
