use base64::{engine::general_purpose, Engine as _};
use keyring::Entry;
use rand::rngs::OsRng;
use rand::RngCore; // обязательно для fill_bytes

pub const SERVICE: &str = "myapp.vault";
pub const USER: &str = "master";

pub fn set_master(b64: &str) -> Result<(), String> {
    let entry = Entry::new(SERVICE, USER); // Entry::new возвращает Entry, не Result
    entry
        .set_password(b64)
        .map_err(|e| format!("keyring set err: {:?}", e))?;
    Ok(())
}

#[tauri::command]
pub fn get_master_bytes() -> Result<[u8; 32], String> {
    let entry = Entry::new(SERVICE, USER); // убрал map_err
    let b64 = entry
        .get_password()
        .map_err(|e| format!("keyring get err: {:?}", e))?;
    let bytes = general_purpose::STANDARD
        .decode(&b64)
        .map_err(|e| format!("base64 decode: {:?}", e))?;
    if bytes.len() != 32 {
        return Err("invalid master key length".into());
    }
    let mut arr = [0u8; 32];
    arr.copy_from_slice(&bytes[..32]);
    Ok(arr)
}

// Функция init_master: сгенерировать новый ключ, если нет
#[tauri::command]
pub fn init_master() -> Result<(), String> {
    let entry = Entry::new(SERVICE, USER);
    match entry.get_password() {
        Ok(_) => Ok(()),
        Err(_) => {
            let mut key = [0u8; 32];
            OsRng
                .try_fill_bytes(&mut key)
                .map_err(|e| format!("rng err: {:?}", e))?;
            let b64 = general_purpose::STANDARD.encode(&key);
            entry
                .set_password(&b64)
                .map_err(|e| format!("keyring set err: {:?}", e))
        }
    }
}
