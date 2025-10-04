import { useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { getToken, isValidToken, removeToken } from "shared/jwt";

const AccessWrapper = () => {
  const navigate = useNavigate();
  const location = useLocation();

  async function fetchToken() {
    if (location.pathname === "/" && !isValidToken(getToken())) {
      navigate("/login");
      removeToken();
    }
  }

  useEffect(() => {
    fetchToken();
  }, [location]);
  return <Outlet />;
};

export default AccessWrapper;
