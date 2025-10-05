import { useEffect, useState } from "react";
import { openBaoService } from "../../services/openBaoService";

const useOpenBaoAuth = () => {
  const [token, setToken] = useState<string | null>(null);

  async function updateToken() {
    try {
      const openBaoToken = await openBaoService.getOpenBaoToken(true);
      setToken(openBaoToken);
    } catch (error) {
      console.error("❌ Ошибка получения OpenBao токена:", error);
      setToken(null);
    }
  }

  useEffect(() => {
    updateToken();
  }, []);

  return { token, updateToken };
};

export default useOpenBaoAuth;
