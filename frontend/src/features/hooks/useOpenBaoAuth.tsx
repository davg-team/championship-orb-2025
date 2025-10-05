import { useEffect, useState } from "react";
import { getToken } from "shared/jwt";

const useOpenBaoAuth = () => {
  const [token, setToken] = useState<string | null>(null);

  async function updateToken() {
    const url = "https://orencode.davg-team.ru/v1/auth/jwt/login";
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        jwt: getToken(),
        role: "default",
      }),
    });
    const data = await response.json();
    localStorage.setItem("token_ob", data.auth.client_token);
    setToken(data.auth.client_token);
  }

  useEffect(() => {
    updateToken();
  }, []);

  return { token, updateToken };
};

export default useOpenBaoAuth;
