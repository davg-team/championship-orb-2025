import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isValidToken, removeToken } from "shared/jwt";

const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  async function processLogin() {
    const query = new URLSearchParams(window.location.hash);
    const tokenFromQuery = query.get("access_token");
    const oldToken = window.localStorage.getItem("token");

    if (tokenFromQuery) {
      window.localStorage.setItem("token", tokenFromQuery);
      navigate("/");
    } else if (oldToken && isValidToken(oldToken)) {
      window.localStorage.setItem("token", oldToken);
      navigate("/");
    } else {
      removeToken();
      navigate("/login");
    }
  }

  useEffect(() => {
    processLogin();
  }, []);

  return <>{children}</>;
};

export default AuthWrapper;
