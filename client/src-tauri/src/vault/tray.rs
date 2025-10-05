use tauri::command;
use tauri::Emitter;
use std::process::Command;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct TraySecret {
    pub id: String,
    pub name: String,
    pub secret_type: String,
}

/// Открывает модальное окно создания секрета
#[command]
pub async fn open_create_secret_modal(app: tauri::AppHandle) -> Result<(), String> {
    // Отправляем событие в frontend для открытия модального окна
    app.emit("open-create-secret-modal", ()).map_err(|e| format!("Не удалось отправить событие: {}", e))
}

/// Блокирует хранилище
#[command]
pub async fn lock_vault(app: tauri::AppHandle) -> Result<(), String> {
    // Отправляем событие в frontend для блокировки хранилища
    app.emit("lock-vault", ()).map_err(|e| format!("Не удалось отправить событие: {}", e))
}

/// Очищает буфер обмена
#[command]
pub async fn clear_clipboard() -> Result<(), String> {
    // Попытка очистить буфер обмена через системную команду
    // На Windows
    #[cfg(target_os = "windows")]
    {
        match Command::new("cmd")
            .args(&["/C", "echo off | clip"])
            .output() {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Не удалось очистить буфер обмена: {}", e)),
        }
    }

    // На macOS
    #[cfg(target_os = "macos")]
    {
        match Command::new("pbcopy")
            .arg("")
            .output() {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Не удалось очистить буфер обмена: {}", e)),
        }
    }

    // На Linux
    #[cfg(target_os = "linux")]
    {
        match Command::new("xclip")
            .args(&["-selection", "clipboard"])
            .output() {
            Ok(_) => Ok(()),
            Err(_) => {
                // Попробуем xsel
                match Command::new("xsel")
                    .args(&["--clipboard", "--clear"])
                    .output() {
                    Ok(_) => Ok(()),
                    Err(e) => Err(format!("Не удалось очистить буфер обмена: {}", e)),
                }
            }
        }
    }
}

/// Получает статус хранилища
#[command]
pub async fn get_vault_status() -> Result<String, String> {
    Ok("Готово".to_string())
}

/// Открывает секрет из трея
#[command]
pub async fn open_secret_from_tray(app: tauri::AppHandle, secret_id: String) -> Result<(), String> {
    // Отправляем событие в frontend для открытия секрета
    app.emit("open-secret-from-tray", secret_id).map_err(|e| format!("Не удалось отправить событие: {}", e))
}