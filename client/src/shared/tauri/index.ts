import { defaultWindowIcon } from "@tauri-apps/api/app";
import { Window } from "@tauri-apps/api/window";
import { Image } from "@tauri-apps/api/image";
import { Menu } from "@tauri-apps/api/menu";
import { TrayIconOptions, TrayIcon } from "@tauri-apps/api/tray";
import { enable } from "@tauri-apps/plugin-autostart";
import { exit } from "@tauri-apps/plugin-process";

export async function bootstrap() {
  const menu = await Menu.new({
    items: [
      {
        id: "open",
        text: "Открыть",
        action: async () => {
          const window = (await Window.getByLabel("main")) as Window;

          const isVisible = await window.isVisible();
          const isMinimized = await window.isMinimized();

          if (isMinimized) {
            await window.unminimize();
          }

          if (!isVisible) {
            await window.show();
          }

          await window.setFocus();
        },
      },
      {
        id: "quit",
        text: "Выйти",
        action: async () => await exit(),
      },
    ],
  });

  const trayOptions: TrayIconOptions = {
    icon: (await defaultWindowIcon()) as Image,
    menu,
    menuOnLeftClick: true,
  };

  const tray = await TrayIcon.new(trayOptions);
  tray.setVisible(true);

  await enable();
}
