import { useEffect, useRef } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import {
  isValidToken,
  getToken,
  removeToken,
  getUserFromToken,
} from "shared/jwt";

const AccessWrapper = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const refreshTimer = useRef<number>();

  async function refreshToken() {
    const refresh = localStorage.getItem("refresh");
    if (!refresh) {
      removeToken();
      navigate("/login");
      return;
    }

    const url =
      "https://orencode.davg-team.ru/auth/realms/secretmanager/protocol/openid-connect/token";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic c2VjcmV0bWFuYWdlci1mcm9udGVuZDpwZTlxbjhIQlhFVTdTR21sQXlLUTV0cDJ2dkpMWXI1cg==",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refresh,
        client_id: "secretmanager-frontend",
      }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("refresh", data.refresh_token);
      scheduleRefresh(data.access_token); // запланировать следующее обновление
    } else {
      removeToken();
      navigate("/login");
    }
  }

  function scheduleRefresh(token: string) {
    const payload = getUserFromToken(token);
    if (!payload?.exp) return;

    const expiresAt = payload.exp * 1000;
    const delay = expiresAt - Date.now() - 30_000; // обновить за 30 секунд до конца

    if (delay <= 0) {
      refreshToken();
      return;
    }

    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = window.setTimeout(refreshToken, delay);
  }

  useEffect(() => {
    const token = getToken();

    // если токен невалиден, попробуем обновить
    if (!isValidToken(token)) {
      refreshToken();
    } else {
      // если токен есть и валиден — запланировать обновление
      scheduleRefresh(token as string);
    }

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [location]);

  return <Outlet />;
};

export default AccessWrapper;
