import { useEffect, useRef } from "react";
import { getToken, getUserFromToken } from "shared/jwt";
import { useToaster } from "@gravity-ui/uikit";
import { useBell } from "./useBell";

const API_URL = "https://orencode.davg-team.ru/api";

export function useBackgroundPushNotifications() {
  const { add } = useToaster();
  const play = useBell();
  const seen = useRef<Set<string>>(new Set());

  const showNotification = (title: string, body: string) => {
    add({
      name: title,
      title,
      content: body,
      autoHiding: 3000,
      theme: "info",
    });
  };

  useEffect(() => {
    const token = getToken();
    const payload = getUserFromToken(token);
    const USER_ID = payload?.sub;
    if (!USER_ID) return;

    const fetchAndNotify = async () => {
      try {
        const res = await fetch(`${API_URL}/notifications?user_id=${USER_ID}`);
        const data = await res.json();

        if (data.status === "success" && Array.isArray(data.data)) {
          for (const n of data.data) {
            if (n.is_new && !seen.current.has(n.id)) {
              showNotification(n.subject, n.body);
              play();
              seen.current.add(n.id);
            }
          }
        }
      } catch (err) {
        console.error("Ошибка при получении уведомлений:", err);
      }
    };

    fetchAndNotify();
    const interval = setInterval(fetchAndNotify, 5000);
    return () => clearInterval(interval);
  }, [showNotification]);

  // ручной триггер
  return { triggerNotification: showNotification };
}

export default useBackgroundPushNotifications;
