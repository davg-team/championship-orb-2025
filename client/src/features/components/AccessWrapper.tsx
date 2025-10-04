import { useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { getToken, isValidToken, removeToken } from "shared/jwt";

const AccessWrapper = () => {
  const navigate = useNavigate();
  const location = useLocation();

  async function fetchToken() {
    if (location.pathname === "/" && !isValidToken(getToken())) {
      const refresh = localStorage.getItem("refresh");
      const url =
        "/api/auth/realms/secretmanager/protocol/openid-connect/token";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic c2VjcmV0bWFuYWdlci1mcm9udGVuZDpwZTlxbjhIQlhFVTdTR21sQXlLUTV0cDJ2dkpMWXI1cg==`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refresh as string,
          client_id: "secretmanager-frontend",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        window.localStorage.setItem("token", data.access_token);
        window.localStorage.setItem("refresh", data.refresh_token);
        navigate("/");
      } else {
        navigate("/login");
        removeToken();
      }
    }
  }

  useEffect(() => {
    if (location.pathname === "/" && !isValidToken(getToken())) {
      fetchToken();
    }
  }, [location]);
  return <Outlet />;
};

export default AccessWrapper;
