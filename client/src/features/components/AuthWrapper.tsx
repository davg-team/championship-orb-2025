import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isValidToken, removeToken } from "shared/jwt";

const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  async function processLogin() {
    const query = new URLSearchParams(window.location.hash);
    console.log(query);
    const tokenFromQuery = query.get("access_token");
    console.log(tokenFromQuery);
    const refreshFromQuery = query.get("refresh_token");
    console.log(refreshFromQuery);
    const oldToken = window.localStorage.getItem("token");
    console.log(oldToken);

    if (tokenFromQuery) {
      window.localStorage.setItem("refresh", refreshFromQuery as string);
      window.localStorage.setItem("token", tokenFromQuery);
      navigate("/");
    } else if (oldToken && isValidToken(oldToken)) {
      navigate("/");
    } else {
      navigate("/login");
      removeToken();
    }
  }

  useEffect(() => {
    processLogin();
  }, []);

  return <>{children}</>;
};

export default AuthWrapper;
