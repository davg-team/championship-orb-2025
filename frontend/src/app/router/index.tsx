import { Flex, Loader } from "@gravity-ui/uikit";
import AccessWrapper from "features/components/AccessWrapper";
import AuthWrapper from "features/components/AuthWrapper";
import Login from "pages/Login";
import Main from "pages/Main";
import Page404 from "pages/Page404";
import { Routes, Route } from "react-router-dom";

const Router = () => {
  return (
    <Routes>
      <Route element={<AccessWrapper />}>
        <Route path="/" element={<Main />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/callback/auth"
          element={
            <AuthWrapper>
              <Flex width={"100%"} height={"100%"}>
                <Loader size="l" />
              </Flex>
            </AuthWrapper>
          }
        />
        <Route path="*" element={<Page404 />} />
      </Route>
    </Routes>
  );
};

export default Router;
