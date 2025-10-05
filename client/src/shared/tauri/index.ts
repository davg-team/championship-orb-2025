import { defaultWindowIcon } from "@tauri-apps/api/app";
import { Window } from "@tauri-apps/api/window";
import { Image } from "@tauri-apps/api/image";
import { Menu } from "@tauri-apps/api/menu";
import { TrayIconOptions, TrayIcon } from "@tauri-apps/api/tray";
import { enable } from "@tauri-apps/plugin-autostart";
import { exit } from "@tauri-apps/plugin-process";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

// Глобальные обработчики команд из трея
declare global {
  interface Window {
    __tray_handlers?: {
      open_create_secret_modal?: () => void;
      lock_vault?: () => void;
      clear_clipboard?: () => void;
      get_vault_status?: () => Promise<string>;
      open_secret_from_tray?: (secretId: string) => void;
      get_recently_viewed?: () => any[];
    };
  }
}

// Функции для установки обработчиков команд из трея
export function setTrayHandlers(handlers: {
  openCreateSecretModal?: () => void;
  lockVault?: () => void;
  clearClipboard?: () => void;
  getVaultStatus?: () => Promise<string>;
  openSecretFromTray?: (secretId: string) => void;
  getRecentlyViewed?: () => any[];
}) {
  window.__tray_handlers = {
    open_create_secret_modal: handlers.openCreateSecretModal,
    lock_vault: handlers.lockVault,
    clear_clipboard: handlers.clearClipboard,
    get_vault_status: handlers.getVaultStatus,
    open_secret_from_tray: handlers.openSecretFromTray,
    get_recently_viewed: handlers.getRecentlyViewed,
  };
}

// Tauri команды для трея
export const trayCommands = {
  async openCreateSecretModal() {
    if (window.__tray_handlers?.open_create_secret_modal) {
      window.__tray_handlers.open_create_secret_modal();
    }
  },

  async lockVault() {
    if (window.__tray_handlers?.lock_vault) {
      window.__tray_handlers.lock_vault();
    }
  },

  async clearClipboard() {
    if (window.__tray_handlers?.clear_clipboard) {
      window.__tray_handlers.clear_clipboard();
    } else {
      // Fallback: очистка через браузер API
      if (navigator.clipboard) {
        await navigator.clipboard.writeText("");
      }
    }
  },

  async getVaultStatus(): Promise<string> {
    if (window.__tray_handlers?.get_vault_status) {
      return await window.__tray_handlers.get_vault_status();
    }
    return "Неизвестно";
  },

  getRecentlyViewed(): any[] {
    if (window.__tray_handlers?.get_recently_viewed) {
      return window.__tray_handlers.get_recently_viewed();
    }
    return [];
  },

  async openSecretFromTray(secretId: string) {
    try {
      await invoke("open_secret_from_tray", { secretId });
    } catch (error) {
      console.error("Ошибка открытия секрета из трея:", error);
    }
  },
};

async function createTrayMenu(recentlyViewed: any[] = []) {
  const menuItems: any[] = [
    {
      id: "show",
      text: "Показать окно",
      action: async () => {
        const window = (await Window.getByLabel("main")) as Window;
        await window.show();
        await window.setFocus();
        await window.unminimize();
      },
    },
    {
      id: "hide",
      text: "Скрыть окно",
      action: async () => {
        const window = (await Window.getByLabel("main")) as Window;
        await window.hide();
      },
    },
    {
      id: "separator1",
      item: "Separator",
    },
    {
      id: "create_secret",
      text: "Создать секрет",
      action: async () => {
        const window = (await Window.getByLabel("main")) as Window;
        await window.show();
        await window.setFocus();
        // Вызываем команду для открытия модального окна создания секрета
        await invoke("open_create_secret_modal");
      },
    },
    {
      id: "lock_vault",
      text: "Заблокировать хранилище",
      action: async () => {
        // Вызываем команду для блокировки хранилища
        await invoke("lock_vault");
      },
    },
    {
      id: "clear_clipboard",
      text: "Очистить буфер обмена",
      action: async () => {
        // Вызываем команду для очистки буфера обмена
        await invoke("clear_clipboard");
      },
    },
  ];

  // Добавляем недавно просмотренные секреты
  if (recentlyViewed.length > 0) {
    menuItems.push({
      id: "separator_recently",
      item: "Separator",
    });

    recentlyViewed.forEach((secret) => {
      menuItems.push({
        id: `recent_${secret.id}`,
        text: `${secret.name} (${secret.secret_type})`,
        action: async () => {
          const window = (await Window.getByLabel("main")) as Window;
          await window.show();
          await window.setFocus();
          // Открываем секрет из трея
          await trayCommands.openSecretFromTray(secret.id);
        },
      });
    });
  }

  // Добавляем статус и выход
  menuItems.push(
    {
      id: "separator2",
      item: "Separator",
    },
    {
      id: "status",
      text: "Статус: Загружено",
      enabled: false,
    },
    {
      id: "separator3",
      item: "Separator",
    },
    {
      id: "quit",
      text: "Выйти",
      action: async () => await exit(),
    },
  );

  return await Menu.new({ items: menuItems });
}

export async function bootstrap() {
  // Создаем начальное меню
  const menu = await createTrayMenu([]);
  const trayOptions: TrayIconOptions = {
    icon: (await defaultWindowIcon()) as Image,
    menu,
    menuOnLeftClick: true,
    tooltip: "Championship Orb - Менеджер секретов",
  };

  const tray = await TrayIcon.new(trayOptions);
  tray.setVisible(true);

  // Функция для обновления меню трея
  const updateTrayMenu = async () => {
    try {
      const recentlyViewed = trayCommands.getRecentlyViewed();
      console.log("Обновление меню трея с секретами:", recentlyViewed);
      const newMenu = await createTrayMenu(recentlyViewed);
      tray.setMenu(newMenu);
      console.log("Меню трея обновлено");
    } catch (error) {
      console.error("Ошибка обновления меню трея:", error);
    }
  };

  // Слушатели событий от Rust команд
  await listen("open-create-secret-modal", () => {
    if (window.__tray_handlers?.open_create_secret_modal) {
      window.__tray_handlers.open_create_secret_modal();
    }
  });

  await listen("lock-vault", () => {
    if (window.__tray_handlers?.lock_vault) {
      window.__tray_handlers.lock_vault();
    }
  });

  // Слушатель для открытия секрета из трея
  await listen("open-secret-from-tray", (event) => {
    const secretId = event.payload as string;
    if (window.__tray_handlers?.open_secret_from_tray) {
      window.__tray_handlers.open_secret_from_tray(secretId);
    }
  });

  // Слушатель для обновления меню при изменении недавно просмотренных
  await listen("update-tray-menu", updateTrayMenu);

  // Обновляем меню при запуске
  await updateTrayMenu();

  // Обновляем статус каждые 30 секунд
  setInterval(async () => {
    try {
      const status = await invoke("get_vault_status");
      // Обновляем tooltip с текущим статусом
      tray.setTooltip(`Championship Orb - ${status}`);
    } catch (error) {
      console.error("Ошибка получения статуса:", error);
    }
  }, 30000);

  await enable();

  // Возвращаем функцию для обновления меню
  return { updateTrayMenu };
}
