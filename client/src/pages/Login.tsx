import { Flex, Card, Text, Button, Loader } from "@gravity-ui/uikit";
import { useEffect, useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useNavigate } from "react-router-dom";

export interface DeviceAuthorizationResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete?: string;
  expires_in: number;
  interval?: number;
}

const Login = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  useEffect(() => {
    if (!code) return;

    let intervalId: any;

    const fetchToken = async () => {
      try {
        const res = await fetch(
          "https://orencode.davg-team.ru/auth/realms/secretmanager/protocol/openid-connect/token",
          {
            method: "POST",
            headers: {
              Authorization:
                "Basic c2VjcmV0bWFuYWdlci1mcm9udGVuZDpwZTlxbjhIQlhFVTdTR21sQXlLUTV0cDJ2dkpMWXI1cg==",
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              client_id: "secretmanager-frontend",
              grant_type: "urn:ietf:params:oauth:grant-type:device_code",
              device_code: code,
            }),
          },
        );

        if (res.ok) {
          const data = await res.json();
          console.log("Токен получен:", data);
          clearInterval(intervalId);
          localStorage.setItem("refresh", data.refresh_token);
          localStorage.setItem("token", data.access_token);
          navigate("/");
        } else {
          console.log("Токен пока недоступен, продолжаем опрос...");
        }
      } catch (err) {
        console.error(err);
      }
    };

    intervalId = setInterval(fetchToken, 3000);
    return () => clearInterval(intervalId);
  }, [code]);

  return (
    <Flex alignItems={"center"} justifyContent={"center"} height={"100dvh"} style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
      <Card minWidth={"400px"} maxWidth={"500px"} view="raised" spacing={{ p: "6" }} style={{ borderRadius: "16px", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}>
        <Flex direction={"column"} alignItems={"center"} gap="6">
          <img src="/logo/128x128.png" alt="Sema Logo" style={{ width: "80px", height: "80px", borderRadius: "12px" }} />
          <Flex direction={"column"} alignItems={"center"} gap="2">
            <Text style={{ fontSize: "2em", fontWeight: "bold", color: "#333" }}>Sema</Text>
            <Text style={{ fontSize: "1.2em", color: "#666" }}>Менеджер секретов</Text>
            <Text variant="body-2" style={{ textAlign: "center", color: "#888", marginTop: "8px" }}>
              Безопасное хранение и управление вашими конфиденциальными данными
            </Text>
          </Flex>
          <Flex direction={"column"} alignItems={"center"} gap="3" style={{ width: "100%" }}>
            <Text variant="body-3" style={{ fontWeight: "500", color: "#555" }}>Что умеет Sema:</Text>
            <Flex direction={"column"} gap="2" style={{ width: "100%", textAlign: "left" }}>
              <Text variant="body-3" style={{ color: "#666" }}>• 🔐 Шифрование данных с использованием современных алгоритмов</Text>
              <Text variant="body-3" style={{ color: "#666" }}>• 💾 Локальное хранение секретов на вашем устройстве</Text>
              <Text variant="body-3" style={{ color: "#666" }}>• ☁️ Синхронизация с облачным хранилищем</Text>
              <Text variant="body-3" style={{ color: "#666" }}>• 🖥️ Удобный интерфейс с поддержкой темной темы</Text>
              <Text variant="body-3" style={{ color: "#666" }}>• 📱 Кроссплатформенная поддержка (Windows, macOS, Linux)</Text>
            </Flex>
          </Flex>
          <Flex
            direction={"column"}
            alignItems={"center"}
            gap="4"
            width={"100%"}
          >
            {code ? (
              <Flex
                width={"100%"}
                direction={"column"}
                justifyContent={"center"}
                alignItems={"center"}
                gap="4"
              >
                <Loader size="l" />
                <Text variant="body-3" style={{ color: "#666" }}>Подождите, идет авторизация...</Text>
                <Text variant="caption-1" style={{ color: "#999", textAlign: "center" }}>
                  Откройте браузер и введите код подтверждения
                </Text>
              </Flex>
            ) : (
              <Button
                view="action"
                width="max"
                size="l"
                style={{ borderRadius: "8px", fontWeight: "600" }}
                onClick={async () => {
                  const response = await fetch(
                    "https://orencode.davg-team.ru/auth/realms/secretmanager/protocol/openid-connect/auth/device",
                    {
                      method: "POST",
                      headers: {
                        Authorization:
                          "Basic c2VjcmV0bWFuYWdlci1mcm9udGVuZDpwZTlxbjhIQlhFVTdTR21sQXlLUTV0cDJ2dkpMWXI1cg==",
                        "Content-Type": "application/x-www-form-urlencoded",
                      },
                      body: new URLSearchParams({
                        client_id: "secretmanager-frontend",
                        scope: "openid",
                      }),
                    },
                  );

                  const data: DeviceAuthorizationResponse =
                    await response.json();

                  const code = data.device_code;
                  setCode(code);
                  openUrl(data.verification_uri_complete as string);
                }}
              >
                Войти через браузер
              </Button>
            )}
          </Flex>
        </Flex>
      </Card>
    </Flex>
  );
};

export default Login;
