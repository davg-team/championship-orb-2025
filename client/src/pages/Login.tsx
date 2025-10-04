import { Flex, Card, Icon, Text, Button, Loader } from "@gravity-ui/uikit";
import { FaceFun } from "@gravity-ui/icons";
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
          "/api/auth/realms/secretmanager/protocol/openid-connect/token",
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
    <Flex alignItems={"center"} justifyContent={"center"} height={"100dvh"}>
      <Card minWidth={"320px"} view="raised" spacing={{ p: "4" }}>
        <Flex direction={"column"} alignItems={"center"} gap="6">
          <Icon data={FaceFun} size={"50"} />
          <Flex direction={"column"} alignItems={"center"}>
            <Text style={{ fontSize: "1.5em" }}>SecretManager</Text>
            <Text>Локальный клиент</Text>
          </Flex>
          <Flex
            direction={"column"}
            alignItems={"center"}
            gap="2"
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
                <Text variant="body-3">Подождите, идет авторизация...</Text>
              </Flex>
            ) : (
              <Button
                view="action"
                width="max"
                onClick={async () => {
                  const response = await fetch(
                    "/api/auth/realms/secretmanager/protocol/openid-connect/auth/device",
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
                Войти
              </Button>
            )}
          </Flex>
        </Flex>
      </Card>
    </Flex>
  );
};

export default Login;
