mod vault;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            // Команды инициализации хранилища
            vault::secrets::is_vault_initialized,
            vault::secrets::initialize_vault,
            vault::secrets::verify_vault_password,
            vault::secrets::change_master_password,
            // Команды для работы с секретами
            vault::secrets::save_secret,
            vault::secrets::get_secret,
            vault::secrets::list_secrets,
            vault::secrets::update_secret,
            vault::secrets::delete_secret,
            // Команды для трея
            vault::tray::open_create_secret_modal,
            vault::tray::lock_vault,
            vault::tray::clear_clipboard,
            vault::tray::get_vault_status,
            vault::tray::open_secret_from_tray,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
