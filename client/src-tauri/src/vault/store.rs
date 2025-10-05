use crate::vault::crypto;
use base64::{engine::general_purpose, Engine as _};
use chrono::Utc;
use dirs_next;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs;
use std::path::PathBuf;
use tauri::command;

#[derive(Serialize, Deserialize)]
pub struct CredentialItem {
    pub id: String,
    pub created_at: String,
    pub nonce: String,
    pub name: String,
    pub login: String,
    pub password: String,
    pub host: String,
}

#[derive(Serialize, Deserialize, Default)]
pub struct MasterKeyEncrypted {
    pub ciphertext: String,
    pub nonce: String,
}

#[derive(Serialize, Deserialize, Default)]
pub struct Store {
    pub version: u32,
    pub items: Vec<CredentialItem>,
    pub master_enc: Option<MasterKeyEncrypted>,
}

// ===================== PATH =====================
fn store_path() -> Result<PathBuf, String> {
    let mut dir = dirs_next::config_dir().ok_or("no config dir".to_string())?;
    dir.push("my-tauri-app");
    dir.push("v1");
    fs::create_dir_all(&dir).map_err(|e| format!("mkdir err {:?}", e))?;
    dir.push("store.json");
    Ok(dir)
}

// ===================== LOAD / SAVE =====================
fn load_store() -> Result<Store, String> {
    let p = store_path()?;
    if !p.exists() {
        return Ok(Store {
            version: 1,
            items: vec![],
            master_enc: None,
        });
    }
    let s = fs::read_to_string(p).map_err(|e| format!("read err {:?}", e))?;
    serde_json::from_str(&s).map_err(|e| format!("json parse err {:?}", e))
}

fn save_store(st: &Store) -> Result<(), String> {
    let p = store_path()?;
    let s = serde_json::to_string_pretty(st).map_err(|e| format!("json ser err {:?}", e))?;
    fs::write(p, s).map_err(|e| format!("write err {:?}", e))
}

// ===================== PASSWORD TO 32-BYTE KEY =====================
fn password_to_key(password: &str) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(password.as_bytes());
    let result = hasher.finalize();
    let mut key = [0u8; 32];
    key.copy_from_slice(&result);
    key
}

// ===================== MASTER KEY =====================
fn encrypt_master(master: &[u8; 32], password: &str) -> Result<MasterKeyEncrypted, String> {
    let key = password_to_key(password);
    let (ciphertext, nonce) = crypto::encrypt_with_key(&key, master, None)?;
    Ok(MasterKeyEncrypted { ciphertext, nonce })
}

fn decrypt_master(enc: &MasterKeyEncrypted, password: &str) -> Result<[u8; 32], String> {
    let key = password_to_key(password);
    let plain = crypto::decrypt_with_key(&key, &enc.ciphertext, &enc.nonce, None)?;
    if plain.len() != 32 {
        return Err("invalid master key length".into());
    }
    let mut master = [0u8; 32];
    master.copy_from_slice(&plain);
    Ok(master)
}

fn get_master_bytes(password: &str) -> Result<[u8; 32], String> {
    let st = load_store()?;
    let enc = st.master_enc.as_ref().ok_or("master key not set")?;
    decrypt_master(enc, password)
}

// ===================== ITEMS =====================
#[command]
pub fn encrypt_item(
    id: String,
    name: String,
    login: String,
    password_field: String,
    host: String,
    master_password: String,
) -> Result<(), String> {
    let master_key = get_master_bytes(&master_password)?;

    let (enc_name, nonce_name) = crypto::encrypt_with_key(&master_key, name.as_bytes(), None)?;
    let (enc_login, nonce_login) = crypto::encrypt_with_key(&master_key, login.as_bytes(), None)?;
    let (enc_pass, nonce_pass) =
        crypto::encrypt_with_key(&master_key, password_field.as_bytes(), None)?;
    let (enc_host, nonce_host) = crypto::encrypt_with_key(&master_key, host.as_bytes(), None)?;

    let item = CredentialItem {
        id: id.clone(),
        created_at: Utc::now().to_rfc3339(),
        nonce: nonce_name, // просто сохраняем первый nonce, остальные можно расширить
        name: enc_name,
        login: enc_login,
        password: enc_pass,
        host: enc_host,
    };

    let mut st = load_store()?;
    st.items.retain(|it| it.id != id);
    st.items.push(item);
    save_store(&st)
}

#[command]
pub fn decrypt_item(
    id: String,
    master_password: String,
) -> Result<(String, String, String, String), String> {
    let master_key = get_master_bytes(&master_password)?;
    let st = load_store()?;
    let item = st
        .items
        .into_iter()
        .find(|it| it.id == id)
        .ok_or("not found".to_string())?;

    let name = String::from_utf8(crypto::decrypt_with_key(
        &master_key,
        &item.name,
        &item.nonce,
        None,
    )?)
    .map_err(|e| format!("utf8 decode: {:?}", e))?;
    let login = String::from_utf8(crypto::decrypt_with_key(
        &master_key,
        &item.login,
        &item.nonce,
        None,
    )?)
    .map_err(|e| format!("utf8 decode: {:?}", e))?;
    let password_field = String::from_utf8(crypto::decrypt_with_key(
        &master_key,
        &item.password,
        &item.nonce,
        None,
    )?)
    .map_err(|e| format!("utf8 decode: {:?}", e))?;
    let host = String::from_utf8(crypto::decrypt_with_key(
        &master_key,
        &item.host,
        &item.nonce,
        None,
    )?)
    .map_err(|e| format!("utf8 decode: {:?}", e))?;

    Ok((name, login, password_field, host))
}

#[command]
pub fn list_items() -> Result<Vec<(String, String)>, String> {
    let st = load_store()?;
    Ok(st
        .items
        .into_iter()
        .map(|it| (it.id, it.created_at))
        .collect())
}

#[command]
pub fn delete_item(id: String) -> Result<(), String> {
    let mut st = load_store()?;
    st.items.retain(|it| it.id != id);
    save_store(&st)
}
